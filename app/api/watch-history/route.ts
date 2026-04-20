import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getMediaDetailsWithCache } from '@/lib/tmdb-cache';
import { resolveResumeEpisode, COMPLETION_THRESHOLD } from '@/lib/resume-episode';
import { getContinueWatchingItems } from '@/lib/continue-watching';
import { getUserLanguage } from '@/lib/language-server';

/**
 * 🎬 API de Watch History - Production Ready (Netflix-like)
 * 
 * Funcionalidades:
 * - GET: Buscar histórico do usuário (paginado)
 * - POST: Salvar/atualizar progresso (suporta séries e filmes)
 * - DELETE: Remover item específico do histórico
 * 
 * Características produção:
 * ✅ Suporte completo para séries (season + episode tracking)
 * ✅ Suporte para filmes (seasonNumber=0, episodeNumber=0)
 * ✅ Validações robustas de dados
 * ✅ Rate limiting inteligente
 * ✅ Cache compartilhado TMDB (zero requests desnecessários)
 * ✅ Queries otimizadas com índices compostos
 * ✅ Upsert para evitar race conditions
 * ✅ Error handling completo
 * ✅ Type safety total
 * 
 * Schema WatchHistory:
 * - userId, tmdbId, mediaType, seasonNumber, episodeNumber
 * - progress (0-100), lastWatchedAt, createdAt
 * - Unique constraint: [userId, tmdbId, mediaType, seasonNumber, episodeNumber]
 */

/**
 * GET /api/watch-history
 * 
 * Busca histórico de visualização do usuário autenticado.
 * 
 * Query params opcionais:
 * - limit: número de itens (default: 50, max: 100)
 * - tmdbId: filtrar por mídia específica (retorna todos os episódios de uma série)
 * - mediaType: 'movie' ou 'tv'
 * 
 * Retorna:
 * - Array de items com progresso, season/episode (se série)
 * - Enriquecido com dados do TMDB (título, poster)
 * - Ordenado por lastWatchedAt DESC
 * 
 * Modo especial: ?continueWatching=true
 * - Retorna itens prontos para exibição no "Continue Assistindo"
 * - Filmes: progresso entre 10% e 90% (não completos)
 * - Séries: episódio atual em progresso OU próximo episódio se o atual foi completado
 *   - Apenas séries com pelo menos 1 episódio >= 10% de progresso aparecem
 * - Inclui backdrop, título e informações de episódio
 */
export async function GET(request: NextRequest) {
    try {
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        // Detectar idioma do usuário (preferências DB → Accept-Language → en-US)
        const acceptLanguage = headersList.get('accept-language');
        const userLanguage = await getUserLanguage(session.user.id, acceptLanguage);

        // Rate limiting: 60 req/min (leitura é barata)
        const rateLimitResult = rateLimit(`watch-history:get:${session.user.id}`, {
            limit: 60,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const continueWatching = searchParams.get('continueWatching') === 'true';

        // ========== MODO: CONTINUE WATCHING ==========
        if (continueWatching) {
            return handleContinueWatching(session.user.id, userLanguage, rateLimitResult);
        }

        const limitParam = searchParams.get('limit');
        const tmdbIdParam = searchParams.get('tmdbId');
        const mediaTypeParam = searchParams.get('mediaType');

        // Validar limit (default: 50, max: 100)
        const limit = limitParam
            ? Math.min(Math.max(parseInt(limitParam), 1), 100)
            : 50;

        // Build where clause
        const where: any = {
            userId: session.user.id,
        };

        if (tmdbIdParam) {
            const tmdbId = parseInt(tmdbIdParam);
            if (isNaN(tmdbId) || tmdbId <= 0) {
                return NextResponse.json(
                    { error: 'api.watchHistory.invalidTmdbId' },
                    { status: 400 }
                );
            }
            where.tmdbId = tmdbId;
        }

        if (mediaTypeParam) {
            if (mediaTypeParam !== 'movie' && mediaTypeParam !== 'tv') {
                return NextResponse.json(
                    { error: 'api.validation.mediaTypeMovieOrTv' },
                    { status: 400 }
                );
            }
            where.mediaType = mediaTypeParam;
        }

        // Buscar histórico
        const watchHistory = await prisma.watchHistory.findMany({
            where,
            orderBy: {
                lastWatchedAt: 'desc',
            },
            take: limit,
        });

        // Enriquecer com dados do TMDB (usa cache compartilhado)
        const enrichedHistory = await Promise.all(
            watchHistory.map(async (item) => {
                try {
                    const details = await getMediaDetailsWithCache(
                        item.tmdbId,
                        item.mediaType as 'movie' | 'tv',
                        userLanguage
                    );

                    if (details) {
                        return {
                            id: item.id,
                            tmdbId: item.tmdbId,
                            mediaType: item.mediaType,
                            seasonNumber: item.seasonNumber,
                            episodeNumber: item.episodeNumber,
                            progress: item.progress,
                            lastWatchedAt: item.lastWatchedAt.toISOString(),
                            createdAt: item.createdAt.toISOString(),
                            // TMDB enrichment
                            title: details.title || details.name || `ID: ${item.tmdbId}`,
                            posterPath: details.poster_path,
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching details for ${item.mediaType}/${item.tmdbId}:`, error);
                }

                // Fallback se TMDB falhar
                return {
                    id: item.id,
                    tmdbId: item.tmdbId,
                    mediaType: item.mediaType,
                    seasonNumber: item.seasonNumber,
                    episodeNumber: item.episodeNumber,
                    progress: item.progress,
                    lastWatchedAt: item.lastWatchedAt.toISOString(),
                    createdAt: item.createdAt.toISOString(),
                    title: `ID: ${item.tmdbId}`,
                    posterPath: null,
                };
            })
        );

        return NextResponse.json(
            {
                history: enrichedHistory,
                count: enrichedHistory.length,
            },
            { headers: getRateLimitHeaders(rateLimitResult) }
        );
    } catch (error) {
        console.error('❌ Error fetching watch history:', error);
        return NextResponse.json(
            { error: 'api.watchHistory.fetchError' },
            { status: 500 }
        );
    }
}

/**
 * Handles the "Continue Watching" mode.
 * Computes ready-to-display items with next-episode logic for series.
 */
async function handleContinueWatching(
    userId: string,
    userLanguage: string,
    rateLimitResult: { success: boolean; limit: number; remaining: number; resetAt: number }
) {
    const allItems = await getContinueWatchingItems(userId, userLanguage, 10);

    return NextResponse.json(
        { items: allItems, count: allItems.length },
        { headers: getRateLimitHeaders(rateLimitResult) }
    );
}

/**
 * POST /api/watch-history
 * 
 * Salva ou atualiza progresso de visualização.
 * Chamado automaticamente pelo VideoPlayer a cada 2 segundos (com debounce).
 * 
 * Body (JSON):
 * - tmdbId: number (required)
 * - mediaType: 'movie' | 'tv' (required)
 * - progress: number 0-100 (required)
 * - seasonNumber: number (required para 'tv', 0 para 'movie')
 * - episodeNumber: number (required para 'tv', 0 para 'movie')
 * 
 * Comportamento:
 * - Filmes: seasonNumber=0, episodeNumber=0
 * - Séries: seasonNumber >= 1, episodeNumber >= 1
 * - Upsert: cria ou atualiza baseado em unique constraint
 * - 204 No Content (frontend não precisa da resposta)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        // Rate limiting: 30 req/min (com debounce de 2s no cliente)
        const rateLimitResult = rateLimit(`watch-history:post:${session.user.id}`, {
            limit: 30,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const body = await request.json();
        const { tmdbId, mediaType, progress, seasonNumber, episodeNumber } = body;

        // ========== VALIDAÇÕES ROBUSTAS ==========

        // Validar tmdbId
        if (!tmdbId || typeof tmdbId !== 'number' || tmdbId <= 0 || !Number.isInteger(tmdbId)) {
            return NextResponse.json(
                { error: 'api.watchHistory.tmdbIdRequired' },
                { status: 400 }
            );
        }

        // Validar mediaType
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
            return NextResponse.json(
                { error: 'api.validation.mediaTypeMovieOrTv' },
                { status: 400 }
            );
        }

        // Validar progress
        if (progress === undefined || progress === null || typeof progress !== 'number' || isNaN(progress)) {
            return NextResponse.json(
                { error: 'api.watchHistory.progressRequired' },
                { status: 400 }
            );
        }

        if (progress < 0 || progress > 100) {
            return NextResponse.json(
                { error: 'api.watchHistory.progressRange' },
                { status: 400 }
            );
        }

        // Validar seasonNumber e episodeNumber conforme mediaType
        let validSeasonNumber: number;
        let validEpisodeNumber: number;

        if (mediaType === 'movie') {
            // Filmes: sempre season=0, episode=0 (internamente)
            validSeasonNumber = 0;
            validEpisodeNumber = 0;

            // Se cliente enviou season/episode para filme, retornar erro
            if (seasonNumber !== undefined || episodeNumber !== undefined) {
                return NextResponse.json(
                    { error: 'api.watchHistory.movieNoEpisode' },
                    { status: 400 }
                );
            }
        } else {
            // Séries: season e episode são obrigatórios e devem ser >= 1
            if (seasonNumber === undefined || seasonNumber === null ||
                typeof seasonNumber !== 'number' || !Number.isInteger(seasonNumber) || seasonNumber < 1) {
                return NextResponse.json(
                    { error: 'api.watchHistory.seasonRequired' },
                    { status: 400 }
                );
            }

            if (episodeNumber === undefined || episodeNumber === null ||
                typeof episodeNumber !== 'number' || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
                return NextResponse.json(
                    { error: 'api.watchHistory.episodeRequired' },
                    { status: 400 }
                );
            }

            validSeasonNumber = seasonNumber;
            validEpisodeNumber = episodeNumber;
        }

        // Clamping progress (garantir 0-100)
        const validProgress = Math.min(Math.max(progress, 0), 100);

        // ========== UPSERT (atomic operation) ==========
        await prisma.watchHistory.upsert({
            where: {
                userId_tmdbId_mediaType_seasonNumber_episodeNumber: {
                    userId: session.user.id,
                    tmdbId: tmdbId,
                    mediaType: mediaType,
                    seasonNumber: validSeasonNumber,
                    episodeNumber: validEpisodeNumber,
                },
            },
            update: {
                progress: validProgress,
                lastWatchedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                tmdbId: tmdbId,
                mediaType: mediaType,
                seasonNumber: validSeasonNumber,
                episodeNumber: validEpisodeNumber,
                progress: validProgress,
                lastWatchedAt: new Date(),
            },
        });

        // 204 No Content - Frontend não precisa de resposta (autosave silencioso)
        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('❌ Error saving watch history:', error);
        return NextResponse.json(
            { error: 'api.watchHistory.saveError' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/watch-history
 * 
 * Remove um item específico do histórico.
 * 
 * Query params:
 * - tmdbId: number (required)
 * - mediaType: 'movie' | 'tv' (required)
 * - seasonNumber: number (required para 'tv', 0 para 'movie')
 * - episodeNumber: number (required para 'tv', 0 para 'movie')
 * 
 * Retorna:
 * - 204 No Content (sucesso)
 * - 400 Bad Request (validação falhou)
 * - 404 Not Found (item não existe)
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        // Rate limiting: 10 req/min (operação menos frequente)
        const rateLimitResult = rateLimit(`watch-history:delete:${session.user.id}`, {
            limit: 10,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const { searchParams } = new URL(request.url);
        const tmdbIdParam = searchParams.get('tmdbId');
        const mediaType = searchParams.get('mediaType');
        const seasonNumberParam = searchParams.get('seasonNumber');
        const episodeNumberParam = searchParams.get('episodeNumber');

        // ========== VALIDAÇÕES ==========

        // Validar tmdbId
        if (!tmdbIdParam) {
            return NextResponse.json(
                { error: 'api.watchHistory.tmdbIdMissing' },
                { status: 400 }
            );
        }

        const tmdbId = parseInt(tmdbIdParam);
        if (isNaN(tmdbId) || tmdbId <= 0) {
            return NextResponse.json(
                { error: 'api.watchHistory.tmdbIdRequired' },
                { status: 400 }
            );
        }

        // Validar mediaType
        if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
            return NextResponse.json(
                { error: 'api.validation.mediaTypeMovieOrTv' },
                { status: 400 }
            );
        }

        // Determinar se é delete de episódio específico ou de toda a série/filme
        const seasonNumber = seasonNumberParam ? parseInt(seasonNumberParam) : null;
        const episodeNumber = episodeNumberParam ? parseInt(episodeNumberParam) : null;

        if (seasonNumber !== null && (isNaN(seasonNumber) || seasonNumber < 0)) {
            return NextResponse.json(
                { error: 'api.watchHistory.seasonRange' },
                { status: 400 }
            );
        }

        if (episodeNumber !== null && (isNaN(episodeNumber) || episodeNumber < 0)) {
            return NextResponse.json(
                { error: 'api.watchHistory.episodeRange' },
                { status: 400 }
            );
        }

        // ========== DELETE ==========
        try {
            if (mediaType === 'movie' || (seasonNumber !== null && episodeNumber !== null)) {
                // Delete de item específico (filme ou episódio com season+ep)
                await prisma.watchHistory.delete({
                    where: {
                        userId_tmdbId_mediaType_seasonNumber_episodeNumber: {
                            userId: session.user.id,
                            tmdbId: tmdbId,
                            mediaType: mediaType,
                            seasonNumber: mediaType === 'movie' ? 0 : seasonNumber!,
                            episodeNumber: mediaType === 'movie' ? 0 : episodeNumber!,
                        },
                    },
                });
            } else {
                // Delete de TODOS os episódios de uma série (sem season/ep = deletar tudo)
                await prisma.watchHistory.deleteMany({
                    where: {
                        userId: session.user.id,
                        tmdbId: tmdbId,
                        mediaType: mediaType,
                    },
                });
            }
        } catch (error: any) {
            // P2025: Record not found
            if (error.code === 'P2025') {
                return NextResponse.json(
                    { error: 'api.watchHistory.notFoundInHistory' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // 204 No Content - Frontend faz optimistic update
        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('❌ Error deleting watch history:', error);
        return NextResponse.json(
            { error: 'api.watchHistory.removeError' },
            { status: 500 }
        );
    }
}

// Sem cache - dados do usuário são dinâmicos
export const dynamic = 'force-dynamic';

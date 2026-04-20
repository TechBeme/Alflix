import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getWatchlist } from '@/lib/watchlist-server';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getUserLanguage } from '@/lib/language-server';

/**
 * API Route: GET /api/watchlist
 * 
 * Retorna items da watchlist do usuário com paginação para scroll infinito
 * 
 * Query Params:
 * - offset: número de items para pular (default: 0)
 * - mediaType: filtro opcional ('movie' | 'tv')
 * 
 * Segurança:
 * - Requer autenticação via Better Auth
 * - Retorna apenas itens do usuário logado
 */

export async function GET(request: NextRequest) {
    try {
        // 1. Verificar autenticação via Better Auth
        const headersList = await headers();
        const session = await auth.api.getSession({
            headers: headersList,
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'api.errors.unauthorized', message: 'api.watchlist.authRequired' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`watchlist:get:${session.user.id}`, {
            limit: 60,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded', message: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // 2. Extrair query params
        const { searchParams } = new URL(request.url);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        const mediaType = searchParams.get('mediaType') as 'movie' | 'tv' | null;
        const limit = 18; // Valor fixo (padrão TMDB)

        // 3. Validações
        if (offset < 0) {
            return NextResponse.json(
                {
                    error: 'api.errors.badRequest',
                    message: 'api.watchlist.invalidOffset'
                },
                { status: 400 }
            );
        }

        if (mediaType && mediaType !== 'movie' && mediaType !== 'tv') {
            return NextResponse.json(
                {
                    error: 'api.errors.badRequest',
                    message: 'api.watchlist.invalidMediaType'
                },
                { status: 400 }
            );
        }

        // Detectar idioma do usuário (preferências DB → Accept-Language → en-US)
        const acceptLanguage = headersList.get('accept-language');
        const userLanguage = await getUserLanguage(session.user.id, acceptLanguage);

        // 4. Buscar watchlist (usa função server otimizada)
        const watchlistData = await getWatchlist(session.user.id, {
            offset,
            limit,
            language: userLanguage,
            ...(mediaType && { mediaType }),
        });

        // 5. Retornar resposta padronizada para infinite scroll
        return NextResponse.json({
            items: watchlistData.items,
            total: watchlistData.total,
            movieCount: watchlistData.movieCount,
            tvCount: watchlistData.tvCount,
            offset,
            limit,
            hasMore: watchlistData.items.length === limit,
        });
    } catch (error) {
        console.error('❌ Watchlist API error:', error);

        return NextResponse.json(
            {
                error: 'api.errors.internalError',
                message: 'api.watchlist.fetchError'
            },
            { status: 500 }
        );
    }
}

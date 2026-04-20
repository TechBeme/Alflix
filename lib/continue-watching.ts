import { prisma } from '@/lib/prisma';
import { getMediaDetailsWithCache } from '@/lib/tmdb-cache';
import { resolveResumeEpisode } from '@/lib/resume-episode';
import { COMPLETION_THRESHOLD, MINIMUM_PROGRESS_THRESHOLD } from '@/lib/watch-constants';
import { TMDB_API_URL, TMDB_API_KEY, SITE_LANGUAGE } from '@/lib/config';

export interface ContinueWatchingItem {
    id: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    seasonNumber: number;
    episodeNumber: number;
    progress: number;
    lastWatchedAt: string;
    title: string;
    backdropPath: string | null;
}

/**
 * Processa o histórico do usuário e retorna os itens para "Continue Assistindo"
 * - Filmes: progresso entre MINIMUM_PROGRESS_THRESHOLD (10%) e COMPLETION_THRESHOLD (90%)
 * - Séries: AGRUPA por tmdbId e retorna apenas 1 item por série (episódio mais recente ou próximo)
 *   - Apenas séries com pelo menos 1 episódio >= 10% de progresso aparecem
 * 
 * @param userId - ID do usuário
 * @param language - Idioma para buscar dados do TMDB (padrão: SITE_LANGUAGE)
 * @param limit - Número máximo de itens a retornar (padrão: 10)
 * @returns Array de itens ready-to-display
 */
export async function getContinueWatchingItems(
    userId: string,
    language: string = SITE_LANGUAGE,
    limit: number = 10
): Promise<ContinueWatchingItem[]> {
    // Buscar TODO o histórico do usuário (sem filtro de progresso)
    const allHistory = await prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { lastWatchedAt: 'desc' },
        take: 100,
    });

    if (allHistory.length === 0) {
        return [];
    }

    // === FILMES: progresso entre MINIMUM_PROGRESS_THRESHOLD e COMPLETION_THRESHOLD ===
    const movieItems = allHistory.filter(
        (item) => item.mediaType === 'movie' && item.progress >= MINIMUM_PROGRESS_THRESHOLD && item.progress < COMPLETION_THRESHOLD
    );

    // === SÉRIES: agrupar por tmdbId (1 item por série) ===
    // Apenas séries com pelo menos 1 episódio >= MINIMUM_PROGRESS_THRESHOLD
    const seriesGroups = new Map<number, typeof allHistory>();
    for (const item of allHistory) {
        if (item.mediaType !== 'tv') continue;
        if (!seriesGroups.has(item.tmdbId)) seriesGroups.set(item.tmdbId, []);
        seriesGroups.get(item.tmdbId)!.push(item);
    }

    // Filtrar séries: incluir apenas aquelas com pelo menos um episódio >= 10%
    for (const [tmdbId, episodes] of seriesGroups.entries()) {
        const hasMinimumProgress = episodes.some(ep => ep.progress >= MINIMUM_PROGRESS_THRESHOLD);
        if (!hasMinimumProgress) {
            seriesGroups.delete(tmdbId);
        }
    }

    // Enriquecer filmes com TMDB data
    const moviePromises = movieItems.map(async (item) => {
        try {
            const details = await getMediaDetailsWithCache(item.tmdbId, 'movie', language);
            return {
                id: item.id,
                tmdbId: item.tmdbId,
                mediaType: 'movie' as const,
                seasonNumber: 0,
                episodeNumber: 0,
                progress: item.progress,
                lastWatchedAt: item.lastWatchedAt.toISOString(),
                title: details?.title || details?.name || `ID: ${item.tmdbId}`,
                backdropPath: details?.backdrop_path || null,
            };
        } catch {
            return null;
        }
    });

    // Processar séries: usar resolveResumeEpisode com dados já carregados (zero queries DB extras)
    const seriesPromises = Array.from(seriesGroups.entries()).map(async ([tmdbId, episodes]) => {
        try {
            // Buscar detalhes TMDB uma única vez (cacheado)
            const details = await getMediaDetailsWithCache(tmdbId, 'tv', language);
            if (!details) return null;

            // Verificar se precisa de dados de seasons do TMDB (só quando todos eps estão completos)
            const hasInProgress = episodes.some(
                ep => ep.progress >= MINIMUM_PROGRESS_THRESHOLD && ep.progress < COMPLETION_THRESHOLD
            );

            let seasons: Array<{ season_number: number; episode_count: number }> | null = null;

            if (!hasInProgress) {
                // Precisa de TMDB para saber boundaries dos seasons
                const seriesRes = await fetch(
                    `${TMDB_API_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}&include_adult=false`
                );
                if (seriesRes.ok) {
                    const seriesData = await seriesRes.json();
                    seasons = (seriesData.seasons || []).filter(
                        (s: { season_number: number }) => s.season_number > 0
                    );
                }
            }

            const resumePoint = resolveResumeEpisode(episodes, seasons);

            // Se o resume aponta para S1E1 com progresso 0 e o usuário tem episódios completos,
            // a série foi totalmente assistida — não mostrar no Continue Watching
            const hasCompletedEpisodes = episodes.some(ep => ep.progress >= COMPLETION_THRESHOLD);
            if (hasCompletedEpisodes && resumePoint.season === 1 && resumePoint.episode === 1 && resumePoint.progress === 0) {
                const s1e1 = episodes.find(ep => ep.seasonNumber === 1 && ep.episodeNumber === 1);
                if (s1e1 && s1e1.progress >= COMPLETION_THRESHOLD) {
                    return null; // Série totalmente completa
                }
            }

            // Encontrar lastWatchedAt mais recente para ordenação
            const sortedByTime = [...episodes].sort(
                (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
            );
            const mostRecentRecord = sortedByTime[0];

            return {
                id: mostRecentRecord.id,
                tmdbId,
                mediaType: 'tv' as const,
                seasonNumber: resumePoint.season,
                episodeNumber: resumePoint.episode,
                progress: resumePoint.progress,
                lastWatchedAt: mostRecentRecord.lastWatchedAt.toISOString(),
                title: details?.title || details?.name || `ID: ${tmdbId}`,
                backdropPath: details?.backdrop_path || null,
            };
        } catch (error) {
            console.error(`Error processing series ${tmdbId}:`, error);
            return null;
        }
    });

    const [movieResults, seriesResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(seriesPromises),
    ]);

    // Combinar, filtrar nulls, ordenar por lastWatchedAt
    const allItems = [...movieResults, ...seriesResults]
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
        .slice(0, limit);

    return allItems;
}

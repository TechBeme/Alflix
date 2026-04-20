import { prisma } from '@/lib/prisma';
import { tmdbService } from '@/lib/tmdb';
import { SITE_LANGUAGE } from '@/lib/config';

/**
 * Server-side watchlist helper functions
 * Para usar em Server Components do Next.js
 */

interface WatchlistItem {
    id: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    voteAverage: number;
    releaseDate: string;
    addedAt: string;
}

interface WatchlistData {
    items: WatchlistItem[];
    total: number;
    movieCount: number;
    tvCount: number;
}

/**
 * Buscar watchlist do usuário com dados do TMDB
 * Para usar em Server Components
 */
export async function getWatchlist(
    userId: string,
    options: {
        mediaType?: 'movie' | 'tv';
        limit?: number;
        offset?: number;
        language?: string;
    } = {}
): Promise<WatchlistData> {
    const { mediaType, limit = 18, offset = 0, language = SITE_LANGUAGE } = options;

    // 1. Buscar itens do banco
    const whereClause = {
        userId,
        ...(mediaType ? { mediaType } : {}),
    };

    const [dbItems, total, movieCount, tvCount] = await Promise.all([
        prisma.watchlist.findMany({
            where: whereClause,
            orderBy: {
                addedAt: 'desc',
            },
            take: limit,
            skip: offset,
        }),
        prisma.watchlist.count({
            where: whereClause,
        }),
        prisma.watchlist.count({
            where: { userId, mediaType: 'movie' },
        }),
        prisma.watchlist.count({
            where: { userId, mediaType: 'tv' },
        }),
    ]);

    // 2. Enriquecer com dados do TMDB
    const items = await Promise.all(
        dbItems.map(async (item) => {
            try {
                const details = item.mediaType === 'movie'
                    ? await tmdbService.getMovieDetails(item.tmdbId, language)
                    : await tmdbService.getTVDetails(item.tmdbId, language);

                return {
                    id: item.id,
                    mediaId: item.tmdbId,
                    mediaType: item.mediaType as 'movie' | 'tv',
                    title: details.title || details.name || 'Título desconhecido',
                    overview: details.overview || '',
                    posterPath: details.poster_path,
                    backdropPath: details.backdrop_path,
                    voteAverage: details.vote_average,
                    releaseDate: details.release_date || details.first_air_date || '',
                    addedAt: item.addedAt.toISOString(),
                };
            } catch (error) {
                console.error(`Erro ao buscar detalhes do ${item.mediaType} ${item.tmdbId}:`, error);
                // Retornar dados básicos em caso de erro
                return {
                    id: item.id,
                    mediaId: item.tmdbId,
                    mediaType: item.mediaType as 'movie' | 'tv',
                    title: 'Título não disponível',
                    overview: '',
                    posterPath: null,
                    backdropPath: null,
                    voteAverage: 0,
                    releaseDate: '',
                    addedAt: item.addedAt.toISOString(),
                };
            }
        })
    );

    return {
        items,
        total,
        movieCount,
        tvCount,
    };
}

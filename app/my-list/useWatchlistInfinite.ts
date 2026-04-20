import { useInfiniteQuery } from '@tanstack/react-query';
import type { MediaType } from '@/components/MediaTypeFilter';

/**
 * Tipos para Watchlist
 */
export interface WatchlistItem {
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

export interface WatchlistPage {
    items: WatchlistItem[];
    total: number;
    movieCount: number;
    tvCount: number;
    offset: number;
    limit: number;
    hasMore: boolean;
}

interface UseWatchlistInfiniteParams {
    userId: string;
    filter: MediaType;
    enabled?: boolean;
    fallbackErrorMessage?: string;
}

/**
 * Hook customizado para scroll infinito da watchlist
 * 
 * Features:
 * - Infinite scroll com TanStack Query
 * - Cache automático
 * - Prefetch de próximas páginas
 * - Filtros por tipo (movie/tv/all)
 */
export function useWatchlistInfinite({
    userId,
    filter,
    enabled = true,
    fallbackErrorMessage = 'Failed to load watchlist',
}: UseWatchlistInfiniteParams) {
    return useInfiniteQuery<WatchlistPage, Error>({
        queryKey: ['watchlist', userId, filter],

        queryFn: async ({ pageParam }) => {
            const offset = (pageParam as number) || 0;
            const params = new URLSearchParams({
                offset: offset.toString(),
            });

            // Adicionar filtro de mediaType se não for 'all'
            if (filter !== 'all') {
                params.set('mediaType', filter);
            }

            const response = await fetch(`/api/watchlist?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || fallbackErrorMessage);
            }

            const data = await response.json();

            return {
                items: data.items,
                total: data.total,
                movieCount: data.movieCount,
                tvCount: data.tvCount,
                offset: data.offset,
                limit: data.limit,
                hasMore: data.hasMore,
            };
        },

        // Parâmetro inicial da primeira página
        initialPageParam: 0,

        // Determinar próxima página
        getNextPageParam: (lastPage) => {
            // Se ainda há mais itens, retornar o próximo offset
            if (lastPage.hasMore) {
                return lastPage.offset + lastPage.limit;
            }
            // Caso contrário, não há próxima página
            return undefined;
        },

        // Configurações de cache e refetch
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam fresh
        gcTime: 10 * 60 * 1000, // 10 minutos - cache mantido
        retry: 3, // Tentar 3 vezes em caso de erro
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
        // Sempre refetch ao montar para evitar lista stale ao voltar para a rota
        refetchOnMount: 'always',
        refetchOnWindowFocus: false, // Não refetch ao voltar para janela
        refetchOnReconnect: true, // Refetch ao reconectar internet
    });
}

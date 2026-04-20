import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * Tipos para Search
 */
interface SearchResult {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    media_type?: 'movie' | 'tv';
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
}

interface SearchPage {
    results: SearchResult[];
    totalPages: number;
    totalResults: number;
    page: number;
}

interface UseSearchInfiniteParams {
    query: string;
    filter: 'all' | 'movie' | 'tv';
    genres: string;
    years: string;
    rating: string;
    sortBy: string;
    initialResults?: SearchPage | null;
    fallbackErrorMessage?: string;
}

/**
 * Hook customizado para scroll infinito de busca
 * 
 * Features:
 * - Infinite scroll com TanStack Query
 * - Suporte a busca de texto
 * - Suporte a filtros avançados (gêneros, anos, rating, ordenação)
 * - Cache automático por query + filtros
 * - Prefetch de próximas páginas
 * - Dados iniciais do SSR
 */
export function useSearchInfinite({
    query,
    filter,
    genres,
    years,
    rating,
    sortBy,
    initialResults,
    fallbackErrorMessage = 'Search failed',
}: UseSearchInfiniteParams) {
    // Determinar se deve fazer query
    const hasAnyFilters = genres || years || rating || sortBy;
    const shouldFetch = !!(query || hasAnyFilters);

    return useInfiniteQuery<SearchPage, Error>({
        queryKey: ['search', query, filter, genres, years, rating, sortBy],

        queryFn: async ({ pageParam }) => {
            const page = (pageParam as number) || 1;
            const params = new URLSearchParams({
                page: page.toString(),
            });

            // Adicionar parâmetros não-vazios
            if (query) params.set('q', query);
            if (filter !== 'all') params.set('filter', filter);
            if (genres) params.set('genres', genres);
            if (years) params.set('years', years);
            if (rating) params.set('rating', rating);
            if (sortBy) params.set('sortBy', sortBy);

            const response = await fetch(`/api/search?${params}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || fallbackErrorMessage);
            }

            const data = await response.json();

            return {
                results: data.results,
                totalPages: data.totalPages,
                totalResults: data.totalResults,
                page: data.page,
            };
        },

        // Parâmetro inicial da primeira página
        initialPageParam: 1,

        // Determinar próxima página
        getNextPageParam: (lastPage) => {
            const currentPage = lastPage.page;
            const totalPages = lastPage.totalPages;

            // Se há mais páginas, retornar próxima
            if (currentPage < totalPages) {
                return currentPage + 1;
            }

            // Caso contrário, não há próxima página
            return undefined;
        },

        // Dados iniciais do SSR (apenas se houver resultados)
        ...(initialResults && initialResults.results.length > 0 && {
            initialData: {
                pages: [initialResults],
                pageParams: [1],
            },
        }),

        // Apenas fazer query se houver query ou filtros
        enabled: shouldFetch,

        // Configurações de cache e refetch
        staleTime: 5 * 60 * 1000, // 5 minutos - dados ficam fresh
        gcTime: 10 * 60 * 1000, // 10 minutos - cache mantido
        retry: 3, // Tentar 3 vezes em caso de erro
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
        refetchOnWindowFocus: false, // Não refetch ao voltar para janela
        refetchOnReconnect: true, // Refetch ao reconectar internet
    });
}

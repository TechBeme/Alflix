import { unstable_cache } from 'next/cache';
import { tmdbService, Movie, TVShow } from './tmdb';
import { TMDB_API_URL, TMDB_API_KEY, SITE_LANGUAGE } from './config';

/**
 * Cache Layer para dados do TMDB
 * 
 * ESTRATÉGIA DE CACHE OTIMIZADA:
 * - Tempo de cache: 36 horas (129600s)
 * - Cron job diário (6:00 UTC) mantém cache sempre fresco
 * - Next.js revalida automaticamente (ISR - Incremental Static Regeneration)
 * 
 * BENEFÍCIOS:
 * - ⚡ Performance máxima (SSR com dados cacheados em memória)
 * - 🔥 Redução massiva de requests ao TMDB (evita rate limiting)
 * - ✅ Dados frescos (revalidação a cada 6h captura lançamentos diários)
 * - 💰 Economia de custos (menos API calls)
 * 
 * OTIMIZAÇÃO DE VOLUME:
 * - 60 itens por categoria (3 páginas × 20 itens em paralelo)
 * - Lazy loading nas imagens (apenas visíveis carregam)
 * - Requests paralelos (Promise.all) para minimizar latência
 * - Deduplicação automática por ID
 */

export interface TMDBResponse {
    results: (Movie | TVShow)[];
    total_pages?: number;
}

/**
 * Helper: Busca múltiplas páginas em paralelo e mescla os resultados
 * IMPORTANTE: Remove duplicatas baseado no ID para evitar o mesmo item aparecer em páginas diferentes
 */
async function fetchMultiplePages<T extends { id: number }>(
    fetcher: (page: number) => Promise<{ results: T[]; total_pages?: number }>,
    numPages: number = 3
): Promise<{ results: T[] }> {
    const pagePromises = Array.from({ length: numPages }, (_, i) => fetcher(i + 1));
    const pages = await Promise.all(pagePromises);

    // Mesclar todos os resultados
    const allResults = pages.flatMap(page => page.results);

    // Remove duplicatas baseado no ID (mesmo item pode aparecer em múltiplas páginas)
    const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
    );

    return { results: uniqueResults };
}

/**
 * Helper: Busca múltiplas páginas e FILTRA apenas movies e TV shows
 * IMPORTANTE: Remove pessoas (media_type: 'person') que podem aparecer no trending/all
 */
async function fetchMultiplePagesFiltered<T extends { id: number; media_type?: string }>(
    fetcher: (page: number) => Promise<{ results: T[]; total_pages?: number }>,
    numPages: number = 3
): Promise<{ results: T[] }> {
    const pagePromises = Array.from({ length: numPages }, (_, i) => fetcher(i + 1));
    const pages = await Promise.all(pagePromises);

    // Mesclar todos os resultados
    const allResults = pages.flatMap(page => page.results);

    // FILTRAR apenas movies e TV shows (remover 'person')
    const filteredResults = allResults.filter(item =>
        !item.media_type || item.media_type === 'movie' || item.media_type === 'tv'
    );

    // Remove duplicatas baseado no ID
    const uniqueResults = Array.from(
        new Map(filteredResults.map(item => [item.id, item])).values()
    );

    return { results: uniqueResults };
}

/**
 * Busca trending content com cache de 6 horas
 */
export const getCachedTrending = unstable_cache(
    async (mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', language = SITE_LANGUAGE): Promise<TMDBResponse> => {
        const data = await tmdbService.getTrending(mediaType, timeWindow, 1, language);
        return data;
    },
    ['tmdb-trending'],
    {
        revalidate: 21600, // 6 horas
        tags: ['tmdb', 'trending']
    }
);

/**
 * Busca filmes populares com cache de 6 horas (60 itens)
 */
export const getCachedPopularMovies = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<TMDBResponse> => {
        return await fetchMultiplePages<Movie>((page) => tmdbService.getPopularMovies(page, language), 3);
    },
    ['tmdb-popular-movies'],
    {
        revalidate: 21600, // 6 horas
        tags: ['tmdb', 'movies']
    }
);

/**
 * Busca séries populares com cache de 6 horas (60 itens)
 */
export const getCachedPopularTV = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<TMDBResponse> => {
        return await fetchMultiplePages<TVShow>((page) => tmdbService.getPopularTVShows(page, language), 3);
    },
    ['tmdb-popular-tv'],
    {
        revalidate: 21600, // 6 horas
        tags: ['tmdb', 'tv']
    }
);

/**
 * Busca trending TV com cache de 6 horas (60 itens)
 */
export const getCachedTrendingTV = unstable_cache(
    async (timeWindow: 'day' | 'week' = 'week', language = SITE_LANGUAGE): Promise<TMDBResponse> => {
        return await fetchMultiplePages<TVShow>((page) => tmdbService.getTrending('tv', timeWindow, page, language), 3);
    },
    ['tmdb-trending-tv'],
    {
        revalidate: 21600, // 6 horas
        tags: ['tmdb', 'tv', 'trending']
    }
);

/**
 * Busca todos os dados da landing page em paralelo (otimizado)
 * Com cache de 6 horas - 60 itens por categoria
 * Apenas os 3 mais relevantes para a landing pública
 */
export const getCachedLandingData = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<{
        trending: { results: (Movie | TVShow)[] };
        trendingMovies: { results: Movie[] };
        trendingTV: { results: TVShow[] };
    }> => {
        // Verificar se TMDB_API_KEY está configurada
        if (!TMDB_API_KEY) {
            console.error('[TMDB Cache] CRITICAL: TMDB_API_KEY is not configured!');
            throw new Error('TMDB_API_KEY not configured');
        }

        console.log('[TMDB Cache] Fetching landing data...');
        const [trending, trendingMovies, trendingTV] = await Promise.all([
            fetchMultiplePagesFiltered<Movie | TVShow>((page) => tmdbService.getTrending('all', 'week', page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getTrending('movie', 'week', page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getTrending('tv', 'week', page, language), 3),
        ]);

        // Validar se os dados foram retornados
        if (trending.results.length === 0) {
            console.error('[TMDB Cache] ERROR: No landing data returned from TMDB!');
            throw new Error('No valid TMDB landing data returned');
        }

        console.log('[TMDB Cache] Successfully fetched landing data:', {
            trending: trending.results.length,
            trendingMovies: trendingMovies.results.length,
            trendingTV: trendingTV.results.length
        });

        return {
            trending,
            trendingMovies,
            trendingTV,
        };
    },
    ['tmdb-landing-data'],
    {
        revalidate: 129600, // 36 horas (cron diário mantém fresco)
        tags: ['tmdb', 'landing']
    }
);

/**
 * Busca todos os dados da home autenticada e catálogo público em paralelo (otimizado)
 * Com cache de 6 horas - 60 itens por categoria
 */
export const getCachedHomeContent = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<{
        trending: { results: (Movie | TVShow)[] };
        trendingMovies: { results: Movie[] };
        trendingTV: { results: TVShow[] };
        popularMovies: { results: Movie[] };
        nowPlayingMovies: { results: Movie[] };
        topRatedMovies: { results: Movie[] };
        popularTV: { results: TVShow[] };
        onTheAirTV: { results: TVShow[] };
        topRatedTV: { results: TVShow[] };
    }> => {
        // Verificar se TMDB_API_KEY está configurada
        if (!TMDB_API_KEY) {
            console.error('[TMDB Cache] CRITICAL: TMDB_API_KEY is not configured!');
            throw new Error('TMDB_API_KEY not configured');
        }

        console.log('[TMDB Cache] Fetching home content data...');
        const startTime = Date.now();

        const [
            trending,
            trendingMovies,
            trendingTV,
            popularMovies,
            nowPlayingMovies,
            topRatedMovies,
            popularTV,
            onTheAirTV,
            topRatedTV
        ] = await Promise.all([
            fetchMultiplePagesFiltered<Movie | TVShow>((page) => tmdbService.getTrending('all', 'week', page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getTrending('movie', 'week', page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getTrending('tv', 'week', page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getPopularMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getNowPlayingMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getTopRatedMovies(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getPopularTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getOnTheAirTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getTopRatedTVShows(page, language), 3),
        ]);

        const elapsed = Date.now() - startTime;

        // Validar se os dados principais foram retornados com sucesso
        const hasValidData = trending.results.length > 0;

        if (!hasValidData) {
            console.error('[TMDB Cache] ERROR: No trending data returned from TMDB!', {
                trendingCount: trending.results.length,
                trendingMoviesCount: trendingMovies.results.length,
                trendingTVCount: trendingTV.results.length,
                elapsedMs: elapsed
            });
            // Não cachear dados vazios - permitir que tente novamente
            throw new Error('No valid TMDB data returned');
        }

        console.log('[TMDB Cache] Successfully fetched home content:', {
            trending: trending.results.length,
            trendingMovies: trendingMovies.results.length,
            trendingTV: trendingTV.results.length,
            popularMovies: popularMovies.results.length,
            elapsedMs: elapsed
        });

        return {
            trending,
            trendingMovies,
            trendingTV,
            popularMovies,
            nowPlayingMovies,
            topRatedMovies,
            popularTV,
            onTheAirTV,
            topRatedTV,
        };
    },
    ['tmdb-home-content'],
    {
        revalidate: 129600, // 36 horas (cron diário mantém fresco)
        tags: ['tmdb', 'home']
    }
);

/**
 * Busca todos os dados da página de filmes em paralelo (otimizado)
 * Com cache de 36 horas - 60 itens por categoria
 * Cache mantido fresco pelo cron job diário (6:00 UTC)
 */
export const getCachedMoviesPageData = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<{
        popular: { results: Movie[] };
        topRated: { results: Movie[] };
        upcoming: { results: Movie[] };
        nowPlaying: { results: Movie[] };
        trending: { results: Movie[] };
    }> => {
        if (!TMDB_API_KEY) {
            console.error('[TMDB Cache] CRITICAL: TMDB_API_KEY is not configured!');
            throw new Error('TMDB_API_KEY not configured');
        }

        console.log('[TMDB Cache] Fetching movies page data...');
        const startTime = Date.now();

        const [popular, topRated, upcoming, nowPlaying, trending] = await Promise.all([
            fetchMultiplePages<Movie>((page) => tmdbService.getPopularMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getTopRatedMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getUpcomingMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getNowPlayingMovies(page, language), 3),
            fetchMultiplePages<Movie>((page) => tmdbService.getTrending('movie', 'week', page, language), 3),
        ]);

        const elapsed = Date.now() - startTime;

        // Validar dados
        if (popular.results.length === 0 && trending.results.length === 0) {
            console.error('[TMDB Cache] ERROR: No movies data returned from TMDB!');
            throw new Error('No valid TMDB movies data returned');
        }

        console.log('[TMDB Cache] Successfully fetched movies page data:', {
            popular: popular.results.length,
            topRated: topRated.results.length,
            trending: trending.results.length,
            elapsedMs: elapsed
        });

        return {
            popular,
            topRated,
            upcoming,
            nowPlaying,
            trending,
        };
    },
    ['tmdb-movies-page'],
    {
        revalidate: 129600, // 36 horas (cron diário mantém fresco)
        tags: ['tmdb', 'movies']
    }
);

/**
 * Busca todos os dados da página de séries em paralelo (otimizado)
 * Com cache de 24 horas - 60 itens por categoria
 * Cache mantido fresco pelo cron job a cada 4 horas
 */
export const getCachedTVPageData = unstable_cache(
    async (language = SITE_LANGUAGE): Promise<{
        popular: { results: TVShow[] };
        topRated: { results: TVShow[] };
        onTheAir: { results: TVShow[] };
        airingToday: { results: TVShow[] };
        trending: { results: TVShow[] };
    }> => {
        if (!TMDB_API_KEY) {
            console.error('[TMDB Cache] CRITICAL: TMDB_API_KEY is not configured!');
            throw new Error('TMDB_API_KEY not configured');
        }

        console.log('[TMDB Cache] Fetching TV page data...');
        const startTime = Date.now();

        const [popular, topRated, onTheAir, airingToday, trending] = await Promise.all([
            fetchMultiplePages<TVShow>((page) => tmdbService.getPopularTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getTopRatedTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getOnTheAirTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getAiringTodayTVShows(page, language), 3),
            fetchMultiplePages<TVShow>((page) => tmdbService.getTrending('tv', 'week', page, language), 3),
        ]);

        const elapsed = Date.now() - startTime;

        // Validar dados
        if (popular.results.length === 0 && trending.results.length === 0) {
            console.error('[TMDB Cache] ERROR: No TV data returned from TMDB!');
            throw new Error('No valid TMDB TV data returned');
        }

        console.log('[TMDB Cache] Successfully fetched TV page data:', {
            popular: popular.results.length,
            topRated: topRated.results.length,
            trending: trending.results.length,
            elapsedMs: elapsed
        });

        return {
            popular,
            topRated,
            onTheAir,
            airingToday,
            trending,
        };
    },
    ['tmdb-tv-page'],
    {
        revalidate: 129600, // 36 horas (cron diário mantém fresco)
        tags: ['tmdb', 'tv']
    }
);

/**
 * Busca detalhes de uma mídia específica com cache inteligente
 * 
 * ESTRATÉGIA:
 * 1. Primeiro verifica se o item já está nos caches de trending/popular
 * 2. Se não encontrar, faz request individual ao TMDB
 * 3. Cacheia por 6 horas
 * 
 * BENEFÍCIOS:
 * - Reutiliza dados já cacheados (0 requests extras)
 * - Continue Assistindo fica super rápido
 * - Reduz drasticamente chamadas ao TMDB
 */
export async function getMediaDetailsWithCache(
    id: number,
    type: 'movie' | 'tv',
    language = SITE_LANGUAGE
): Promise<{ id: number; title?: string; name?: string; poster_path: string | null; backdrop_path: string | null } | null> {
    try {
        // 1. Tentar encontrar nos caches existentes
        const homeContent = await getCachedHomeContent(language);

        // Buscar em todas as categorias do cache
        const allCachedItems = [
            ...homeContent.trending.results,
            ...homeContent.trendingMovies.results,
            ...homeContent.trendingTV.results,
            ...homeContent.popularMovies.results,
            ...homeContent.nowPlayingMovies.results,
            ...homeContent.topRatedMovies.results,
            ...homeContent.popularTV.results,
            ...homeContent.onTheAirTV.results,
            ...homeContent.topRatedTV.results,
        ];

        // Verificar se o item já está no cache
        const cachedItem = allCachedItems.find(item => item.id === id);
        if (cachedItem) {
            return {
                id: cachedItem.id,
                title: 'title' in cachedItem ? cachedItem.title : undefined,
                name: 'name' in cachedItem ? cachedItem.name : undefined,
                poster_path: cachedItem.poster_path,
                backdrop_path: cachedItem.backdrop_path,
            };
        }

        // 2. Se não encontrou no cache, buscar individualmente no TMDB
        return await getCachedMediaDetails(id, type, language);

    } catch (error) {
        console.error(`Error fetching media details for ${type}/${id}:`, error);
        return null;
    }
}

/**
 * Cache individual para detalhes de mídia (fallback quando não está nos caches gerais)
 */
const getCachedMediaDetails = unstable_cache(
    async (id: number, type: 'movie' | 'tv', language = SITE_LANGUAGE): Promise<{ id: number; title?: string; name?: string; poster_path: string | null; backdrop_path: string | null }> => {
        const endpoint = type === 'movie'
            ? `${TMDB_API_URL}/movie/${id}`
            : `${TMDB_API_URL}/tv/${id}`;

        const response = await fetch(
            `${endpoint}?api_key=${TMDB_API_KEY}&language=${language}&include_adult=false`,
            {
                next: { revalidate: 129600 } // 36 horas
            }
        );

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            id: data.id,
            title: data.title,
            name: data.name,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
        };
    },
    ['tmdb-media-details'],
    {
        revalidate: 21600, // 6 horas
        tags: ['tmdb', 'media-details']
    }
);

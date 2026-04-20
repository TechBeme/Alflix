import axios from 'axios';
import { TMDB_API_URL, TMDB_API_KEY, SITE_LANGUAGE } from './config';
import { withRetry } from './retry';

/**
 * Mapeia sortBy genérico para valores específicos de movie ou tv
 * 
 * O TMDB usa nomes diferentes para os mesmos conceitos:
 * - movie usa: title, original_title, primary_release_date, revenue
 * - tv usa: name, original_name, first_air_date (sem revenue)
 * - ambos usam: popularity, vote_average, vote_count
 */
function mapSortByForMediaType(sortBy: string, mediaType: 'movie' | 'tv'): string {
    // Se não tem sortBy, retornar vazio
    if (!sortBy) return '';

    // Extrair direção (asc/desc)
    const [field, direction] = sortBy.split('.');
    const dir = direction || 'desc';

    // Mapeamentos por tipo de mídia
    // Movies usam 'title', TV usam 'name'
    const movieMap: Record<string, string> = {
        'title': 'title',
        'original_title': 'original_title',
        'name': 'title', // Mapeia name → title para movie
        'original_name': 'original_title',
        'release_date': 'primary_release_date',
        'primary_release_date': 'primary_release_date',
        'first_air_date': 'primary_release_date',
        'popularity': 'popularity',
        'vote_average': 'vote_average',
        'vote_count': 'vote_count',
        'revenue': 'revenue',
    };

    const tvMap: Record<string, string> = {
        'title': 'name', // Mapeia title → name para TV
        'original_title': 'original_name',
        'name': 'name',
        'original_name': 'original_name',
        'release_date': 'first_air_date',
        'primary_release_date': 'first_air_date',
        'first_air_date': 'first_air_date',
        'popularity': 'popularity',
        'vote_average': 'vote_average',
        'vote_count': 'vote_count',
        'revenue': 'popularity', // TV não tem revenue
    };

    const map = mediaType === 'movie' ? movieMap : tvMap;
    const mappedField = map[field] || field;

    return `${mappedField}.${dir}`;
}

export interface Movie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    genre_ids: number[];
    media_type?: string;
}

export interface TVShow {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    genre_ids: number[];
    media_type?: string;
}

export interface Episode {
    id: number;
    name: string;
    overview: string;
    still_path: string | null;
    episode_number: number;
    season_number: number;
    air_date: string;
    runtime: number | null;
    vote_average: number;
}

export interface Season {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string;
}

export interface Cast {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface Crew {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export interface MediaDetails {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genres: { id: number; name: string }[];
    runtime?: number;
    number_of_seasons?: number;
    number_of_episodes?: number;
    seasons?: Season[];
    status?: string;
    tagline?: string;
    videos?: {
        results: Video[];
    };
    credits?: {
        cast: Cast[];
        crew: Crew[];
    };
}

const tmdbClient = axios.create({
    baseURL: TMDB_API_URL,
    params: {
        api_key: TMDB_API_KEY,
    },
    timeout: 15000, // 15 segundos
    headers: {
        'Accept': 'application/json',
    },
});

// Log de configuração inicial (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development' && !TMDB_API_KEY) {
    console.error('[TMDB Client] CRITICAL: TMDB_API_KEY is not configured! All requests will fail.');
}

// Função auxiliar para fazer requisições diretas ao TMDB
export async function fetchFromTMDB(endpoint: string) {
    try {
        const response = await tmdbClient.get(endpoint);
        return response.data;
    } catch (error) {
        console.error(`Error fetching from TMDB: ${endpoint}`, error);
        throw error;
    }
}

export const tmdbService = {
    // Buscar filmes populares
    async getPopularMovies(page = 1, language = SITE_LANGUAGE): Promise<{ results: Movie[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/movie/popular', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar séries populares
    async getPopularTVShows(page = 1, language = SITE_LANGUAGE): Promise<{ results: TVShow[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/tv/popular', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar filmes mais bem avaliados
    async getTopRatedMovies(page = 1, language = SITE_LANGUAGE): Promise<{ results: Movie[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/movie/top_rated', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar séries mais bem avaliadas
    async getTopRatedTVShows(page = 1, language = SITE_LANGUAGE): Promise<{ results: TVShow[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/tv/top_rated', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar filmes que serão lançados em breve
    async getUpcomingMovies(page = 1, language = SITE_LANGUAGE): Promise<{ results: Movie[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/movie/upcoming', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar filmes em exibição nos cinemas
    async getNowPlayingMovies(page = 1, language = SITE_LANGUAGE): Promise<{ results: Movie[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/movie/now_playing', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar séries atualmente no ar
    async getOnTheAirTVShows(page = 1, language = SITE_LANGUAGE): Promise<{ results: TVShow[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/tv/on_the_air', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar séries sendo exibidas hoje
    async getAiringTodayTVShows(page = 1, language = SITE_LANGUAGE): Promise<{ results: TVShow[]; total_pages: number }> {
        return withRetry(
            async () => {
                const response = await tmdbClient.get('/tv/airing_today', {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            { maxAttempts: 3, initialDelayMs: 1000 }
        );
    },

    // Buscar trending (em alta)
    async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'week', page: number = 1, language = SITE_LANGUAGE) {
        return withRetry(
            async () => {
                const response = await tmdbClient.get(`/trending/${mediaType}/${timeWindow}`, {
                    params: { page, language, include_adult: false }
                });
                return response.data;
            },
            {
                maxAttempts: 3,
                initialDelayMs: 1000,
                onRetry: (error, attempt) => {
                    // Log detalhado para debug
                    if (axios.isAxiosError(error)) {
                        console.warn(`[TMDB] Retrying trending (attempt ${attempt}):`, {
                            mediaType,
                            timeWindow,
                            page,
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            message: error.message,
                            hasApiKey: !!TMDB_API_KEY,
                            apiKeyPreview: TMDB_API_KEY ? TMDB_API_KEY.substring(0, 8) + '...' : 'NOT_SET'
                        });
                    }
                }
            }
        );
    },

    // Buscar detalhes de um filme
    async getMovieDetails(movieId: number, language = SITE_LANGUAGE): Promise<MediaDetails> {
        const response = await tmdbClient.get(`/movie/${movieId}`, {
            params: {
                append_to_response: 'videos,credits,recommendations',
                language,
                include_adult: false
            },
        });
        return response.data;
    },

    // Buscar detalhes de uma série
    async getTVDetails(tvId: number, language = SITE_LANGUAGE): Promise<MediaDetails> {
        const response = await tmdbClient.get(`/tv/${tvId}`, {
            params: {
                append_to_response: 'videos,credits,recommendations',
                language,
                include_adult: false
            },
        });
        return response.data;
    },

    // Buscar detalhes de uma temporada específica
    async getSeasonDetails(tvId: number, seasonNumber: number, language = SITE_LANGUAGE) {
        try {
            const response = await tmdbClient.get(`/tv/${tvId}/season/${seasonNumber}`, {
                params: { language, include_adult: false }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching season details:', error);
            return null;
        }
    },

    /**
     * Busca por texto usando os endpoints /search do TMDB
     * 
     * IMPORTANTE: Search endpoints NÃO aceitam filtros avançados como:
     * - Gêneros (with_genres)
     * - Rating (vote_average)
     * - Ordenação (sort_by)
     * 
     * Para filtros avançados, use discover() em vez disso.
     * 
     * @param query - Texto de busca (obrigatório)
     * @param mediaType - Tipo de mídia ('movie', 'tv', ou 'multi')
     * @param page - Número da página (padrão: 1)
     * @param options - Opções adicionais suportadas (include_adult, region)
     */
    async search(
        query: string,
        mediaType: 'movie' | 'tv' | 'multi' = 'multi',
        page = 1,
        options: {
            include_adult?: boolean;
            region?: string;
        } = {}
    ) {
        try {
            if (!query || query.trim().length === 0) {
                return { results: [], total_pages: 0, total_results: 0, page };
            }

            // Para 'multi', usar endpoint nativo e filtrar pessoas
            if (mediaType === 'multi') {
                const params: Record<string, any> = {
                    query: query.trim(),
                    page,
                    include_adult: options.include_adult ?? false
                };

                const response = await tmdbClient.get('/search/multi', { params });

                // Filtrar apenas movie e tv (remover person)
                const filteredResults = (response.data.results || []).filter(
                    (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
                );

                // Usar estimativa fixa: ~85% dos resultados são movie/tv, ~15% person
                // Isso é mais consistente do que calcular ratio de cada página
                const estimatedTotal = Math.floor(response.data.total_results * 0.85);

                return {
                    results: filteredResults,
                    total_results: estimatedTotal,
                    total_pages: Math.ceil(estimatedTotal / 20),
                    page
                };
            }

            // Search específico (movie ou tv)
            const params: Record<string, any> = {
                query: query.trim(),
                page,
                include_adult: options.include_adult ?? false
            };
            if (options.region) {
                params.region = options.region;
            }

            const response = await tmdbClient.get(`/search/${mediaType}`, { params });
            return response.data;
        } catch (error) {
            console.error('Error searching:', error);
            return { results: [], total_pages: 0, total_results: 0, page };
        }
    },

    /**
     * Busca combinada em movie + tv quando o usuário quer buscar em ambos
     * Faz duas chamadas paralelas e mescla os resultados de forma inteligente
     * 
     * @param query - Texto de busca
     * @param page - Número da página
     * @param options - Opções adicionais
     */
    async searchAll(
        query: string,
        page = 1,
        options: {
            include_adult?: boolean;
            region?: string;
        } = {}
    ) {
        try {
            if (!query || query.trim().length === 0) {
                return { results: [], total_pages: 0, total_results: 0, page };
            }

            // Buscar movie e tv em paralelo
            const [movieData, tvData] = await Promise.all([
                this.search(query, 'movie', page, options),
                this.search(query, 'tv', page, options),
            ]);

            // Mesclar resultados alternadamente (movie, tv, movie, tv, ...)
            const mergedResults: any[] = [];
            const maxLength = Math.max(movieData.results.length, tvData.results.length);

            for (let i = 0; i < maxLength; i++) {
                if (i < movieData.results.length) {
                    mergedResults.push({ ...movieData.results[i], media_type: 'movie' });
                }
                if (i < tvData.results.length) {
                    mergedResults.push({ ...tvData.results[i], media_type: 'tv' });
                }
            }

            // Calcular totais combinados
            const totalResults = movieData.total_results + tvData.total_results;
            const totalPages = Math.ceil(totalResults / 20); // TMDB retorna ~20 itens por página

            return {
                results: mergedResults,
                total_results: totalResults,
                total_pages: totalPages,
                page,
            };
        } catch (error) {
            console.error('Error searching all:', error);
            return { results: [], total_pages: 0, total_results: 0, page };
        }
    },

    // Obter gêneros de filmes
    async getMovieGenres(language = SITE_LANGUAGE) {
        const response = await tmdbClient.get('/genre/movie/list', {
            params: { language }
        });
        return response.data.genres;
    },

    // Obter gêneros de séries
    async getTVGenres(language = SITE_LANGUAGE) {
        const response = await tmdbClient.get('/genre/tv/list', {
            params: { language }
        });
        return response.data.genres;
    },

    // Discover - buscar com filtros avançados (sem suporte a query/texto)
    async discover(
        mediaType: 'movie' | 'tv',
        options: {
            page?: number;
            // Gêneros (AND=vírgula, OR=pipe)
            genres?: string; // with_genres
            // Anos
            year?: string; // Ano específico ou range (ex: "2020" ou "2010-2019")
            // Avaliação
            ratingMin?: string; // vote_average.gte
            ratingMax?: string; // vote_average.lte
            voteCountMin?: number; // vote_count.gte (filtrar conteúdo obscuro)
            voteCountMax?: number; // vote_count.lte
            // Ordenação
            sortBy?: string;
            // Outros filtros comuns
            includeAdult?: boolean;
            language?: string; // Idioma dos resultados
            withKeywords?: string;
            withCompanies?: string;
            withCast?: string;
            withCrew?: string;
            withPeople?: string;
            withOriginCountry?: string;
            withOriginalLanguage?: string;
            withRuntimeMin?: number; // with_runtime.gte
            withRuntimeMax?: number; // with_runtime.lte
            // Filtros específicos de movie
            withReleaseType?: string; // movie only
            region?: string; // movie only
            // Filtros específicos de tv
            withNetworks?: number; // tv only
            withStatus?: string; // tv only (0-5)
            withType?: string; // tv only (0-6)
            screenedTheatrically?: boolean; // tv only
        } = {}
    ) {
        try {
            const params: Record<string, any> = {
                page: options.page || 1,
                language: options.language || SITE_LANGUAGE, // Usar idioma especificado ou inglês como fallback
            };

            // === FILTROS COMUNS (movie e tv) ===

            // Gêneros (suporta AND e OR)
            if (options.genres) {
                params.with_genres = options.genres;
            }

            // Anos (suporta múltiplos valores separados por vírgula)
            if (options.year) {
                const years = options.year.split(',');

                // Se tem múltiplos anos, usar o range de todos eles
                if (years.length > 1) {
                    // Separar anos específicos e ranges
                    const specificYears: number[] = [];
                    let minYear: number | null = null;
                    let maxYear: number | null = null;

                    years.forEach(yearValue => {
                        if (yearValue.includes('-')) {
                            // É um range (década)
                            const [start, end] = yearValue.split('-');
                            const startYear = parseInt(start);
                            const endYear = parseInt(end);
                            if (minYear === null || startYear < minYear) minYear = startYear;
                            if (maxYear === null || endYear > maxYear) maxYear = endYear;
                        } else {
                            // É um ano específico
                            const year = parseInt(yearValue);
                            specificYears.push(year);
                            if (minYear === null || year < minYear) minYear = year;
                            if (maxYear === null || year > maxYear) maxYear = year;
                        }
                    });

                    // Usar range completo
                    if (minYear && maxYear) {
                        if (mediaType === 'movie') {
                            params['primary_release_date.gte'] = `${minYear}-01-01`;
                            params['primary_release_date.lte'] = `${maxYear}-12-31`;
                        } else {
                            params['first_air_date.gte'] = `${minYear}-01-01`;
                            params['first_air_date.lte'] = `${maxYear}-12-31`;
                        }
                    }
                } else {
                    // Apenas um valor
                    const yearValue = years[0];
                    if (yearValue.includes('-')) {
                        // Range de anos (década)
                        const [start, end] = yearValue.split('-');
                        if (mediaType === 'movie') {
                            params['primary_release_date.gte'] = `${start}-01-01`;
                            params['primary_release_date.lte'] = `${end}-12-31`;
                        } else {
                            params['first_air_date.gte'] = `${start}-01-01`;
                            params['first_air_date.lte'] = `${end}-12-31`;
                        }
                    } else {
                        // Ano específico
                        if (mediaType === 'movie') {
                            params.primary_release_year = yearValue;
                        } else {
                            params.first_air_date_year = yearValue;
                        }
                    }
                }
            }

            // Avaliação (rating)
            if (options.ratingMin) {
                params['vote_average.gte'] = options.ratingMin;
            }
            if (options.ratingMax) {
                params['vote_average.lte'] = options.ratingMax;
            }

            // Número de votos (importante para filtrar conteúdo obscuro)
            if (options.voteCountMin !== undefined) {
                params['vote_count.gte'] = options.voteCountMin;
            }
            if (options.voteCountMax !== undefined) {
                params['vote_count.lte'] = options.voteCountMax;
            }

            // Ordenação - mapear para valores específicos do tipo de mídia
            if (options.sortBy) {
                params.sort_by = mapSortByForMediaType(options.sortBy, mediaType);
            }

            // Conteúdo adulto
            if (options.includeAdult !== undefined) {
                params.include_adult = options.includeAdult;
            }

            // Keywords (AND=vírgula, OR=pipe)
            if (options.withKeywords) {
                params.with_keywords = options.withKeywords;
            }

            // Companies (AND=vírgula, OR=pipe)
            if (options.withCompanies) {
                params.with_companies = options.withCompanies;
            }

            // Cast (AND=vírgula, OR=pipe)
            if (options.withCast) {
                params.with_cast = options.withCast;
            }

            // Crew (AND=vírgula, OR=pipe)
            if (options.withCrew) {
                params.with_crew = options.withCrew;
            }

            // People (AND=vírgula, OR=pipe)
            if (options.withPeople) {
                params.with_people = options.withPeople;
            }

            // País de origem
            if (options.withOriginCountry) {
                params.with_origin_country = options.withOriginCountry;
            }

            // Idioma original
            if (options.withOriginalLanguage) {
                params.with_original_language = options.withOriginalLanguage;
            }

            // Duração (runtime)
            if (options.withRuntimeMin !== undefined) {
                params['with_runtime.gte'] = options.withRuntimeMin;
            }
            if (options.withRuntimeMax !== undefined) {
                params['with_runtime.lte'] = options.withRuntimeMax;
            }

            // === FILTROS ESPECÍFICOS DE MOVIE ===
            if (mediaType === 'movie') {
                if (options.withReleaseType) {
                    params.with_release_type = options.withReleaseType;
                }
                if (options.region) {
                    params.region = options.region;
                }
            }

            // === FILTROS ESPECÍFICOS DE TV ===
            if (mediaType === 'tv') {
                if (options.withNetworks !== undefined) {
                    params.with_networks = options.withNetworks;
                }
                if (options.withStatus) {
                    params.with_status = options.withStatus;
                }
                if (options.withType) {
                    params.with_type = options.withType;
                }
                if (options.screenedTheatrically !== undefined) {
                    params.screened_theatrically = options.screenedTheatrically;
                }
            }

            const response = await tmdbClient.get(`/discover/${mediaType}`, { params });
            return response.data;
        } catch (error) {
            console.error('Error discovering content:', error);
            return { results: [], total_pages: 0, total_results: 0 };
        }
    },

    /**
     * Discover combinado em movie + tv quando o usuário quer descobrir em ambos
     * Faz duas chamadas paralelas e mescla os resultados de forma inteligente
     * 
     * IMPORTANTE: Este método é usado quando NÃO há query de texto,
     * apenas filtros avançados (gêneros, ano, rating, etc.)
     * 
     * @param options - Opções de filtros para discover
     */
    async discoverAll(
        options: {
            page?: number;
            genres?: string;
            year?: string;
            ratingMin?: string;
            ratingMax?: string;
            voteCountMin?: number;
            voteCountMax?: number;
            sortBy?: string;
            includeAdult?: boolean;
            language?: string; // Idioma dos resultados
            withKeywords?: string;
            withCompanies?: string;
            withCast?: string;
            withCrew?: string;
            withPeople?: string;
            withOriginCountry?: string;
            withOriginalLanguage?: string;
            withRuntimeMin?: number;
            withRuntimeMax?: number;
        } = {}
    ) {
        const page = options.page || 1;

        try {
            // Buscar movie e tv em paralelo com os mesmos filtros
            const [movieData, tvData] = await Promise.all([
                this.discover('movie', options),
                this.discover('tv', options),
            ]);

            // Mesclar resultados alternadamente (movie, tv, movie, tv, ...)
            const mergedResults: any[] = [];
            const maxLength = Math.max(movieData.results.length, tvData.results.length);

            for (let i = 0; i < maxLength; i++) {
                if (i < movieData.results.length) {
                    mergedResults.push({ ...movieData.results[i], media_type: 'movie' });
                }
                if (i < tvData.results.length) {
                    mergedResults.push({ ...tvData.results[i], media_type: 'tv' });
                }
            }

            // Calcular totais combinados
            const totalResults = movieData.total_results + tvData.total_results;
            const totalPages = Math.ceil(totalResults / 20); // TMDB retorna ~20 itens por página

            return {
                results: mergedResults,
                total_results: totalResults,
                total_pages: totalPages,
                page,
            };
        } catch (error) {
            console.error('Error discovering all content:', error);
            return { results: [], total_pages: 0, total_results: 0, page };
        }
    },

    // URL para imagens
    getImageUrl(path: string | null, size: 'w500' | 'w780' | 'original' = 'w500'): string {
        if (!path) return '/placeholder.jpg';
        return `https://image.tmdb.org/t/p/${size}${path}`;
    },
};

import { tmdbService } from './tmdb';
import { SITE_LANGUAGE } from './config';

/**
 * Cache de gêneros do TMDB
 * Com metadados sobre disponibilidade por tipo de mídia
 */

export interface Genre {
    id: number;
    name: string;
    mediaTypes: ('movie' | 'tv')[]; // Quais tipos de mídia suportam este gênero
}

interface CachedGenres {
    data: Genre[];
    timestamp: number;
}

let genresCache: CachedGenres | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Mapeia gêneros para seus tipos de mídia
 * Baseado na documentação oficial do TMDB:
 * https://developer.themoviedb.org/reference/genre-movie-list
 * https://developer.themoviedb.org/reference/genre-tv-list
 */
function determineMediaTypes(
    genreId: number,
    inMovies: boolean,
    inTV: boolean
): ('movie' | 'tv')[] {
    const types: ('movie' | 'tv')[] = [];
    if (inMovies) types.push('movie');
    if (inTV) types.push('tv');
    return types;
}

/**
 * Busca todos os gêneros (filmes + séries) com cache de 24 horas
 * Retorna gêneros com informação sobre quais tipos de mídia os suportam
 * 
 * @param language - Idioma dos gêneros (padrão: en-US)
 */
export async function getCachedGenres(language = SITE_LANGUAGE): Promise<Genre[]> {
    // Verificar se cache é válido
    if (genresCache && Date.now() - genresCache.timestamp < CACHE_DURATION) {
        return genresCache.data;
    }

    try {
        // Buscar gêneros de filmes e séries em paralelo
        const [movieGenres, tvGenres] = await Promise.all([
            tmdbService.getMovieGenres(language),
            tmdbService.getTVGenres(language),
        ]);

        // Criar sets para identificação rápida
        const movieGenreIds = new Set(movieGenres.map((g: any) => g.id));
        const tvGenreIds = new Set(tvGenres.map((g: any) => g.id));

        // Combinar gêneros com metadata de tipo
        const genresMap = new Map<number, Genre>();

        // Processar gêneros de movies
        movieGenres.forEach((genre: any) => {
            genresMap.set(genre.id, {
                id: genre.id,
                name: genre.name,
                mediaTypes: determineMediaTypes(
                    genre.id,
                    true,
                    tvGenreIds.has(genre.id)
                ),
            });
        });

        // Processar gêneros de TV (se ainda não estiverem no map)
        tvGenres.forEach((genre: any) => {
            if (!genresMap.has(genre.id)) {
                genresMap.set(genre.id, {
                    id: genre.id,
                    name: genre.name,
                    mediaTypes: determineMediaTypes(
                        genre.id,
                        movieGenreIds.has(genre.id),
                        true
                    ),
                });
            }
        });

        const allGenres = Array.from(genresMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        // Atualizar cache
        genresCache = {
            data: allGenres,
            timestamp: Date.now(),
        };

        return allGenres;
    } catch (error) {
        console.error('Error fetching genres:', error);

        // Se falhar e houver cache antigo, retornar ele
        if (genresCache) {
            return genresCache.data;
        }

        return [];
    }
}

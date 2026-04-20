import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { tmdbService } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';
import { getUserLanguage } from '@/lib/language-server';

/**
 * API Route: GET /api/search
 * 
 * Busca filmes e séries no TMDB com paginação para scroll infinito
 * 
 * ========================================
 * ARQUITETURA DE BUSCA (TMDB API)
 * ========================================
 * 
 * A API do TMDB possui dois conjuntos de endpoints distintos:
 * 
 * 1. SEARCH ENDPOINTS (busca por texto):
 *    - /search/multi, /search/movie, /search/tv
 *    - Aceita: query (texto), page, include_adult, region
 *    - NÃO aceita: genres, rating, sort_by, year (exceto em contexts específicos)
 *    - Uso: quando o usuário digita texto de busca
 * 
 * 2. DISCOVER ENDPOINTS (descoberta com filtros):
 *    - /discover/movie, /discover/tv
 *    - Aceita: genres, year, rating, sort_by, e muitos outros filtros
 *    - NÃO aceita: query (texto de busca)
 *    - Uso: quando o usuário seleciona filtros sem digitar texto
 * 
 * IMPORTANTE: NUNCA misturar query de texto com filtros avançados!
 * 
 * ========================================
 * COMPORTAMENTO IMPLEMENTADO
 * ========================================
 * 
 * Se há QUERY (texto):
 *   - Usar /search endpoints
 *   - Ignorar filtros de genres, rating, sortBy
 *   - Respeitar apenas o filtro de tipo (movie/tv/all)
 *   - Se filter='all', fazer merge de /search/movie + /search/tv
 * 
 * Se NÃO há query mas há FILTROS:
 *   - Usar /discover endpoints
 *   - Aplicar todos os filtros (genres, year, rating, sortBy)
 *   - Se filter='all', fazer merge de /discover/movie + /discover/tv
 * 
 * ========================================
 * SEGURANÇA
 * ========================================
 * - Autenticação obrigatória (apenas usuários logados)
 * - Rate limiting: 30 req/min
 * 
 * ========================================
 * QUERY PARAMS
 * ========================================
 * - q: termo de busca (opcional, string)
 * - page: número da página (default: 1, range: 1-500)
 * - filter: tipo de mídia ('all' | 'movie' | 'tv', default: 'all')
 * 
 * FILTROS AVANÇADOS (apenas quando NÃO há 'q'):
 * - genres: IDs de gêneros separados por vírgula (opcional)
 * - years: ano ou range de anos (opcional)
 * - rating: rating mínimo (opcional)
 * - sortBy: critério de ordenação (opcional)
 * 
 * ========================================
 * RETORNO
 * ========================================
 * - results: array de resultados (max 18 por página após filtrar)
 * - totalPages: total de páginas disponíveis
 * - totalResults: total de resultados
 * - page: página atual
 */

/**
 * Validação Enterprise-Grade de Parâmetros
 * 
 * Validações robustas sem limites artificiais que causem erros.
 * Aceita múltiplos valores em campos como genres e years.
 */
function validateSearchParams(searchParams: URLSearchParams): {
    valid: boolean;
    data?: {
        query: string;
        page: number;
        filter: 'all' | 'movie' | 'tv';
        genres: string;
        years: string;
        rating: string;
        sortBy: string;
    };
    error?: {
        message: string;
        field: string;
    };
} {
    try {
        // Extrair e sanitizar parâmetros
        const q = searchParams.get('q') || '';
        const pageStr = searchParams.get('page') || '1';
        const filter = searchParams.get('filter') || 'all';
        const genres = searchParams.get('genres') || '';
        const years = searchParams.get('years') || '';
        const rating = searchParams.get('rating') || '';
        const sortBy = searchParams.get('sortBy') || '';

        // Validar query mínima (se fornecida)
        if (q.trim().length > 0 && q.trim().length < 2) {
            return {
                valid: false,
                error: {
                    message: 'api.search.minSearchChars',
                    field: 'q'
                }
            };
        }

        // Validar query (max 200 caracteres)  
        if (q.length > 200) {
            return {
                valid: false,
                error: {
                    message: 'api.search.maxSearchChars',
                    field: 'q'
                }
            };
        }

        // Validar que há pelo menos query OU filtros
        const hasQuery = q.trim().length >= 2;
        const hasFilters = genres || years || rating || sortBy;

        if (!hasQuery && !hasFilters) {
            return {
                valid: false,
                error: {
                    message: 'api.search.searchOrFilters',
                    field: 'q'
                }
            };
        }

        // Validar page
        const page = parseInt(pageStr, 10);
        if (isNaN(page) || page < 1 || page > 500) {
            return {
                valid: false,
                error: {
                    message: 'api.search.pageRange',
                    field: 'page'
                }
            };
        }

        // Validar filter
        if (!['all', 'movie', 'tv'].includes(filter)) {
            return {
                valid: false,
                error: {
                    message: 'api.search.invalidFilter',
                    field: 'filter'
                }
            };
        }

        // Validar genres (pode ter múltiplos IDs separados por vírgula)
        if (genres && !/^[\d,]+$/.test(genres)) {
            return {
                valid: false,
                error: {
                    message: 'api.search.invalidGenres',
                    field: 'genres'
                }
            };
        }

        // Validar years (pode ter múltiplos anos/ranges separados por vírgula)
        // Aceita: "2023", "2020-2024", "2023,2022,2021", etc.
        if (years && !/^[\d,\-]+$/.test(years)) {
            return {
                valid: false,
                error: {
                    message: 'api.search.invalidYears',
                    field: 'years'
                }
            };
        }

        // Validar rating (deve ser um número entre 0 e 10)
        if (rating && (!/^\d+(\.\d+)?$/.test(rating) || parseFloat(rating) < 0 || parseFloat(rating) > 10)) {
            return {
                valid: false,
                error: {
                    message: 'api.search.invalidRating',
                    field: 'rating'
                }
            };
        }

        // Validar sortBy (aceita valores genéricos que serão mapeados)
        // Valores genéricos aceitos:
        // - title (movies), name (tv) - ordenação alfabética baseada no idioma
        // - original_title, original_name - ordenação alfabética pelo título original
        // - release_date, primary_release_date, first_air_date (mapeado para movie/tv)
        // - popularity, vote_average, vote_count (válidos em ambos)
        // - revenue (apenas movie, TV usa popularity como fallback)
        const validSortOptions = [
            // Títulos (ordenação alfabética)
            'title.asc', 'title.desc',
            'name.asc', 'name.desc',
            'original_title.asc', 'original_title.desc',
            'original_name.asc', 'original_name.desc',
            // Datas (genérico)
            'release_date.asc', 'release_date.desc',
            'primary_release_date.asc', 'primary_release_date.desc',
            'first_air_date.asc', 'first_air_date.desc',
            // Métricas (válido em ambos)
            'popularity.asc', 'popularity.desc',
            'vote_average.asc', 'vote_average.desc',
            'vote_count.asc', 'vote_count.desc',
            // Receita (apenas movie)
            'revenue.asc', 'revenue.desc',
        ];
        if (sortBy && !validSortOptions.includes(sortBy)) {
            return {
                valid: false,
                error: {
                    message: 'api.search.invalidSortBy',
                    field: 'sortBy'
                }
            };
        }

        return {
            valid: true,
            data: {
                query: q.trim(),
                page,
                filter: filter as 'all' | 'movie' | 'tv',
                genres,
                years,
                rating,
                sortBy
            }
        };
    } catch (error) {
        return {
            valid: false,
            error: {
                message: 'api.search.validationError',
                field: 'unknown'
            }
        };
    }
}

export async function GET(request: NextRequest) {
    try {
        // 1. Autenticação obrigatória
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

        // Buscar watchlist do usuário
        const watchlistItems = await prisma.watchlist.findMany({
            where: { userId: session.user.id },
            select: {
                tmdbId: true,
                mediaType: true,
            },
        });

        // 2. Rate limiting
        const rateLimitResult = rateLimit(`search:${session.user.id}`, {
            limit: 30,
            interval: 60, // 1 minuto
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

        // 3. Validar query params com validação enterprise-grade
        const { searchParams } = new URL(request.url);
        const validation = validateSearchParams(searchParams);

        if (!validation.valid || !validation.data) {
            return NextResponse.json(
                {
                    error: 'api.search.invalidParams',
                    message: validation.error?.message || 'api.errors.unknown',
                    field: validation.error?.field || 'unknown'
                },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const { query, page, filter, genres, years, rating, sortBy } = validation.data;

        // Validação semântica: se há query, filtros avançados são ignorados
        const hasAnyFilters = genres || years || rating || sortBy;

        if (query && hasAnyFilters) {
            // Log de aviso mas não retornar erro - apenas ignorar os filtros
            console.warn('⚠️ Search API: Filtros avançados enviados com query de texto serão ignorados', {
                query,
                filters: { genres, years, rating, sortBy }
            });
        }

        if (!query && !hasAnyFilters) {
            return NextResponse.json({
                results: [],
                totalPages: 0,
                totalResults: 0,
                page,
            });
        }

        /**
         * LÓGICA DE BUSCA CORRIGIDA (conforme documentação TMDB):
         * 
         * 1. Se há QUERY de texto:
         *    - Usar endpoints /search (search-multi, search-movie, search-tv)
         *    - NÃO enviar filtros avançados (gêneros, rating, sort)
         *    - Apenas filtrar por tipo de mídia (movie/tv/all)
         * 
         * 2. Se NÃO há query mas há FILTROS:
         *    - Usar endpoints /discover (discover-movie, discover-tv)
         *    - Enviar todos os filtros avançados
         *    - Se filter === 'all', fazer merge de movie + tv
         * 
         * IMPORTANTE: NUNCA misturar query de texto com filtros avançados!
         * A API /search não aceita filtros, e /discover não aceita query de texto.
         */
        let data;

        if (query) {
            // ========================================
            // BUSCA POR TEXTO (sem filtros avançados)
            // ========================================
            if (filter === 'all') {
                // Buscar em movie + tv e fazer merge
                data = await tmdbService.searchAll(query, page, {
                    include_adult: false,
                });
            } else {
                // Buscar apenas em movie ou tv
                data = await tmdbService.search(query, filter, page, {
                    include_adult: false,
                });
            }
        } else {
            // ========================================
            // DISCOVER COM FILTROS (sem query de texto)
            // ========================================
            if (filter === 'all') {
                // Discover em movie + tv e fazer merge
                data = await tmdbService.discoverAll({
                    page,
                    genres,
                    year: years,
                    ratingMin: rating,
                    sortBy,
                    voteCountMin: 10, // Garantir qualidade mínima
                    includeAdult: false,
                    language: userLanguage, // Usar idioma das preferências do usuário
                });
            } else {
                // Discover apenas em movie ou tv
                data = await tmdbService.discover(filter, {
                    page,
                    genres,
                    year: years,
                    ratingMin: rating,
                    sortBy,
                    voteCountMin: 10,
                    includeAdult: false,
                    language: userLanguage, // Usar idioma das preferências do usuário
                });
            }
        }

        // Filtrar itens sem poster (garantir qualidade)
        // O tmdb.search já remove 'person' quando é 'multi'
        const results = (data.results || []).filter((item: any) => item.poster_path);

        // ========================================
        // INCLUIR WATCHLIST NOS RESULTADOS
        // ========================================
        // Criar Set para lookup O(1)
        const watchlistSet = new Set(
            watchlistItems.map(item => `${item.tmdbId}-${item.mediaType}`)
        );

        // Adicionar campo inWatchlist em cada resultado
        const resultsWithWatchlist = results.map((item: any) => {
            const mediaType = item.media_type || filter;
            const key = `${item.id}-${mediaType}`;

            return {
                ...item,
                inWatchlist: watchlistSet.has(key),
            };
        });

        // Retornar resposta padronizada
        return NextResponse.json(
            {
                results: resultsWithWatchlist,
                totalPages: data.total_pages || 1,
                totalResults: data.total_results || 0,
                page,
            },
            { headers: getRateLimitHeaders(rateLimitResult) }
        );

    } catch (error) {
        console.error('❌ Search API error:', error);

        return NextResponse.json(
            {
                error: 'api.errors.internalError',
                message: 'api.search.fetchError'
            },
            { status: 500 }
        );
    }
}

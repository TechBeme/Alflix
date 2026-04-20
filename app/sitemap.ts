import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { TMDB_API_URL, TMDB_API_KEY, INDEXING_LANGUAGE } from '@/lib/config';

/**
 * Sitemap dinâmico para SEO otimizado.
 *
 * Inclui:
 * - Páginas estáticas (landing, about, catalog, etc.)
 * - Páginas dinâmicas de filmes e séries populares/trending do TMDB
 *
 * Next.js gera automaticamente o sitemap.xml a partir deste arquivo.
 * O sitemap é regenerado a cada request (ISR pode ser adicionado se necessário).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = SITE_URL;
    const now = new Date();

    // ─── Páginas Estáticas ──────────────────────────────────────────────────

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${siteUrl}/catalog`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/movies`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/tv`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${siteUrl}/search`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${siteUrl}/about`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.4,
        },
        {
            url: `${siteUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${siteUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${siteUrl}/cookies`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // ─── Páginas Dinâmicas de Mídia ─────────────────────────────────────────

    let mediaPages: MetadataRoute.Sitemap = [];

    if (TMDB_API_KEY) {
        try {
            // Buscar filmes e séries populares em paralelo (top 200 de cada)
            const [
                trendingMovies,
                trendingTV,
                popularMovies,
                popularTV,
                topRatedMovies,
                topRatedTV,
            ] = await Promise.all([
                fetchTMDBPages('trending/movie/week', 3),
                fetchTMDBPages('trending/tv/week', 3),
                fetchTMDBPages('movie/popular', 4),
                fetchTMDBPages('tv/popular', 4),
                fetchTMDBPages('movie/top_rated', 3),
                fetchTMDBPages('tv/top_rated', 3),
            ]);

            // Combinar e deduplificar por ID+tipo
            const seen = new Set<string>();
            const allMedia: Array<{ id: number; type: 'movie' | 'tv' }> = [];

            const addMedia = (items: any[], type: 'movie' | 'tv') => {
                for (const item of items) {
                    const key = `${type}-${item.id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allMedia.push({ id: item.id, type });
                    }
                }
            };

            addMedia(trendingMovies, 'movie');
            addMedia(trendingTV, 'tv');
            addMedia(popularMovies, 'movie');
            addMedia(popularTV, 'tv');
            addMedia(topRatedMovies, 'movie');
            addMedia(topRatedTV, 'tv');

            mediaPages = allMedia.map((item) => ({
                url: `${siteUrl}/media/${item.type}/${item.id}`,
                lastModified: now,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
        } catch (error) {
            console.error('Error generating media sitemap entries:', error);
        }
    }

    return [...staticPages, ...mediaPages];
}

// ─── Helper: buscar múltiplas páginas do TMDB ───────────────────────────────

async function fetchTMDBPages(
    endpoint: string,
    totalPages: number
): Promise<any[]> {
    const results: any[] = [];

    const promises = Array.from({ length: totalPages }, (_, i) =>
        fetch(
            `${TMDB_API_URL}/${endpoint}?api_key=${TMDB_API_KEY}&language=${INDEXING_LANGUAGE}&page=${i + 1}`,
            { next: { revalidate: 86400 } } // Cache 24h
        )
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
    );

    const responses = await Promise.all(promises);

    for (const data of responses) {
        if (data?.results) {
            results.push(...data.results);
        }
    }

    return results;
}

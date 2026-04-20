import { headers } from 'next/headers';
import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import MediaRow from '@/components/MediaRow';
import MediaHero from '@/components/MediaHero';
import { GRADIENTS } from '@/lib/theme';
import { getCachedMoviesPageData } from '@/lib/tmdb-cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SITE_NAME_FULL } from '@/lib/config';
import { createMetadata } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';
import { getUserLanguage } from '@/lib/language-server';

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('metadata');
    return createMetadata({
        title: t('moviesTitle'),
        description: t('moviesDescription'),
        path: '/movies',
        keywords: t('keywordsMovies').split(', '),
        locale: ogLocale,
        baseKeywords: t('keywordsHome').split(', '),
    });
}

/**
 * Movies Page - SSR Otimizado
 * 
 * Todos os dados são carregados no servidor em paralelo com cache de 6 horas.
 * Watchlist é carregada também no servidor para usuários autenticados.
 */

export const revalidate = 21600; // 6 horas

export default async function MoviesPage() {
    const tm = await getTranslations('media');

    // Obter headers UMA VEZ e reusar (evita erro no Vercel)
    const headersList = await headers();

    // Autenticação primeiro para obter idioma do usuário
    const session = await auth.api.getSession({ headers: headersList });

    // Detectar idioma do usuário (preferências DB → Accept-Language → en-US)
    const acceptLanguage = headersList.get('accept-language');
    const userLanguage = await getUserLanguage(session?.user?.id || null, acceptLanguage);

    // Buscar dados do TMDB com o idioma do usuário
    const moviesData = await getCachedMoviesPageData(userLanguage);

    // Criar mapa da watchlist buscando diretamente do Prisma (sem fetch)
    const watchlistMap: Record<string, boolean> = {};
    if (session) {
        const watchlistItems = await prisma.watchlist.findMany({
            where: { userId: session.user.id },
            select: { tmdbId: true, mediaType: true },
        });

        watchlistItems.forEach((item) => {
            const key = `${item.tmdbId}-${item.mediaType}`;
            watchlistMap[key] = true;
        });
    }

    const featuredMovie = moviesData.popular.results[0] || moviesData.trending.results[0];

    // Verificar se o item em destaque está na watchlist
    const featuredKey = featuredMovie ? `${featuredMovie.id}-movie` : '';
    const isFeaturedInWatchlist = featuredKey ? (watchlistMap[featuredKey] || false) : false;

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <NavbarWrapper />

            {/* Hero/Featured Section */}
            {featuredMovie && <MediaHero media={featuredMovie} initialFavorited={isFeaturedInWatchlist} />}

            {/* Content Rows - Ordenadas por relevância */}
            <div className="space-y-8 pb-20">
                {moviesData.trending.results.length > 0 && (
                    <MediaRow title={tm('trendingThisWeek')} items={moviesData.trending.results} mediaType="movie" watchlistMap={watchlistMap} />
                )}
                {moviesData.popular.results.length > 0 && (
                    <MediaRow title={tm('popularMovies')} items={moviesData.popular.results} mediaType="movie" watchlistMap={watchlistMap} />
                )}
                {moviesData.nowPlaying.results.length > 0 && (
                    <MediaRow title={tm('nowPlayingShort')} items={moviesData.nowPlaying.results} mediaType="movie" watchlistMap={watchlistMap} />
                )}
                {moviesData.topRated.results.length > 0 && (
                    <MediaRow title={tm('topRatedShort')} items={moviesData.topRated.results} mediaType="movie" watchlistMap={watchlistMap} />
                )}
                {moviesData.upcoming.results.length > 0 && (
                    <MediaRow title={tm('upcoming')} items={moviesData.upcoming.results} mediaType="movie" watchlistMap={watchlistMap} />
                )}
            </div>

            <Footer />
        </div>
    );
}
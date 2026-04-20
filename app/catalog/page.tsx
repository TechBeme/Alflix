import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import MediaRow from '@/components/MediaRow';
import MediaHero from '@/components/MediaHero';
import JsonLd from '@/components/JsonLd';
import { getCachedHomeContent } from '@/lib/tmdb-cache';
import { auth } from '@/lib/auth';
import { getUserLanguage } from '@/lib/language-server';
import { GRADIENTS } from '@/lib/theme';
import { createMetadata, generateBreadcrumbJsonLd } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('catalog');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('description'),
        path: '/catalog',
        keywords: tm('keywordsCatalog').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

/**
 * Catálogo Público - SSR Otimizado (Somente Não Autenticados)
 * 
 * Esta página exibe o catálogo público APENAS para visitantes não autenticados.
 * Totalmente renderizada no servidor (SSR) para SEO otimizado.
 * 
 * Usuários autenticados são redirecionados para / (home) onde veem o catálogo personalizado
 * 
 * Benefícios do SSR:
 * - SEO otimizado (conteúdo indexável pelos buscadores)
 * - Primeiro render instantâneo
 * - Cache automático mantido fresco pelo cron job a cada 4 horas
 */

// Configuração de cache da página (24h - cron mantém fresco)
export const revalidate = 86400; // 24 horas

export default async function CatalogPage() {
    const t = await getTranslations('catalog');
    const tm = await getTranslations('media');
    const te = await getTranslations('error');
    const tc = await getTranslations('common');

    // Verificar autenticação - usuários autenticados devem usar a home (/)
    const headersList = await headers();
    const session = await auth.api.getSession({
        headers: headersList
    });

    // Redirecionar usuários autenticados para a home (catálogo personalizado)
    if (session?.user) {
        redirect('/');
    }

    // JSON-LD BreadcrumbList para rich snippets no Google
    const tmd = await getTranslations('metadata');
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: t('breadcrumbTitle'), path: '/catalog' },
    ], tmd('breadcrumbHome'));

    let content;
    try {
        // Detectar idioma do navegador
        const acceptLanguage = headersList.get('accept-language');
        const browserLanguage = await getUserLanguage(null, acceptLanguage);

        // Buscar dados cacheados do TMDB (Server-Side) com idioma detectado
        content = await getCachedHomeContent(browserLanguage);
    } catch (error) {
        console.error('[Catalog Page] Failed to fetch TMDB content:', error);
        // Retornar página de erro mais descritiva
        return (
            <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
                <NavbarWrapper />
                <div className="flex flex-col items-center justify-center h-screen px-4">
                    <div className="text-white text-xl mb-4">{te('loadingError')}</div>
                    <div className="text-white/70 text-sm max-w-md text-center">
                        {te('loadingErrorDesc')}
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-red-900/20 rounded text-red-400 text-xs max-w-2xl">
                            <strong>{tc('debugInfo')}:</strong> {error instanceof Error ? error.message : tc('unknownError')}
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        );
    }

    // Verificar se há conteúdo válido
    if (!content.trending || !content.trending.results || content.trending.results.length === 0) {
        console.warn('[Catalog Page] No trending content available:', {
            hasTrending: !!content.trending,
            hasResults: !!content.trending?.results,
            resultsLength: content.trending?.results?.length || 0
        });
        return (
            <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
                <NavbarWrapper />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-white text-xl">{te('noContent')}</div>
                </div>
                <Footer />
            </div>
        );
    }

    const featuredItem = content.trending.results[0];

    return (
        <>
            <JsonLd id="catalog-breadcrumb" data={breadcrumbJsonLd} />
            <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
                <NavbarWrapper />

                {/* Hero/Featured Section */}
                <MediaHero media={featuredItem} />

                {/* Content Rows - Catálogo Público com estrutura intercalada */}
                <div className="space-y-8">
                    {content.trending && (
                        <MediaRow
                            title={tm('trendingThisWeek')}
                            items={content.trending.results}
                            mediaType="movie"
                        />
                    )}
                    {content.trendingMovies && (
                        <MediaRow
                            title={tm('trendingMovies')}
                            items={content.trendingMovies.results}
                            mediaType="movie"
                        />
                    )}
                    {content.popularMovies && (
                        <MediaRow
                            title={tm('popularMovies')}
                            items={content.popularMovies.results}
                            mediaType="movie"
                        />
                    )}
                    {content.nowPlayingMovies && (
                        <MediaRow
                            title={tm('nowPlaying')}
                            items={content.nowPlayingMovies.results}
                            mediaType="movie"
                        />
                    )}
                    {content.topRatedMovies && (
                        <MediaRow
                            title={tm('topRatedMovies')}
                            items={content.topRatedMovies.results}
                            mediaType="movie"
                        />
                    )}
                    {content.trendingTV && (
                        <MediaRow
                            title={tm('trendingTV')}
                            items={content.trendingTV.results}
                            mediaType="tv"
                        />
                    )}
                    {content.popularTV && (
                        <MediaRow
                            title={tm('popularTV')}
                            items={content.popularTV.results}
                            mediaType="tv"
                        />
                    )}
                    {content.onTheAirTV && (
                        <MediaRow
                            title={tm('onTheAir')}
                            items={content.onTheAirTV.results}
                            mediaType="tv"
                        />
                    )}
                    {content.topRatedTV && (
                        <MediaRow
                            title={tm('topRatedTV')}
                            items={content.topRatedTV.results}
                            mediaType="tv"
                        />
                    )}
                </div>

                <Footer />
            </div>
        </>
    );
}

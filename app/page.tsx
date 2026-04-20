import { headers } from 'next/headers';
import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import MediaRow from '@/components/MediaRow';
import MediaHero from '@/components/MediaHero';
import JsonLd from '@/components/JsonLd';
import ContinueWatchingRowClient from '@/components/ContinueWatchingRowClient';
import LandingPage from './landing';
import { getCachedLandingData, getCachedHomeContent } from '@/lib/tmdb-cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tmdbService } from '@/lib/tmdb';
import { getContinueWatchingItems } from '@/lib/continue-watching';
import { getUserLanguage } from '@/lib/language-server';
import { GRADIENTS } from '@/lib/theme';
import { SITE_NAME_FULL } from '@/lib/config';
import { createMetadata, generateFAQJsonLd } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

export async function generateMetadata() {
  const locale = await getLocale();
  const ogLocale = localeToOpenGraph(locale);
  const t = await getTranslations('metadata');
  return createMetadata({
    title: t('homeTitle'),
    description: t('homeDescription', { siteName: SITE_NAME_FULL }),
    locale: ogLocale,
  });
}

/**
 * Home Page - SSR Otimizado com Better Auth
 * 
 * - Para usuários não autenticados: Landing page com dados cacheados (SSR para SEO)
 * - Para usuários autenticados: Dashboard com catálogo personalizado (Client-side)
 * 
 * Arquitetura:
 * - SSR com auth.api.getSession para verificação server-side
 * - Landing page totalmente SSR (SEO-friendly)
 * - Catálogo autenticado renderizado client-side no navegador
 * 
 * Benefícios do SSR para landing:
 * - SEO otimizado (conteúdo indexável)
 * - Primeiro render instantâneo (dados já vêm do servidor)
 * - Cache automático (revalidação a cada 6 horas)
 */

// Configuração de cache da página (Next.js 14+)
export const revalidate = 21600; // 6 horas

export default async function HomePage() {
  const t = await getTranslations('metadata');
  const tm = await getTranslations('media');
  const te = await getTranslations('error');
  const tfaq = await getTranslations('faq');

  // Obter headers UMA VEZ e reusar (evita erro no Vercel)
  const headersList = await headers();

  // Verificar autenticação usando Better Auth (server-side)
  const session = await auth.api.getSession({
    headers: headersList
  });

  // Se não houver sessão, usuário não está autenticado - mostrar landing page SSR
  if (!session) {
    // Detectar idioma do navegador do visitante
    const acceptLanguage = headersList.get('accept-language');
    const browserLanguage = await getUserLanguage(null, acceptLanguage);

    // Buscar dados cacheados do TMDB (Server-Side) com idioma do navegador
    const landingData = await getCachedLandingData(browserLanguage);

    // FAQ JSON-LD para rich snippets no Google (bots nunca estão autenticados)
    const faqJsonLd = generateFAQJsonLd([
      {
        question: tfaq('howItWorks', { siteName: SITE_NAME_FULL }),
        answer: tfaq('howItWorksAnswer', { siteName: SITE_NAME_FULL }),
      },
      {
        question: tfaq('canCancel'),
        answer: tfaq('canCancelAnswer'),
      },
      {
        question: tfaq('whichDevices'),
        answer: tfaq('whichDevicesAnswer'),
      },
      {
        question: tfaq('freeTrial'),
        answer: tfaq('freeTrialAnswer'),
      },
    ]);

    return (
      <>
        <JsonLd id="faq-schema" data={faqJsonLd} />
        <LandingPage
          trending={landingData.trending}
          trendingMovies={landingData.trendingMovies}
          trendingTV={landingData.trendingTV}
          initialSession={null}
        />
      </>
    );
  }

  // Usuário autenticado - buscar conteúdo personalizado DIRETAMENTE (sem fetch interno)
  try {
    // Detectar idioma do usuário (preferências DB → Accept-Language → en-US)
    const acceptLanguage = headersList.get('accept-language');
    const userLanguage = await getUserLanguage(session.user.id, acceptLanguage);

    // Buscar dados do TMDB cacheados com o idioma do usuário
    const content = await getCachedHomeContent(userLanguage);

    // Buscar watchlist e continue watching em paralelo (sem fetch, tudo server-side)
    const [watchlistItems, continueWatchingItems] = await Promise.all([
      prisma.watchlist.findMany({
        where: { userId: session.user.id },
        select: { tmdbId: true, mediaType: true },
      }),
      getContinueWatchingItems(session.user.id, userLanguage, 10),
    ]);

    // Criar mapa da watchlist para lookup rápido
    const watchlistMap: Record<string, boolean> = {};
    watchlistItems.forEach((item) => {
      const key = `${item.tmdbId}-${item.mediaType}`;
      watchlistMap[key] = true;
    });

    // Verificar se há conteúdo válido
    if (!content.trending || !content.trending.results || content.trending.results.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: GRADIENTS.pageContent }}>
          <NavbarWrapper />
          <div className="text-white">{te('noContent')}</div>
          <Footer />
        </div>
      );
    }

    const featuredItem = content.trending.results[0];

    // Verificar se o item em destaque está na watchlist
    const featuredMediaType = featuredItem.media_type === 'movie' || featuredItem.media_type === 'tv'
      ? featuredItem.media_type
      : ('title' in featuredItem ? 'movie' : 'tv');
    const featuredKey = `${featuredItem.id}-${featuredMediaType}`;
    const isFeaturedInWatchlist = watchlistMap[featuredKey] || false;

    return (
      <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
        <NavbarWrapper />

        {/* Hero/Featured Section */}
        <MediaHero media={featuredItem} initialFavorited={isFeaturedInWatchlist} />

        {/* Content Rows - Estrutura intercalada para abranger ambos os públicos */}
        <div className="space-y-8 pb-20">
          {/* Continue Assistindo - Só para usuários autenticados */}
          <ContinueWatchingRowClient initialItems={continueWatchingItems} />

          {/* Trending All - O mais popular em geral */}
          {content.trending && <MediaRow title={tm('trendingThisWeek')} items={content.trending.results} mediaType="movie" watchlistMap={watchlistMap} />}

          {/* Filmes Em Alta */}
          {content.trendingMovies && <MediaRow title={tm('trendingMovies')} items={content.trendingMovies.results} mediaType="movie" watchlistMap={watchlistMap} />}

          {/* Filmes Populares */}
          {content.popularMovies && <MediaRow title={tm('popularMovies')} items={content.popularMovies.results} mediaType="movie" watchlistMap={watchlistMap} />}

          {/* Séries Em Alta */}
          {content.trendingTV && <MediaRow title={tm('trendingTV')} items={content.trendingTV.results} mediaType="tv" watchlistMap={watchlistMap} />}

          {/* Séries Populares */}
          {content.popularTV && <MediaRow title={tm('popularTV')} items={content.popularTV.results} mediaType="tv" watchlistMap={watchlistMap} />}

          {/* Nos Cinemas Agora */}
          {content.nowPlayingMovies && <MediaRow title={tm('nowPlayingShort')} items={content.nowPlayingMovies.results} mediaType="movie" watchlistMap={watchlistMap} />}

          {/* Séries No Ar */}
          {content.onTheAirTV && <MediaRow title={tm('onTheAir')} items={content.onTheAirTV.results} mediaType="tv" watchlistMap={watchlistMap} />}

          {/* Melhor Avaliados - Filmes */}
          {content.topRatedMovies && <MediaRow title={tm('topRatedMovies')} items={content.topRatedMovies.results} mediaType="movie" watchlistMap={watchlistMap} />}

          {/* Melhor Avaliadas - Séries */}
          {content.topRatedTV && <MediaRow title={tm('topRatedTV')} items={content.topRatedTV.results} mediaType="tv" watchlistMap={watchlistMap} />}
        </div>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('[Home Page] Error loading authenticated content:', error);

    // Em caso de erro, tentar mostrar landing page como fallback
    try {
      const acceptLanguage = headersList.get('accept-language');
      const browserLanguage = await getUserLanguage(null, acceptLanguage);
      const landingData = await getCachedLandingData(browserLanguage);
      console.log('[Home Page] Fallback to landing page successful');
      return (
        <LandingPage
          trending={landingData.trending}
          trendingMovies={landingData.trendingMovies}
          trendingTV={landingData.trendingTV}
        />
      );
    } catch (fallbackError) {
      console.error('[Home Page] Fallback to landing page also failed:', fallbackError);
      // Último fallback - página de erro
      return (
        <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: GRADIENTS.pageContent }}>
          <NavbarWrapper />
          <div className="flex flex-col items-center justify-center flex-1 px-4">
            <div className="text-white text-xl mb-4">{te('loadingError')}</div>
            <div className="text-white/70 text-sm max-w-md text-center">
              {te('loadingErrorDesc')}
            </div>
          </div>
          <Footer />
        </div>
      );
    }
  }
}

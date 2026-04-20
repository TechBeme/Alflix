import type { Metadata } from 'next';
import { SITE_NAME_FULL, SITE_LOCALE, SITE_LANGUAGE, SITE_URL } from './config';

/**
 * SEO Utilities - AllFlix
 *
 * Centraliza helpers e geradores de metadata/JSON-LD
 * para garantir SEO consistente e otimizado em toda a aplicação.
 * 
 * Configurações globais (SITE_NAME, SITE_URL, etc.) estão em lib/config.ts
 */

// ─── Re-exports (para compatibilidade) ────────────────────────────────────

/** Re-exporta SITE_URL de config.ts para arquivos que precisam (sitemap, robots, etc) */
export { SITE_URL } from './config';

// ─── SEO Constants ─────────────────────────────────────────────────────────

/** Descrição padrão do site para metadata SEO (fallback, prefer translated via metadata.siteDescription) */
export const SITE_DESCRIPTION =
  'Access thousands of movies and shows from all streaming platforms in a single subscription. Netflix, HBO, Disney+ and more.';

/** Imagem padrão para Open Graph e Twitter Cards */
export const DEFAULT_OG_IMAGE = '/opengraph-image';

// ─── Keywords ───────────────────────────────────────────────────────────────

/** Default keywords fallback (prefer translated via metadata.keywordsHome) */
export const DEFAULT_KEYWORDS = [
  'streaming',
  'movies',
  'shows',
  'watch online',
  'streaming platform',
  'Netflix',
  'HBO',
  'Disney+',
  'Amazon Prime',
  'Paramount+',
  'movies online',
  'shows online',
  'unified streaming',
  SITE_NAME_FULL.toLowerCase(),
];

// ─── Metadata Helpers ───────────────────────────────────────────────────────

interface CreateMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article' | 'video.movie' | 'video.tv_show';
  noIndex?: boolean;
  /** Locale dinâmico em formato Open Graph (ex: 'pt_BR', 'en_US') */
  locale?: string;
  /** Override base keywords (translated). Falls back to DEFAULT_KEYWORDS if not provided */
  baseKeywords?: string[];
}

/**
 * Cria metadata padronizada para páginas estáticas.
 * Inclui Open Graph, Twitter Cards e configurações canônicas.
 */
export function createMetadata({
  title,
  description,
  path = '',
  keywords = [],
  ogImage,
  ogType = 'website',
  noIndex = false,
  locale,
  baseKeywords,
}: CreateMetadataOptions): Metadata {
  const siteUrl = SITE_URL;
  const url = `${siteUrl}${path}`;
  const image = ogImage || `${siteUrl}${DEFAULT_OG_IMAGE}`;
  const allKeywords = [...(baseKeywords || DEFAULT_KEYWORDS), ...keywords];

  return {
    title,
    description,
    keywords: allKeywords,
    authors: [{ name: SITE_NAME_FULL }],
    creator: SITE_NAME_FULL,
    publisher: SITE_NAME_FULL,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: ogType,
      locale: locale || SITE_LOCALE, // Usa locale dinâmico ou fallback
      url,
      siteName: SITE_NAME_FULL,
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@allflixbr',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
  };
}

// ─── Dynamic Metadata for Media ─────────────────────────────────────────────

interface MediaSeoData {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
}

/**
 * i18n-aware translations for createMediaMetadata.
 * Caller should pass translated values from mediaSeo namespace.
 */
export interface MediaSeoTranslations {
  noTitle: string;
  watchOnline: string;
  movie: string;
  tvShow: string;
  watchMediaOnline: (vars: { title: string }) => string;
  watchTypeOnline: (vars: { type: string; title: string; siteName: string }) => string;
  genres: (vars: { genres: string }) => string;
  seasons: (vars: { count: number }) => string;
  poster: (vars: { title: string }) => string;
  watchTitle: (vars: { title: string }) => string;
  titleOnline: (vars: { title: string }) => string;
  titleStreaming: (vars: { title: string }) => string;
  titleYear: (vars: { title: string; year: number }) => string;
  watchOnlineKeyword: string;
}

/**
 * Gera metadata dinâmica para páginas de detalhes de filmes/séries.
 * Otimizado para ranqueamento por título do conteúdo.
 */
export function createMediaMetadata(
  media: MediaSeoData,
  mediaType: 'movie' | 'tv',
  locale?: string,
  seoT?: MediaSeoTranslations
): Metadata {
  const siteUrl = SITE_URL;
  const isMovie = mediaType === 'movie';
  const mediaTitle = media.title || media.name || (seoT?.noTitle ?? 'No title');

  // Ano de lançamento
  const releaseDate = isMovie ? media.release_date : media.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  // Gêneros
  const genreNames = media.genres?.map((g) => g.name).join(', ') || '';

  // Título SEO otimizado para busca (sem SITE_NAME — layout template adiciona automaticamente)
  const watchOnlineLabel = seoT?.watchOnline ?? 'Watch Online';
  const seoTitle = year
    ? `${mediaTitle} (${year}) - ${watchOnlineLabel}`
    : `${mediaTitle} - ${watchOnlineLabel}`;

  // Descrição SEO rica em keywords
  const typeLabel = isMovie ? (seoT?.movie ?? 'movie') : (seoT?.tvShow ?? 'show');
  const overview = media.overview || '';
  const ratingText = media.vote_average
    ? ` ⭐ ${media.vote_average.toFixed(1)}/10.`
    : '';
  const genreText = genreNames ? ` ${seoT?.genres({ genres: genreNames }) ?? `Genres: ${genreNames}.`}` : '';
  const seasonText =
    !isMovie && media.number_of_seasons
      ? ` ${seoT?.seasons({ count: media.number_of_seasons }) ?? `${media.number_of_seasons} season${media.number_of_seasons > 1 ? 's' : ''}.`}`
      : '';

  const seoDescription = overview
    ? `${seoT?.watchMediaOnline({ title: mediaTitle }) ?? `Watch ${mediaTitle} online.`}${ratingText}${genreText}${seasonText} ${overview.substring(0, 160)}`
    : `${seoT?.watchTypeOnline({ type: typeLabel, title: mediaTitle, siteName: SITE_NAME_FULL }) ?? `Watch ${typeLabel} ${mediaTitle} online on ${SITE_NAME_FULL}.`}${ratingText}${genreText}${seasonText}`;

  // Imagem OG (preferir backdrop por ser landscape, ideal para OG)
  const ogImagePath = media.backdrop_path || media.poster_path;
  const ogImage = ogImagePath
    ? `https://image.tmdb.org/t/p/w1280${ogImagePath}`
    : `${siteUrl}${DEFAULT_OG_IMAGE}`;

  // Poster para Twitter (mais quadrado)
  const twitterImage = media.poster_path
    ? `https://image.tmdb.org/t/p/w780${media.poster_path}`
    : ogImage;

  const url = `${siteUrl}/media/${mediaType}/${media.id}`;

  // Keywords específicas do conteúdo
  const mediaKeywords = [
    mediaTitle,
    seoT?.watchTitle({ title: mediaTitle }) ?? `watch ${mediaTitle}`,
    seoT?.titleOnline({ title: mediaTitle }) ?? `${mediaTitle} online`,
    seoT?.titleStreaming({ title: mediaTitle }) ?? `${mediaTitle} streaming`,
    ...(genreNames ? genreNames.split(', ') : []),
    ...(year ? [seoT?.titleYear({ title: mediaTitle, year }) ?? `${mediaTitle} ${year}`] : []),
    ...(isMovie ? [(seoT?.movie ?? 'movie'), 'movie'] : [(seoT?.tvShow ?? 'show'), 'series', 'tv show']),
    seoT?.watchOnlineKeyword ?? 'watch online',
    'streaming',
  ];

  const posterAlt = seoT?.poster({ title: mediaTitle }) ?? `${mediaTitle} - Poster`;

  return {
    title: seoTitle,
    description: seoDescription.substring(0, 320),
    keywords: mediaKeywords,
    authors: [{ name: SITE_NAME_FULL }],
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: isMovie ? 'video.movie' : 'video.tv_show',
      locale: locale || SITE_LOCALE,
      url,
      siteName: SITE_NAME_FULL,
      title: seoTitle,
      description: seoDescription.substring(0, 200),
      images: [
        {
          url: ogImage,
          width: 1280,
          height: 720,
          alt: posterAlt,
          type: 'image/jpeg',
        },
      ],
      ...(isMovie && releaseDate ? { releaseDate } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription.substring(0, 200),
      images: [twitterImage],
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  };
}

// ─── JSON-LD Structured Data ────────────────────────────────────────────────

/**
 * JSON-LD para a organização (aparece em todas as páginas via layout).
 */
export function generateOrganizationJsonLd(description?: string) {
  const siteUrl = SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME_FULL,
    url: siteUrl,
    logo: `${siteUrl}/favicon-512x512.png`,
    description: description || SITE_DESCRIPTION,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['Portuguese', 'English', 'Spanish'],
    },
  };
}

/**
 * JSON-LD para WebSite (habilita sitelinks search box no Google).
 */
export function generateWebSiteJsonLd(description?: string) {
  const siteUrl = SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME_FULL,
    url: siteUrl,
    description: description || SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * JSON-LD para página de filme (schema.org/Movie).
 */
export function generateMovieJsonLd(media: MediaSeoData, noTitle?: string) {
  const siteUrl = SITE_URL;
  const title = media.title || noTitle || 'No title';
  const releaseDate = media.release_date || '';
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w780${media.poster_path}`
    : `${siteUrl}${DEFAULT_OG_IMAGE}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    description: media.overview || '',
    image: posterUrl,
    datePublished: releaseDate,
    url: `${siteUrl}/media/movie/${media.id}`,
    ...(media.genres
      ? { genre: media.genres.map((g) => g.name) }
      : {}),
    ...(media.vote_average && media.vote_count
      ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: media.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '0',
          ratingCount: media.vote_count,
        },
      }
      : {}),
    ...(media.runtime
      ? { duration: `PT${media.runtime}M` }
      : {}),
  };
}

/**
 * JSON-LD para página de série (schema.org/TVSeries).
 */
export function generateTVSeriesJsonLd(media: MediaSeoData, noTitle?: string) {
  const siteUrl = SITE_URL;
  const name = media.name || noTitle || 'No title';
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w780${media.poster_path}`
    : `${siteUrl}${DEFAULT_OG_IMAGE}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name,
    description: media.overview || '',
    image: posterUrl,
    startDate: media.first_air_date || '',
    url: `${siteUrl}/media/tv/${media.id}`,
    ...(media.genres
      ? { genre: media.genres.map((g) => g.name) }
      : {}),
    ...(media.number_of_seasons
      ? { numberOfSeasons: media.number_of_seasons }
      : {}),
    ...(media.vote_average && media.vote_count
      ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: media.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '0',
          ratingCount: media.vote_count,
        },
      }
      : {}),
  };
}

/**
 * JSON-LD para BreadcrumbList.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; path?: string }>,
  homeName?: string
) {
  const siteUrl = SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: homeName || 'Home',
        item: siteUrl,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        ...(item.path ? { item: `${siteUrl}${item.path}` } : {}),
      })),
    ],
  };
}

/**
 * JSON-LD para FAQPage (sobre, ajuda, etc).
 */
export function generateFAQJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}



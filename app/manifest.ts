import type { MetadataRoute } from 'next';
import { SITE_NAME_FULL } from '@/lib/config';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const t = await getTranslations('manifest');
    const locale = await getLocale();

    // Map locale to screenshot directory (en, pt-BR, es)
    // For unsupported locales, fallback to English
    const supportedLocales = ['en', 'pt-BR', 'es'];
    const screenshotLocale = supportedLocales.includes(locale) ? locale : 'en';

    return {
        id: '/',
        name: t('name', { siteName: SITE_NAME_FULL }),
        short_name: SITE_NAME_FULL,
        description: t('description'),
        start_url: '/login',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        categories: ['entertainment', 'video'],
        lang: locale,
        dir: 'ltr',
        scope: '/',
        icons: [
            {
                src: '/favicon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/favicon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/android-icon.png',
                sizes: '500x500',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        screenshots: [
            // Desktop (wide) - locale-specific
            {
                src: `/screenshots/${screenshotLocale}/desktop/home.png`,
                sizes: '3840x2160',
                type: 'image/png',
                form_factor: 'wide',
                label: t('screenshots.home'),
            },
            {
                src: `/screenshots/${screenshotLocale}/desktop/browse-movies.png`,
                sizes: '3840x2160',
                type: 'image/png',
                form_factor: 'wide',
                label: t('screenshots.browseMovies'),
            },
            {
                src: `/screenshots/${screenshotLocale}/desktop/browse-tv.png`,
                sizes: '3840x2160',
                type: 'image/png',
                form_factor: 'wide',
                label: t('screenshots.browseTv'),
            },
            {
                src: `/screenshots/${screenshotLocale}/desktop/search.png`,
                sizes: '3840x2160',
                type: 'image/png',
                form_factor: 'wide',
                label: t('screenshots.search'),
            },
            // Mobile (narrow) - locale-specific
            {
                src: `/screenshots/${screenshotLocale}/mobile/home.png`,
                sizes: '2160x3840',
                type: 'image/png',
                form_factor: 'narrow',
                label: t('screenshots.homeMobile'),
            },
            {
                src: `/screenshots/${screenshotLocale}/mobile/browse-movies.png`,
                sizes: '2160x3840',
                type: 'image/png',
                form_factor: 'narrow',
                label: t('screenshots.browseMoviesMobile'),
            },
            {
                src: `/screenshots/${screenshotLocale}/mobile/browse-tv.png`,
                sizes: '2160x3840',
                type: 'image/png',
                form_factor: 'narrow',
                label: t('screenshots.browseTvMobile'),
            },
            {
                src: `/screenshots/${screenshotLocale}/mobile/search.png`,
                sizes: '2160x3840',
                type: 'image/png',
                form_factor: 'narrow',
                label: t('screenshots.searchMobile'),
            },
        ],
        shortcuts: [
            {
                name: 'Search',
                short_name: 'Search',
                description: 'Search movies and TV shows',
                url: '/search',
                icons: [
                    {
                        src: '/favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                ],
            },
            {
                name: 'My List',
                short_name: 'My List',
                description: 'View your watchlist',
                url: '/my-list',
                icons: [
                    {
                        src: '/favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                ],
            },
            {
                name: 'Movies',
                short_name: 'Movies',
                description: 'Browse movies',
                url: '/movies',
                icons: [
                    {
                        src: '/favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                ],
            },
            {
                name: 'TV Shows',
                short_name: 'TV Shows',
                description: 'Browse TV shows',
                url: '/tv',
                icons: [
                    {
                        src: '/favicon-96x96.png',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                ],
            },
        ],
        share_target: {
            action: '/search',
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: {
                title: 'text',
                text: 'text',
                url: 'url',
            },
        },
        display_override: ['window-controls-overlay', 'standalone'],
        launch_handler: {
            client_mode: ['navigate-existing', 'auto'],
        },
    };
}

/**
 * i18n Routing Configuration
 *
 * Define supported locales, default locale, and URL prefix strategy.
 * Uses 'never' prefix to keep clean URLs without /pt-BR/, /en/, etc.
 * Locale is detected via cookie → Accept-Language → defaultLocale.
 */

import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'pt-BR', 'es', 'ar', 'de', 'fr', 'hi', 'it', 'ja', 'ko', 'ru', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
    locales,
    defaultLocale: 'en',
    localePrefix: 'never',
});

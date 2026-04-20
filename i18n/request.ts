/**
 * i18n Server Request Configuration
 *
 * Provides locale and messages to Server Components.
 * 
 * Locale detection priority:
 * 1. NEXT_LOCALE cookie (explicit user choice, set instantly on language switch)
 * 2. Authenticated user's DB preference (cross-device sync / first visit fallback)
 * 3. Accept-Language header
 * 4. defaultLocale ('en')
 * 
 * This ensures the UI language matches the user's saved content language preference.
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { routing } from './routing';
import { tmdbToLocale } from '@/lib/language';

type Messages = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

/**
 * Deep-merge messages with fallback.
 * - Uses `base` when `override` is missing or an empty string
 * - Recurses into nested objects
 */
function mergeMessages(base: Messages, override: Messages): Messages {
    const result: Messages = { ...base };

    for (const [key, overrideValue] of Object.entries(override)) {
        const baseValue = base[key];

        if (
            overrideValue &&
            typeof overrideValue === 'object' &&
            !Array.isArray(overrideValue) &&
            baseValue &&
            typeof baseValue === 'object' &&
            !Array.isArray(baseValue)
        ) {
            result[key] = mergeMessages(baseValue as Messages, overrideValue as Messages);
            continue;
        }

        if (isNonEmptyString(overrideValue)) {
            result[key] = overrideValue;
        }
    }

    return result;
}

function isValidLocale(locale: string): locale is (typeof routing.locales)[number] {
    return routing.locales.includes(locale as (typeof routing.locales)[number]);
}

/**
 * Detect locale from Accept-Language header.
 * Matches exact locales (e.g. pt-BR) and language prefixes (e.g. pt → pt-BR).
 */
function detectLocaleFromHeader(acceptLanguage: string): string | null {
    const parts = acceptLanguage.split(',');
    for (const part of parts) {
        const lang = part.split(';')[0].trim();
        // Exact match
        if (isValidLocale(lang)) return lang;
        // Language prefix match (e.g. "pt" → "pt-BR", "en" → "en", "es" → "es")
        const prefix = lang.split('-')[0].toLowerCase();
        const match = routing.locales.find(
            (l) => l.toLowerCase().startsWith(prefix)
        );
        if (match) return match;
    }
    return null;
}

/**
 * Try to get the authenticated user's language preference from DB.
 * Returns UI locale if it maps to one, null otherwise.
 */
async function getAuthenticatedUserLocale(): Promise<string | null> {
    try {
        const { auth } = await import('@/lib/auth');
        const headerStore = await headers();
        const session = await auth.api.getSession({ headers: headerStore });

        if (!session?.user?.id) return null;

        const { prisma } = await import('@/lib/prisma');
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
            select: { language: true },
        });

        if (!preferences?.language) return null;

        // Map TMDB code to UI locale (e.g., 'en-US' → 'en', 'pt-BR' → 'pt-BR')
        const uiLocale = tmdbToLocale(preferences.language);
        if (uiLocale && isValidLocale(uiLocale)) {
            return uiLocale;
        }

        return null;
    } catch {
        // Silent fail — fall through to other detection methods
        return null;
    }
}

export default getRequestConfig(async ({ requestLocale }) => {
    // 1. Try requestLocale (from Next.js internals, if available)
    let locale = await requestLocale;

    // 2. Try NEXT_LOCALE cookie (highest explicit priority — set instantly on language switch)
    if (!locale || !isValidLocale(locale)) {
        try {
            const cookieStore = await cookies();
            const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
            if (cookieLocale && isValidLocale(cookieLocale)) {
                locale = cookieLocale;
            }
        } catch {
            // cookies() may throw in some contexts — ignore
        }
    }

    // 3. Try authenticated user's DB preference (fallback for first visit / cross-device sync)
    if (!locale || !isValidLocale(locale)) {
        const dbLocale = await getAuthenticatedUserLocale();
        if (dbLocale) {
            locale = dbLocale;
        }
    }

    // 4. Try Accept-Language header
    if (!locale || !isValidLocale(locale)) {
        try {
            const headerStore = await headers();
            const acceptLang = headerStore.get('accept-language');
            if (acceptLang) {
                const detected = detectLocaleFromHeader(acceptLang);
                if (detected) locale = detected;
            }
        } catch {
            // headers() may throw in some contexts — ignore
        }
    }

    // 5. Fallback to default locale
    if (!locale || !isValidLocale(locale)) {
        locale = routing.defaultLocale;
    }

    const baseMessages = (await import(`../messages/${routing.defaultLocale}.json`)).default as Messages;
    const localeMessages = (await import(`../messages/${locale}.json`)).default as Messages;

    return {
        locale,
        messages: locale === routing.defaultLocale
            ? localeMessages
            : mergeMessages(baseMessages, localeMessages),
    };
});

/**
 * i18n Client Utilities
 *
 * Helpers for translating API error codes on the frontend.
 * Used by components that call API routes and need to display
 * translated error messages to the user.
 */

/**
 * Translates an API error code/messageKey into a human-readable message.
 *
 * API routes return error responses with a `code` field (e.g., "UNAUTHORIZED")
 * and a `message` field that contains an i18n key (e.g., "api.errors.unauthorized").
 *
 * This function takes a translation function `t` and the API error response,
 * and returns the translated message.
 *
 * @param t - The translation function from useTranslations()
 * @param apiError - The error object from API response { code, message, details? }
 * @returns Translated human-readable error message
 *
 * @example
 * ```tsx
 * const t = useTranslations();
 * const response = await fetch('/api/watchlist');
 * if (!response.ok) {
 *   const data = await response.json();
 *   const message = translateApiError(t, data.error);
 *   toast.error(message);
 * }
 * ```
 */
export function translateApiError(
    t: (key: string, params?: Record<string, string | number>) => string,
    apiError: { code?: string; message?: string; details?: unknown } | string
): string {
    // Handle string error (legacy format)
    if (typeof apiError === 'string') {
        try {
            return t(apiError);
        } catch {
            return apiError;
        }
    }

    // Try to translate the message field (which should be an i18n key)
    if (apiError.message) {
        try {
            return t(apiError.message);
        } catch {
            // If translation not found, return the message as-is
            return apiError.message;
        }
    }

    // Fallback: translate based on error code
    if (apiError.code) {
        const codeMap: Record<string, string> = {
            UNAUTHORIZED: 'api.errors.unauthorized',
            FORBIDDEN: 'api.errors.forbidden',
            NOT_FOUND: 'api.errors.notFound',
            BAD_REQUEST: 'api.errors.badRequest',
            VALIDATION_ERROR: 'api.errors.validationError',
            RATE_LIMIT_EXCEEDED: 'api.errors.rateLimitExceeded',
            INTERNAL_ERROR: 'api.errors.internalError',
            METHOD_NOT_ALLOWED: 'api.errors.methodNotAllowed',
        };

        const key = codeMap[apiError.code];
        if (key) {
            try {
                return t(key);
            } catch {
                return apiError.code;
            }
        }
    }

    return t('common.unknownError');
}

/**
 * Gets the locale-appropriate date format string
 */
export function getDateLocale(locale: string): string {
    const map: Record<string, string> = {
        'pt-BR': 'pt-BR',
        en: 'en-US',
        es: 'es-ES',
        ar: 'ar-SA',
        de: 'de-DE',
        fr: 'fr-FR',
        hi: 'hi-IN',
        it: 'it-IT',
        ja: 'ja-JP',
        ko: 'ko-KR',
        ru: 'ru-RU',
        zh: 'zh-CN',
    };
    return map[locale] || 'en-US';
}

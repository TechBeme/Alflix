/**
 * Language Detection Utilities
 * 
 * Processa o header Accept-Language do navegador e mapeia para idiomas suportados pelo TMDB
 * Usa códigos ISO 639-1 compatíveis com TMDB API
 */

/**
 * Idiomas suportados pelo TMDB API
 * Baseado em: https://api.themoviedb.org/3/configuration/languages
 * 
 * Inclui:
 * 1. Variantes regionais populares (pt-BR, en-US, etc)
 * 2. Todos os 187 códigos ISO 639-1 do TMDB
 * 
 * A API TMDB aceita ambos os formatos:
 * - ?language=pt-BR (variante específica)
 * - ?language=pt (código genérico)
 */
export const SUPPORTED_LANGUAGES = [
    // Variantes regionais populares (mantidas para compatibilidade)
    'pt-BR', 'pt-PT', 'en-US', 'en-GB', 'es-ES', 'es-MX',
    'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR',
    'zh-CN', 'zh-TW', 'ru-RU', 'ar-SA', 'hi-IN',
    // Códigos ISO 639-1 do TMDB (187 idiomas)
    'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
    'ba', 'be', 'bg', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
    'ca', 'ce', 'ch', 'cn', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
    'da', 'de', 'dv', 'dz',
    'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
    'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
    'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
    'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
    'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
    'ja', 'jv',
    'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
    'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
    'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mo', 'mr', 'ms', 'mt', 'my',
    'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
    'oc', 'oj', 'om', 'or', 'os',
    'pa', 'pi', 'pl', 'ps', 'pt',
    'qu',
    'rm', 'rn', 'ro', 'ru', 'rw',
    'sa', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
    'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
    'ug', 'uk', 'ur', 'uz',
    've', 'vi', 'vo',
    'wa', 'wo',
    'xh', 'xx',
    'yi', 'yo',
    'za', 'zh', 'zu',
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const DEFAULT_LANGUAGE: SupportedLanguage = 'en-US';

/**
 * Mapeia código de idioma genérico para variante específica suportada
 * Exemplo: 'pt' -> 'pt-BR', 'en' -> 'en-US'
 */
const LANGUAGE_VARIANTS: Record<string, string> = {
    'pt': 'pt-BR',     // Português -> Brasil (maior público)
    'en': 'en-US',     // English -> US
    'es': 'es-ES',     // Español -> España
    'fr': 'fr-FR',     // Français -> France
    'de': 'de-DE',     // Deutsch -> Germany
    'it': 'it-IT',     // Italiano -> Italy
    'ja': 'ja-JP',     // Japanese -> Japan
    'ko': 'ko-KR',     // Korean -> South Korea
    'zh': 'zh-CN',     // Chinese -> Simplified
    'ru': 'ru-RU',     // Russian -> Russia
    'ar': 'ar-SA',     // Arabic -> Saudi Arabia
    'hi': 'hi-IN',     // Hindi -> India
};

/**
 * Parse Accept-Language header e retorna o idioma mais adequado
 * 
 * Exemplo de header: "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
 * 
 * @param acceptLanguageHeader - Header Accept-Language do navegador
 * @returns Código de idioma no formato TMDB (ex: 'pt-BR', 'en-US')
 */
export function parseAcceptLanguage(acceptLanguageHeader: string | null): string {
    if (!acceptLanguageHeader) {
        return DEFAULT_LANGUAGE;
    }

    try {
        // Parse: "pt-BR,pt;q=0.9,en;q=0.8" -> [{ lang: 'pt-BR', q: 1.0 }, { lang: 'pt', q: 0.9 }, ...]
        const languages = acceptLanguageHeader
            .split(',')
            .map(lang => {
                const [code, qValue] = lang.trim().split(';');
                const quality = qValue ? parseFloat(qValue.replace('q=', '')) : 1.0;
                return { code: code.trim(), quality };
            })
            .sort((a, b) => b.quality - a.quality); // Ordenar por qualidade (preferência)

        // Tentar encontrar match exato primeiro (ex: pt-BR)
        for (const { code } of languages) {
            if (SUPPORTED_LANGUAGES.includes(code as any)) {
                return code;
            }
        }

        // Tentar encontrar variante genérica (ex: pt -> pt-BR)
        for (const { code } of languages) {
            const shortCode = code.split('-')[0].toLowerCase();
            if (LANGUAGE_VARIANTS[shortCode]) {
                return LANGUAGE_VARIANTS[shortCode];
            }
        }

        // Fallback: inglês
        return DEFAULT_LANGUAGE;

    } catch (error) {
        console.error('[Language Detection] Error parsing Accept-Language:', error);
        return DEFAULT_LANGUAGE;
    }
}

/**
 * Valida se um código de idioma é suportado pelo TMDB
 */
export function isSupportedLanguage(language: string): boolean {
    return SUPPORTED_LANGUAGES.includes(language as any);
}

/**
 * Normaliza código de idioma para formato TMDB
 * Exemplo: 'pt' -> 'pt-BR', 'PT-br' -> 'pt-BR'
 */
export function normalizeLanguage(language: string): string {
    const normalized = language.trim();

    // Já está no formato correto
    if (SUPPORTED_LANGUAGES.includes(normalized as any)) {
        return normalized;
    }

    // Tentar variante genérica
    const shortCode = normalized.split('-')[0].toLowerCase();
    if (LANGUAGE_VARIANTS[shortCode]) {
        return LANGUAGE_VARIANTS[shortCode];
    }

    return DEFAULT_LANGUAGE;
}

/**
 * Language names from TMDB API
 * Maps ISO 639-1 codes to localized names (or English fallback)
 */
export const LANGUAGE_NAMES: Record<string, string> = {
    'aa': 'Qafar af', 'ab': 'Abkhazian', 'ae': 'Upastawakaēna', 'af': 'Afrikaans',
    'ak': 'Ákán', 'am': 'Amharic', 'an': 'Aragonés', 'ar': 'العربية',
    'as': 'অসমীয়া', 'av': 'магӏарул мацӏ', 'ay': 'Aymara', 'az': 'Azərbaycan',
    'ba': 'Башҡорт теле', 'be': 'беларуская мова', 'bg': 'български език', 'bi': 'Bislama',
    'bm': 'Bamanankan', 'bn': 'বাংলা', 'bo': 'བོད་སྐད་།', 'br': 'Brezhoneg',
    'bs': 'Bosanski', 'ca': 'Català', 'ce': 'Chechen', 'ch': 'Finu\' Chamorro',
    'cn': '广州话 / 廣州話', 'co': 'Corsican', 'cr': 'Cree', 'cs': 'Český',
    'cu': 'Slavic', 'cv': 'Chuvash', 'cy': 'Cymraeg', 'da': 'Dansk',
    'de': 'Deutsch', 'dv': 'Divehi', 'dz': 'Dzongkha', 'ee': 'Èʋegbe',
    'el': 'ελληνικά', 'en': 'English', 'eo': 'Esperanto', 'es': 'Español',
    'et': 'Eesti', 'eu': 'euskera', 'fa': 'فارسی', 'ff': 'Fulfulde',
    'fi': 'suomi', 'fj': 'Fijian', 'fo': 'Faroese', 'fr': 'Français',
    'fy': 'Frisian', 'ga': 'Gaeilge', 'gd': 'Gaelic', 'gl': 'Galego',
    'gn': 'Guarani', 'gu': 'Gujarati', 'gv': 'Manx', 'ha': 'Hausa',
    'he': 'עִבְרִית', 'hi': 'हिन्दी', 'ho': 'Hiri Motu', 'hr': 'Hrvatski',
    'ht': 'Haitian; Haitian Creole', 'hu': 'Magyar', 'hy': 'Armenian', 'hz': 'Herero',
    'ia': 'Interlingua', 'id': 'Bahasa indonesia', 'ie': 'Interlingue', 'ig': 'Igbo',
    'ii': 'Yi', 'ik': 'Inupiaq', 'io': 'Ido', 'is': 'Íslenska',
    'it': 'Italiano', 'iu': 'Inuktitut', 'ja': '日本語', 'jv': 'Javanese',
    'ka': 'ქართული', 'kg': 'Kongo', 'ki': 'Kikuyu', 'kj': 'Kuanyama',
    'kk': 'қазақ', 'kl': 'Kalaallisut', 'km': 'Khmer', 'kn': '?????',
    'ko': '한국어/조선말', 'kr': 'Kanuri', 'ks': 'Kashmiri', 'ku': 'Kurdish',
    'kv': 'Komi', 'kw': 'Cornish', 'ky': '??????', 'la': 'Latin',
    'lb': 'Letzeburgesch', 'lg': 'Ganda', 'li': 'Limburgish', 'ln': 'Lingala',
    'lo': 'Lao', 'lt': 'Lietuvių', 'lu': 'Luba-Katanga', 'lv': 'Latviešu',
    'mg': 'Malagasy', 'mh': 'Marshall', 'mi': 'Maori', 'mk': 'Macedonian',
    'ml': 'Malayalam', 'mn': 'Mongolian', 'mo': 'Moldavian', 'mr': 'Marathi',
    'ms': 'Bahasa melayu', 'mt': 'Malti', 'my': 'Burmese', 'na': 'Nauru',
    'nb': 'Bokmål', 'nd': 'Ndebele', 'ne': 'Nepali', 'ng': 'Ndonga',
    'nl': 'Nederlands', 'nn': 'Norwegian Nynorsk', 'no': 'Norsk', 'nr': 'Ndebele',
    'nv': 'Navajo', 'ny': 'Chichewa; Nyanja', 'oc': 'Occitan', 'oj': 'Ojibwa',
    'om': 'Oromo', 'or': 'Oriya', 'os': 'Ossetian; Ossetic', 'pa': 'ਪੰਜਾਬੀ',
    'pi': 'Pali', 'pl': 'Polski', 'ps': 'پښتو', 'pt': 'Português',
    'qu': 'Quechua', 'rm': 'Raeto-Romance', 'rn': 'Kirundi', 'ro': 'Română',
    'ru': 'Pусский', 'rw': 'Kinyarwanda', 'sa': 'Sanskrit', 'sc': 'Sardinian',
    'sd': 'Sindhi', 'se': 'Northern Sami', 'sg': 'Sango', 'sh': 'Serbo-Croatian',
    'si': 'සිංහල', 'sk': 'Slovenčina', 'sl': 'Slovenščina', 'sm': 'Samoan',
    'sn': 'Shona', 'so': 'Somali', 'sq': 'shqip', 'sr': 'Srpski',
    'ss': 'Swati', 'st': 'Sotho', 'su': 'Sundanese', 'sv': 'svenska',
    'sw': 'Kiswahili', 'ta': 'தமிழ்', 'te': 'తెలుగు', 'tg': 'Tajik',
    'th': 'ภาษาไทย', 'ti': 'Tigrinya', 'tk': 'Turkmen', 'tl': 'Tagalog',
    'tn': 'Tswana', 'to': 'Tonga', 'tr': 'Türkçe', 'ts': 'Xitsonga',
    'tt': 'Tatar', 'tw': 'Twi', 'ty': 'Tahitian', 'ug': 'Uighur',
    'uk': 'Український', 'ur': 'اردو', 'uz': 'ozbek', 've': 'Venda',
    'vi': 'Tiếng Việt', 'vo': 'Volapük', 'wa': 'Walloon', 'wo': 'Wolof',
    'xh': 'Xhosa', 'xx': 'No Language', 'yi': 'Yiddish', 'yo': 'Èdè Yorùbá',
    'za': 'Zhuang', 'zh': '普通话', 'zu': 'isiZulu',
};

/**
 * Regional variant names (not in TMDB API, manually mapped)
 */
export const REGIONAL_VARIANT_NAMES: Record<string, string> = {
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
    'en-US': 'English (US)',
    'en-GB': 'English (UK)',
    'es-ES': 'Español (España)',
    'es-MX': 'Español (México)',
    'fr-FR': 'Français (France)',
    'de-DE': 'Deutsch (Deutschland)',
    'it-IT': 'Italiano (Italia)',
    'ja-JP': '日本語 (日本)',
    'ko-KR': '한국어 (한국)',
    'zh-CN': '中文 (简体)',
    'zh-TW': '中文 (繁體)',
    'ru-RU': 'Русский (Россия)',
    'ar-SA': 'العربية (السعودية)',
    'hi-IN': 'हिन्दी (भारत)',
};

/**
 * Get display name for a language code
 * Supports both regional variants (pt-BR) and simple codes (pt)
 * 
 * @param code - Language code (e.g., 'pt-BR', 'pt', 'en')
 * @returns Localized language name
 */
export function getLanguageName(code: string): string {
    // Tentar variante regional primeiro
    if (REGIONAL_VARIANT_NAMES[code]) {
        return REGIONAL_VARIANT_NAMES[code];
    }

    // Tentar código simples
    if (LANGUAGE_NAMES[code]) {
        return LANGUAGE_NAMES[code];
    }

    // Fallback para o próprio código
    return code.toUpperCase();
}

/**
 * Converte locale do next-intl para código TMDB
 * 
 * Next-intl usa: 'pt-BR', 'en', 'es'
 * TMDB usa: 'pt-BR', 'en-US', 'es-ES'
 */
export function localeToTMDB(locale: string): string {
    const map: Record<string, string> = {
        'pt-BR': 'pt-BR',
        'en': 'en-US',
        'es': 'es-ES',
        'ar': 'ar-SA',
        'de': 'de-DE',
        'fr': 'fr-FR',
        'hi': 'hi-IN',
        'it': 'it-IT',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'ru': 'ru-RU',
        'zh': 'zh-CN',
    };
    return map[locale] || 'en-US';
}

/**
 * Converte código TMDB para locale do next-intl
 * 
 * TMDB usa: 'pt-BR', 'en-US', 'es-ES'
 * Next-intl usa: 'pt-BR', 'en', 'es'
 * 
 * Retorna null se não houver locale correspondente
 */
export function tmdbToLocale(tmdbCode: string): string | null {
    const map: Record<string, string> = {
        'pt-BR': 'pt-BR',
        'en-US': 'en',
        'es-ES': 'es',
        'ar-SA': 'ar',
        'de-DE': 'de',
        'fr-FR': 'fr',
        'hi-IN': 'hi',
        'it-IT': 'it',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'ru-RU': 'ru',
        'zh-CN': 'zh',
    };
    return map[tmdbCode] || null;
}

/**
 * Converte locale do next-intl para formato Open Graph
 * 
 * Next-intl usa: 'pt-BR', 'en', 'es'
 * Open Graph usa: 'pt_BR', 'en_US', 'es_ES'
 * 
 * @param locale - Locale do next-intl (ex: 'pt-BR', 'en', 'es')
 * @returns Locale no formato Open Graph (ex: 'pt_BR', 'en_US', 'es_ES')
 */
export function localeToOpenGraph(locale: string): string {
    const map: Record<string, string> = {
        'pt-BR': 'pt_BR',
        'pt': 'pt_BR',
        'en': 'en_US',
        'en-US': 'en_US',
        'es': 'es_ES',
        'es-ES': 'es_ES',
        'ar': 'ar_SA',
        'ar-SA': 'ar_SA',
        'de': 'de_DE',
        'de-DE': 'de_DE',
        'fr': 'fr_FR',
        'fr-FR': 'fr_FR',
        'hi': 'hi_IN',
        'hi-IN': 'hi_IN',
        'it': 'it_IT',
        'it-IT': 'it_IT',
        'ja': 'ja_JP',
        'ja-JP': 'ja_JP',
        'ko': 'ko_KR',
        'ko-KR': 'ko_KR',
        'ru': 'ru_RU',
        'ru-RU': 'ru_RU',
        'zh': 'zh_CN',
        'zh-CN': 'zh_CN',
    };

    return map[locale] || 'en_US';
}

/**
 * Converte locale do next-intl para formato BCP 47 completo
 * 
 * Next-intl usa: 'pt-BR', 'en', 'es'
 * BCP 47 usa: 'pt-BR', 'en-US', 'es-ES'
 * 
 * @param locale - Locale do next-intl (ex: 'pt-BR', 'en', 'es')
 * @returns Locale no formato BCP 47 (ex: 'pt-BR', 'en-US', 'es-ES')
 */
export function localeToBCP47(locale: string): string {
    const map: Record<string, string> = {
        'pt-BR': 'pt-BR',
        'pt': 'pt-BR',
        'en': 'en-US',
        'en-US': 'en-US',
        'es': 'es-ES',
        'es-ES': 'es-ES',
        'ar': 'ar-SA',
        'ar-SA': 'ar-SA',
        'de': 'de-DE',
        'de-DE': 'de-DE',
        'fr': 'fr-FR',
        'fr-FR': 'fr-FR',
        'hi': 'hi-IN',
        'hi-IN': 'hi-IN',
        'it': 'it-IT',
        'it-IT': 'it-IT',
        'ja': 'ja-JP',
        'ja-JP': 'ja-JP',
        'ko': 'ko-KR',
        'ko-KR': 'ko-KR',
        'ru': 'ru-RU',
        'ru-RU': 'ru-RU',
        'zh': 'zh-CN',
        'zh-CN': 'zh-CN',
    };

    return map[locale] || 'en-US';
}

export function localeToDir(locale: string): 'ltr' | 'rtl' {
    const normalized = locale.toLowerCase();
    if (normalized === 'ar' || normalized.startsWith('ar-')) return 'rtl';
    return 'ltr';
}

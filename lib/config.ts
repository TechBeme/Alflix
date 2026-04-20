/**
 * Application Configuration
 *
 * Centraliza constantes de configuração global da aplicação,
 * incluindo branding, URLs, i18n e APIs externas.
 * 
 * Este arquivo contém apenas configurações gerais.
 * Constantes específicas de SEO (metadata) estão em lib/seo.ts
 */

// ─── Critical Environment Variables Guard ──────────────────────────────────
// Silent runtime check — detailed report runs ONCE via scripts/validate-env.mjs

if (typeof window === 'undefined') {
    for (const key of ['BETTER_AUTH_SECRET', 'TMDB_API_KEY'] as const) {
        if (!process.env[key]?.trim()) {
            throw new Error(
                `❌ ERRO CRÍTICO: Variável de ambiente ${key} não está configurada.\n` +
                `O sistema não pode funcionar sem esta variável.\n` +
                `Configure ${key} no arquivo .env.local antes de continuar.`
            );
        }
    }
}

// ─── Site Configuration ────────────────────────────────────────────────────

/** Nome do site (de env ou fallback) - permite whitelabeling */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'ALLFLIX';

/**
 * Sufixo opcional do nome do site, exibido em branco ao lado do nome principal (em vermelho).
 * Exemplo: SITE_NAME="ALLFLIX" + SITE_NAME_SUFFIX="LIVE" → "ALLFLIX" (bicolor)
 * Se não definido, o nome inteiro usa a cor primária.
 */
export const SITE_NAME_SUFFIX = process.env.NEXT_PUBLIC_SITE_NAME_SUFFIX || '';

/** Nome completo do site (prefixo + sufixo), usado em SEO, emails, copyright, etc. */
export const SITE_NAME_FULL = SITE_NAME_SUFFIX ? `${SITE_NAME}${SITE_NAME_SUFFIX}` : SITE_NAME;

/** Email de contato centralizado (de env ou fallback) */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'live@allflix.dev';

/** URL da aplicação centralizada (de env ou fallback) */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://live.allflix.dev';

/** URL base do site - calculada uma única vez durante o build */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : APP_URL.replace(/\/$/, '');

// ─── Internationalization ──────────────────────────────────────────────────

/** Locale padrão da aplicação (formato Open Graph) - usado como fallback */
export const SITE_LOCALE = 'en_US';

/** Idioma padrão da aplicação (formato BCP 47) - usado como fallback */
export const SITE_LANGUAGE = 'en-US';

/** Idioma para indexação/SEO (sitemaps, health checks, etc.) - neutro e independente de usuário */
export const INDEXING_LANGUAGE = 'en-US';

// ─── Email ──────────────────────────────────────────────────────────────────

/** Resend API Key (server-side only) */
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

/** Email remetente — ex: "ALLFLIX <noreply@yourdomain.com>" */
export const EMAIL_FROM = process.env.EMAIL_FROM || `${SITE_NAME} <noreply@${new URL(APP_URL).hostname}>`;

// ─── Authentication ────────────────────────────────────────────────────────

/** Better Auth Secret - chave para criptografia de sessões (server-side only) */
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || '';

// ─── External APIs ─────────────────────────────────────────────────────────

/** TMDB API base URL - usado para todas as requisições à API do TMDB */
export const TMDB_API_URL = process.env.TMDB_API_URL || 'https://api.themoviedb.org/3';

/** TMDB API Key - chave de autenticação para a API do TMDB (server-side only) */
export const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

/** Streaming API URL - endpoint do backend de resolução de vídeos */
export const STREAMING_API_URL = process.env.STREAMING_API_URL || '';

/** Streaming API Token - token de autenticação para o backend de streaming (server-side only) */
export const STREAMING_API_TOKEN = process.env.STREAMING_API_TOKEN || '';

// ─── Payment Integration ────────────────────────────────────────────────────

/** Payment Checkout URL - endpoint externo para processar pagamentos */
export const PAYMENT_CHECKOUT_URL = process.env.PAYMENT_CHECKOUT_URL || '';

/** Payment API Token - token de autenticação para checkout requests (server-side only) */
export const PAYMENT_API_TOKEN = process.env.PAYMENT_API_TOKEN || '';

/** Payment Webhook Secret - segredo para validar webhooks de pagamento (server-side only) */
export const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

/** Payment Webhook Relay URL - URL opcional para encaminhar eventos de webhook */
export const PAYMENT_WEBHOOK_RELAY_URL = process.env.PAYMENT_WEBHOOK_RELAY_URL || '';


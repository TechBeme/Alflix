/**
 * Payment Configuration Validator
 * 
 * Valida configuração do sistema de pagamento no startup da aplicação.
 * Garante que configurações inválidas não permitam inicialização em produção.
 * 
 * Regras:
 * 1. Se PAYMENT_CHECKOUT_URL configurado → PAYMENT_WEBHOOK_SECRET obrigatório
 * 2. Se PAYMENT_WEBHOOK_SECRET configurado → PAYMENT_CHECKOUT_URL obrigatório
 * 3. Ambos vazios → Modo desenvolvimento (permite página de exemplo)
 * 4. Ambos configurados → Modo produção (validação completa)
 */

import { PAYMENT_CHECKOUT_URL, PAYMENT_API_TOKEN, APP_URL } from './config';

// URL da página de exemplo (absoluta e relativa)
const EXAMPLE_CHECKOUT_PATHS = [
    '/payment/checkout/example',
    `${APP_URL}/payment/checkout/example`,
];

/**
 * Verifica se URL é a página de exemplo
 */
function isExampleCheckoutUrl(url: string | undefined): boolean {
    if (!url || url.trim() === '') return true;
    
    const trimmedUrl = url.trim();
    
    // Verifica se é uma das URLs de exemplo
    return EXAMPLE_CHECKOUT_PATHS.some(path => 
        trimmedUrl === path || 
        trimmedUrl.startsWith(path + '?')
    );
}

/**
 * Obtém PAYMENT_WEBHOOK_SECRET de forma segura
 */
function getWebhookSecret(): string | undefined {
    return process.env.PAYMENT_WEBHOOK_SECRET?.trim() || undefined;
}

export interface PaymentConfig {
    mode: 'development' | 'production';
    requiresSecretValidation: boolean;
    checkoutUrl: string | undefined;
    hasWebhookSecret: boolean;
}

/**
 * Valida configuração de pagamento e retorna modo operacional
 * 
 * @throws Error se configuração for inválida
 */
export function validatePaymentConfig(): PaymentConfig {
    const checkoutUrl = PAYMENT_CHECKOUT_URL?.trim() || undefined;
    const webhookSecret = getWebhookSecret();
    
    const isExampleUrl = isExampleCheckoutUrl(checkoutUrl);
    const hasCheckoutUrl = !isExampleUrl && !!checkoutUrl;
    const hasWebhookSecret = !!webhookSecret;

    // ═══════════════════════════════════════════════════════════════
    // CENÁRIO 1: Modo Desenvolvimento (ambos vazios)
    // ═══════════════════════════════════════════════════════════════
    if (!hasCheckoutUrl && !hasWebhookSecret) {
        return {
            mode: 'development',
            requiresSecretValidation: false,
            checkoutUrl: undefined,
            hasWebhookSecret: false,
        };
    }

    // ═══════════════════════════════════════════════════════════════
    // CENÁRIO 2: PAYMENT_CHECKOUT_URL configurado, mas sem secret
    // ═══════════════════════════════════════════════════════════════
    if (hasCheckoutUrl && !hasWebhookSecret) {
        const errorMsg = [
            '',
            '╔════════════════════════════════════════════════════════════════╗',
            '║  ❌ PAYMENT CONFIGURATION ERROR                                ║',
            '╠════════════════════════════════════════════════════════════════╣',
            '║                                                                ║',
            '║  PAYMENT_CHECKOUT_URL is configured but                        ║',
            '║  PAYMENT_WEBHOOK_SECRET is missing or empty.                   ║',
            '║                                                                ║',
            '║  When using a real payment gateway, PAYMENT_WEBHOOK_SECRET     ║',
            '║  is REQUIRED to authenticate webhook requests.                 ║',
            '║                                                                ║',
            '║  SOLUTIONS:                                                    ║',
            '║  1. Set PAYMENT_WEBHOOK_SECRET in your .env.local              ║',
            '║     Example: PAYMENT_WEBHOOK_SECRET="your-secret-key"          ║',
            '║                                                                ║',
            '║  2. OR remove PAYMENT_CHECKOUT_URL to use example checkout     ║',
            '║                                                                ║',
            '║  Generate a secure secret with:                                ║',
            '║  openssl rand -hex 32                                          ║',
            '║                                                                ║',
            '╚════════════════════════════════════════════════════════════════╝',
            '',
        ].join('\n');
        
        console.error(errorMsg);
        throw new Error('PAYMENT_WEBHOOK_SECRET is required when PAYMENT_CHECKOUT_URL is configured');
    }

    // ═══════════════════════════════════════════════════════════════
    // CENÁRIO 3: PAYMENT_WEBHOOK_SECRET configurado, mas sem checkout URL
    // ═══════════════════════════════════════════════════════════════
    if (!hasCheckoutUrl && hasWebhookSecret) {
        const errorMsg = [
            '',
            '╔════════════════════════════════════════════════════════════════╗',
            '║  ❌ PAYMENT CONFIGURATION ERROR                                ║',
            '╠════════════════════════════════════════════════════════════════╣',
            '║                                                                ║',
            '║  PAYMENT_WEBHOOK_SECRET is configured but                      ║',
            '║  PAYMENT_CHECKOUT_URL is missing or points to example page.    ║',
            '║                                                                ║',
            '║  The webhook secret is only used with real payment gateways.   ║',
            '║                                                                ║',
            '║  SOLUTIONS:                                                    ║',
            '║  1. Set PAYMENT_CHECKOUT_URL to your payment gateway           ║',
            '║     Example: PAYMENT_CHECKOUT_URL="https://api.example.com"    ║',
            '║                                                                ║',
            '║  2. OR remove PAYMENT_WEBHOOK_SECRET to use development mode   ║',
            '║                                                                ║',
            '╚════════════════════════════════════════════════════════════════╝',
            '',
        ].join('\n');
        
        console.error(errorMsg);
        throw new Error('PAYMENT_CHECKOUT_URL is required when PAYMENT_WEBHOOK_SECRET is configured');
    }

    // ═══════════════════════════════════════════════════════════════
    // CENÁRIO 4: Modo Produção (ambos configurados)
    // ═══════════════════════════════════════════════════════════════
    if (hasCheckoutUrl && hasWebhookSecret) {
        return {
            mode: 'production',
            requiresSecretValidation: true,
            checkoutUrl,
            hasWebhookSecret: true,
        };
    }

    // Este ponto nunca deve ser alcançado
    throw new Error('Invalid payment configuration state');
}

// Lazy-initialized on first access via getPaymentConfig()
let paymentConfig: PaymentConfig | null = null;

/**
 * Obtém configuração validada de pagamento
 */
export function getPaymentConfig(): PaymentConfig {
    if (!paymentConfig) {
        paymentConfig = validatePaymentConfig();
    }
    return paymentConfig;
}

/**
 * Verifica se está em modo desenvolvimento
 */
export function isPaymentDevMode(): boolean {
    return getPaymentConfig().mode === 'development';
}

/**
 * Verifica se validação de webhook secret é necessária
 */
export function requiresWebhookSecretValidation(): boolean {
    return getPaymentConfig().requiresSecretValidation;
}

/**
 * Obtém o webhook secret (apenas para uso interno do servidor)
 */
export function getPaymentWebhookSecret(): string | undefined {
    if (!requiresWebhookSecretValidation()) {
        return undefined;
    }
    return getWebhookSecret();
}

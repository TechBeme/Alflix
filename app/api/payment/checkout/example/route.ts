import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_API_TOKEN, APP_URL } from '@/lib/config';

/**
 * Example Payment Checkout Route
 * 
 * Demonstra como implementar um backend de checkout customizado.
 * Esta rota é usada automaticamente em desenvolvimento quando PAYMENT_CHECKOUT_URL
 * não está configurado.
 * 
 * EM PRODUÇÃO: 
 * Substitua por seu próprio backend com integração real de gateway de pagamento
 * (Stripe, Mercado Pago, PayPal, etc).
 * 
 * @see /docs/PAYMENT_INTEGRATION.md para guia completo de implementação
 */

/**
 * POST /api/payment/checkout/example
 * 
 * Recebe dados do usuário e plano, retorna URL de checkout.
 * 
 * Request Body:
 * ```json
 * {
 *   "user": {
 *     "id": "user_123",
 *     "email": "user@example.com",
 *     "name": "John Doe"
 *   },
 *   "plan": {
 *     "id": "plan_123",
 *     "name": "Premium",
 *     "price": 29.99,
 *     "screens": 4,
 *     "features": ["HD", "4K", "Downloads"]
 *   },
 *   "billingCycle": "monthly",
 *   "successUrl": "https://yoursite.com/settings?section=account&payment=success",
 *   "cancelUrl": "https://yoursite.com/?payment=canceled",
 *   "webhookUrl": "https://yoursite.com/api/webhooks/payment"
 * }
 * ```
 * 
 * Response:
 * ```json
 * {
 *   "checkoutUrl": "https://checkout-page.com/session_123",
 *   "sessionId": "session_123"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
    try {
        // ─────────────────────────────────────────────────────────────
        // 1. VALIDAÇÃO DE AUTENTICAÇÃO (OPCIONAL)
        // ─────────────────────────────────────────────────────────────

        // Se PAYMENT_API_TOKEN configurado, valida
        const expectedToken = PAYMENT_API_TOKEN;
        if (expectedToken) {
            const authHeader = request.headers.get('authorization');
            const token = authHeader?.replace('Bearer ', '');

            if (token !== expectedToken) {
                return NextResponse.json(
                    {
                        error: 'Unauthorized - Invalid API token'
                    },
                    { status: 401 }
                );
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 2. PARSE DO PAYLOAD
        // ─────────────────────────────────────────────────────────────

        const body = await request.json();

        const {
            user,
            plan,
            billingCycle,
            successUrl,
            cancelUrl,
            webhookUrl
        } = body;

        // Validação básica
        if (!user?.id || !user?.email || !plan?.id || !plan?.name || !billingCycle) {
            return NextResponse.json(
                {
                    error: 'Missing required fields: user, plan, billingCycle'
                },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────
        // 3. SIMULA CRIAÇÃO DE CHECKOUT
        // ─────────────────────────────────────────────────────────────

        // Em produção real, aqui você chamaria:
        // - Stripe.checkout.sessions.create()
        // - MercadoPago.preferences.create()
        // - PayPal.orders.create()
        // etc.

        const sessionId = `dev_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('🧪 [DEV] Checkout request received:', {
            userId: user.id,
            userEmail: user.email,
            planId: plan.id,
            planName: plan.name,
            price: plan.price,
            billingCycle,
            sessionId,
        });

        // ─────────────────────────────────────────────────────────────
        // 4. RETORNA URL DE CHECKOUT
        // ─────────────────────────────────────────────────────────────

        // Em desenvolvimento, retorna uma página de exemplo
        const checkoutUrl = `${APP_URL}/api/payment/checkout/example/page?` + new URLSearchParams({
            session: sessionId,
            userId: user.id,
            userEmail: user.email,
            userName: user.name || 'User',
            planId: plan.id,
            planName: plan.name,
            price: plan.price.toString(),
            billingCycle,
            successUrl: successUrl || `${APP_URL}/settings?section=account`,
            cancelUrl: cancelUrl || `${APP_URL}/`,
            webhookUrl: webhookUrl || `${APP_URL}/api/webhooks/payment`,
        }).toString();

        return NextResponse.json({
            checkoutUrl,
            sessionId,
            metadata: {
                devMode: true,
                message: '⚠️ Using example checkout - Configure PAYMENT_CHECKOUT_URL for production',
            }
        });

    } catch (error) {
        console.error('❌ Example checkout error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/payment/checkout/example
 * 
 * Retorna informações sobre a implementação deste endpoint de exemplo.
 */
export async function GET() {
    return NextResponse.json({
        name: 'Example Payment Checkout API',
        description: 'Development-only checkout endpoint demonstrating external payment integration',

        usage: {
            method: 'POST',
            endpoint: '/api/payment/checkout/example',
            contentType: 'application/json',
            authentication: 'Bearer token via PAYMENT_API_TOKEN (optional)',
        },

        requestExample: {
            user: {
                id: 'user_123',
                email: 'user@example.com',
                name: 'John Doe'
            },
            plan: {
                id: 'plan_123',
                name: 'Premium',
                price: 29.99,
                screens: 4,
                features: ['HD', '4K', 'Downloads']
            },
            billingCycle: 'monthly',
            successUrl: 'https://yoursite.com/settings?section=account&payment=success',
            cancelUrl: 'https://yoursite.com/?payment=canceled',
            webhookUrl: 'https://yoursite.com/api/webhooks/payment',
        },

        responseExample: {
            checkoutUrl: 'https://checkout-page.com/session_123',
            sessionId: 'session_123',
            metadata: {
                devMode: true
            }
        },

        production: {
            warning: '⚠️ This is a development-only endpoint',
            action: 'Set PAYMENT_CHECKOUT_URL in production to use your own payment backend',
            documentation: '/docs/PAYMENT_INTEGRATION.md',
        },

        supportedGateways: [
            'Stripe',
            'Mercado Pago',
            'PayPal',
            'PagSeguro',
            'Asaas',
            'Custom implementations',
        ],
    });
}

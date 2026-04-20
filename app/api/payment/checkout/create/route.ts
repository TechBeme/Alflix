import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * Payment Checkout API
 * 
 * Cria sessão de checkout para processar pagamento de plano.
 * 
 * ⚠️ SECURITY: successUrl e cancelUrl SÃO DEFINIDAS NO BACKEND
 * Cliente NUNCA pode escolher URLs de redirecionamento.
 * 
 * Flow:
 * 1. Valida autenticação via cookies Better Auth
 * 2. Verifica se plano existe e está ativo
 * 3. Chama gateway externo (PAYMENT_CHECKOUT_URL)
 * 4. Retorna checkoutUrl para redirecionar usuário
 */

const checkoutSchema = z.object({
    planId: z.string().min(1, 'api.payment.planIdRequired'),
});

export async function POST(request: NextRequest) {
    try {
        // ─────────────────────────────────────────────────────────────
        // 1. VALIDAÇÃO DE AUTENTICAÇÃO
        // ─────────────────────────────────────────────────────────────

        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'api.payment.authRequired' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`checkout:create:${session.user.id}`, {
            limit: 10,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitRetry' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // ─────────────────────────────────────────────────────────────
        // 2. VALIDAÇÃO DE PAYLOAD
        // ─────────────────────────────────────────────────────────────

        const body = await request.json();
        const validation = checkoutSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'api.payment.invalidData' },
                { status: 400 }
            );
        }

        const { planId } = validation.data;

        // ─────────────────────────────────────────────────────────────
        // 3. BUSCA DADOS DO USUÁRIO E PLANO
        // ─────────────────────────────────────────────────────────────

        const { prisma } = await import('@/lib/prisma');

        const [user, plan] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    planId: true,
                    familyMember: true,
                }
            }),
            prisma.plan.findUnique({
                where: {
                    id: planId,
                    active: true,
                },
                select: {
                    id: true,
                }
            })
        ]);

        if (!user) {
            return NextResponse.json(
                { error: 'api.payment.userNotFound' },
                { status: 404 }
            );
        }

        // Membros de família NÃO podem criar planos próprios
        if (user.familyMember && user.familyMember.length > 0) {
            return NextResponse.json(
                { error: 'api.family.familyMemberCheckout' },
                { status: 403 }
            );
        }

        if (!plan) {
            return NextResponse.json(
                { error: 'api.payment.planNotFound' },
                { status: 404 }
            );
        }

        // ─────────────────────────────────────────────────────────────
        // 4. VALIDAÇÕES DE NEGÓCIO
        // ─────────────────────────────────────────────────────────────

        if (user.planId === planId) {
            return NextResponse.json(
                { error: 'api.payment.alreadySubscribed' },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────
        // 5. CHAMA GATEWAY EXTERNO (ou usa exemplo)
        // ─────────────────────────────────────────────────────────────

        const { PAYMENT_CHECKOUT_URL, PAYMENT_API_TOKEN, APP_URL } = await import('@/lib/config');
        const baseUrl = APP_URL || 'http://localhost:3000';

        // Se PAYMENT_CHECKOUT_URL não configurado, usa página de exemplo
        if (!PAYMENT_CHECKOUT_URL || PAYMENT_CHECKOUT_URL.trim() === '') {
            if (process.env.NODE_ENV === 'production') {
                console.warn('⚠️  [Payment] PAYMENT_CHECKOUT_URL não configurada em produção - usando página de exemplo');
                console.warn('Configure PAYMENT_CHECKOUT_URL para habilitar pagamentos reais.');
            } else {
                console.info('ℹ️  [Payment] PAYMENT_CHECKOUT_URL não configurada - usando página de exemplo');
            }

            const exampleUrl = new URL('/payment/checkout/example', baseUrl);
            exampleUrl.searchParams.set('plan', plan.id);
            exampleUrl.searchParams.set('userId', user.id);
            exampleUrl.searchParams.set('success', `${baseUrl}/settings?section=plan&payment=success`);
            exampleUrl.searchParams.set('cancel', `${baseUrl}/settings?section=plan&payment=canceled`);

            return NextResponse.json({
                checkoutUrl: exampleUrl.toString(),
            });
        }

        const payload = {
            planId: plan.id,
            successUrl: `${baseUrl}/settings?section=plan&payment=success`,
            cancelUrl: `${baseUrl}/settings?section=plan&payment=canceled`,
            webhookUrl: `${baseUrl}/api/webhooks/payment`,
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (PAYMENT_API_TOKEN) {
            headers['Authorization'] = `Bearer ${PAYMENT_API_TOKEN}`;
        }

        const response = await fetch(PAYMENT_CHECKOUT_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ Payment gateway error:', response.status, errorText);
            return NextResponse.json(
                { error: 'api.payment.checkoutFailed' },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (!data.checkoutUrl) {
            console.error('❌ Invalid gateway response:', data);
            return NextResponse.json(
                { error: 'api.payment.invalidGatewayResponse' },
                { status: 500 }
            );
        }

        console.log('✅ Checkout created:', { planId: plan.id });

        return NextResponse.json({
            checkoutUrl: data.checkoutUrl,
        });

    } catch (error) {
        console.error('❌ Checkout API error:', error);
        return NextResponse.json(
            { error: 'api.errors.internalError' },
            { status: 500 }
        );
    }
}

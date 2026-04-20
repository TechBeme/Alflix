import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PAYMENT_WEBHOOK_RELAY_URL, PAYMENT_API_TOKEN } from '@/lib/config';
import {
    requiresWebhookSecretValidation,
    getPaymentWebhookSecret,
    isPaymentDevMode
} from '@/lib/payment-config-validator';

/**
 * Payment Webhook API
 * 
 * Recebe notificações de eventos de pagamento do gateway externo.
 * 
 * Segurança:
 * - Modo Produção: Valida X-Webhook-Secret header (obrigatório)
 * - Modo Desenvolvimento: Aceita requisições sem autenticação (apenas para testes)
 * - Validação Zod: Garante payload válido e type-safe
 * 
 * Formato esperado:
 * {
 *   "type": "payment.succeeded",
 *   "userId": "user_id",
 *   "planId": "plan_id",
 *   "transactionId": "txn_123"
 * }
 * 
 * Flow:
 * 1. Valida autenticação (se modo produção)
 * 2. Valida payload com Zod
 * 3. Verifica idempotência
 * 4. Atualiza plano do usuário no banco
 * 5. Retorna 200 OK
 */

// Schema de validação para webhook payload
const webhookPayloadSchema = z.object({
    type: z.enum(['payment.succeeded', 'payment.failed', 'payment.refunded'], {
        message: 'api.payment.invalidEventType'
    }),
    userId: z.string().min(1, 'api.payment.userIdRequired'),
    planId: z.string().min(1, 'api.payment.planIdRequired'),
    transactionId: z.string().min(1, 'api.payment.transactionIdRequired'),
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// Cache de eventos processados (idempotência)
const processedEvents = new Map<string, number>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

// Limpa cache periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of processedEvents.entries()) {
        if (now - timestamp > CACHE_TTL) {
            processedEvents.delete(key);
        }
    }
}, 15 * 60 * 1000);

export async function POST(request: NextRequest) {
    try {
        // ─────────────────────────────────────────────────────────────
        // 1. VALIDAÇÃO DE AUTENTICAÇÃO
        // ─────────────────────────────────────────────────────────────

        if (requiresWebhookSecretValidation()) {
            const providedSecret = request.headers.get('x-webhook-secret');
            const expectedSecret = getPaymentWebhookSecret();

            if (!providedSecret) {
                console.error('❌ Webhook rejected: Missing X-Webhook-Secret header');
                return NextResponse.json(
                    { error: 'Unauthorized: Missing authentication header' },
                    { status: 401 }
                );
            }

            if (providedSecret !== expectedSecret) {
                console.error('❌ Webhook rejected: Invalid webhook secret');
                return NextResponse.json(
                    { error: 'Unauthorized: Invalid authentication credentials' },
                    { status: 401 }
                );
            }

            console.log('🔒 Webhook authenticated successfully');
        } else {
            console.log('⚠️  Webhook running in DEVELOPMENT MODE (no authentication)');
        }

        // ─────────────────────────────────────────────────────────────
        // 2. PARSE E VALIDA PAYLOAD COM ZOD
        // ─────────────────────────────────────────────────────────────

        const body = await request.json();

        const validationResult = webhookPayloadSchema.safeParse(body);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            console.error('❌ Webhook payload inválido:', {
                campo: firstError.path.join('.'),
                erro: firstError.message
            });
            return NextResponse.json(
                {
                    error: 'api.errors.invalidPayload',
                    message: firstError.message,
                    field: firstError.path.join('.')
                },
                { status: 400 }
            );
        }

        const payload = validationResult.data;

        console.log('📥 Webhook recebido:', {
            type: payload.type,
            userId: payload.userId,
            planId: payload.planId,
            mode: isPaymentDevMode() ? 'development' : 'production',
        });

        // ─────────────────────────────────────────────────────────────
        // 3. IDEMPOTÊNCIA
        // ─────────────────────────────────────────────────────────────

        const eventKey = `${payload.transactionId}_${payload.type}`;

        if (processedEvents.has(eventKey)) {
            console.log('⚠️  Webhook duplicado ignorado:', eventKey);
            return NextResponse.json({ message: 'api.payment.eventAlreadyProcessed' });
        }

        processedEvents.set(eventKey, Date.now());

        // ─────────────────────────────────────────────────────────────
        // 4. ATUALIZA BANCO DE DADOS
        // ─────────────────────────────────────────────────────────────

        await updateUserSubscription(payload);

        // ─────────────────────────────────────────────────────────────
        // 5. RELAY OPCIONAL
        // ─────────────────────────────────────────────────────────────

        if (PAYMENT_WEBHOOK_RELAY_URL) {
            relayWebhookEvent(payload).catch(error => {
                console.error('❌ Webhook relay failed:', error);
            });
        }

        console.log('✅ Webhook processado:', {
            type: payload.type,
            userId: payload.userId,
            planId: payload.planId,
        });

        return NextResponse.json({ message: 'api.payment.webhookSuccess' });

    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        return NextResponse.json(
            { error: 'api.errors.internalError' },
            { status: 500 }
        );
    }
}

async function updateUserSubscription(event: any) {
    const { prisma } = await import('@/lib/prisma');

    const [user, plan] = await Promise.all([
        prisma.user.findUnique({
            where: { id: event.userId },
            select: { id: true, planId: true }
        }),
        prisma.plan.findUnique({
            where: { id: event.planId },
            select: { id: true, screens: true }
        }),
    ]);

    if (!user) {
        throw new Error(`User not found: ${event.userId}`);
    }

    if (!plan) {
        throw new Error(`Plan not found: ${event.planId}`);
    }

    if (event.type === 'payment.succeeded') {
        // Atualizar em transação para lidar com mudanças de plano
        await prisma.$transaction(async (tx) => {
            // Atualizar usuário
            await tx.user.update({
                where: { id: event.userId },
                data: {
                    planId: event.planId,
                    maxScreens: plan.screens,
                    trialEndsAt: null,
                }
            });

            // Buscar família do owner
            const family = await tx.family.findUnique({
                where: { ownerId: event.userId },
                include: {
                    members: { orderBy: { joinedAt: 'desc' } }, // Mais recentes primeiro
                    invites: { where: { status: 'pending' } }
                },
            });

            if (family) {
                const newMaxMembers = plan.screens;
                const currentMembersCount = family.members.length + 1; // +1 para owner

                // Se downgrade, remover membros excedentes
                if (currentMembersCount > newMaxMembers) {
                    const toRemove = currentMembersCount - newMaxMembers;
                    const membersToDelete = family.members
                        .slice(0, toRemove) // Mais recentes são removidos primeiro
                        .map(m => m.id);

                    await tx.familyMember.deleteMany({
                        where: { id: { in: membersToDelete } },
                    });

                    console.log(`[Webhook] Downgrade: Removed ${toRemove} member(s) from family`);
                }

                // Calcular slots disponíveis após remoção
                const remainingMembers = Math.max(0, family.members.length - (currentMembersCount > newMaxMembers ? currentMembersCount - newMaxMembers : 0));
                const slotsDisponiveis = newMaxMembers - 1 - remainingMembers; // -1 para owner

                // Revogar convites pendentes se não há slots
                if (slotsDisponiveis <= 0 && family.invites.length > 0) {
                    await tx.familyInvite.updateMany({
                        where: { familyId: family.id, status: 'pending' },
                        data: { status: 'revoked' },
                    });
                    console.log(`[Webhook] Revoked ${family.invites.length} pending invite(s) due to no available slots`);
                }

                // Atualizar maxMembers da família
                await tx.family.update({
                    where: { id: family.id },
                    data: { maxMembers: newMaxMembers },
                });

                console.log(`[Webhook] Family updated: maxMembers ${family.maxMembers} → ${newMaxMembers}`);
            }
        });

        console.log('✅ Subscription updated:', {
            userId: user.id,
            oldPlanId: user.planId,
            newPlanId: event.planId,
            screens: plan.screens,
        });
    }
}

async function relayWebhookEvent(event: any) {
    if (!PAYMENT_WEBHOOK_RELAY_URL) return;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (PAYMENT_API_TOKEN) {
        headers['Authorization'] = `Bearer ${PAYMENT_API_TOKEN}`;
    }

    const response = await fetch(PAYMENT_WEBHOOK_RELAY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
    });

    if (response.ok) {
        console.log('✅ Webhook relayed');
    }
}

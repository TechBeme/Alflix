import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * API para cancelar assinatura do usuário autenticado.
 *
 * Política atual:
 * - Cancelamento imediato
 * - Remove plano ativo e trial associado
 * - Reverte maxScreens para 1
 */
export async function POST() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`subscription:cancel:${session.user.id}`, {
            limit: 5,
            interval: 3600,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitRetry' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                planId: true,
                familyMember: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'api.subscription.userNotFound' },
                { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Membros de família NÃO podem cancelar plano (usam plano do owner)
        if (user.familyMember && user.familyMember.length > 0) {
            return NextResponse.json(
                { error: 'api.family.familyMemberCancelError' },
                { status: 403, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        if (!user.planId) {
            return NextResponse.json(
                { error: 'api.subscription.noActiveSubscription' },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Cancelamento em transação atômica
        // Remove membros da família e revoga convites pendentes
        await prisma.$transaction(async (tx) => {
            // Buscar família do owner
            const family = await tx.family.findUnique({
                where: { ownerId: session.user.id },
                include: {
                    members: true,
                    invites: { where: { status: 'pending' } }
                },
            });

            if (family) {
                // Remover todos os membros
                if (family.members.length > 0) {
                    await tx.familyMember.deleteMany({
                        where: { familyId: family.id },
                    });
                    console.log(`[Cancel] Removed ${family.members.length} member(s) from family`);
                }

                // Revogar convites pendentes
                if (family.invites.length > 0) {
                    await tx.familyInvite.updateMany({
                        where: { familyId: family.id, status: 'pending' },
                        data: { status: 'revoked' },
                    });
                    console.log(`[Cancel] Revoked ${family.invites.length} pending invite(s)`);
                }

                // Deletar família
                await tx.family.delete({
                    where: { id: family.id },
                });
                console.log('[Cancel] Family deleted');
            }

            // Cancelar plano do usuário
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    planId: null,
                    maxScreens: 1,
                    trialEndsAt: null,
                },
            });
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return NextResponse.json(
            { error: 'api.subscription.cancelError' },
            { status: 500 }
        );
    }
}

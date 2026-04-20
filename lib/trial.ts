/**
 * Trial Management Utilities
 * 
 * Gerencia o período de teste grátis de 7 dias do plano Duo.
 * 
 * Regras:
 * - Cada novo usuário recebe 7 dias grátis do plano Duo automaticamente
 * - Um email só pode usar o trial uma vez (campo trialUsed)
 * - Quando o trial expira, o acesso ao conteúdo é bloqueado
 * - O plano continua associado ao usuário, mas trialEndsAt controla o acesso
 */

import { prisma } from './prisma';

export const TRIAL_DURATION_DAYS = 7;

/**
 * Verifica se o trial do usuário ainda está ativo
 */
export function isTrialActive(trialEndsAt: Date | null): boolean {
    if (!trialEndsAt) return false;
    return new Date() < new Date(trialEndsAt);
}

/**
 * Calcula quantos dias restam do trial
 * Retorna 0 se expirado ou sem trial
 */
export function getTrialDaysRemaining(trialEndsAt: Date | null): number {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const end = new Date(trialEndsAt);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se o usuário tem acesso ativo ao conteúdo.
 * Considera tanto plano pago quanto trial ativo.
 * 
 * @param user - Objeto com planId, plan, trialEndsAt
 * @returns true se tem acesso (plano ativo + não expirado ou trial ativo)
 */
export function hasActiveAccess(user: {
    planId: string | null;
    plan?: { active: boolean } | null;
    trialEndsAt?: Date | null;
}): boolean {
    // Sem plano = sem acesso
    if (!user.planId || !user.plan?.active) return false;

    // Se tem trialEndsAt, está em trial — verificar expiração
    if (user.trialEndsAt) {
        return isTrialActive(user.trialEndsAt);
    }

    // Plano pago sem trial = acesso ativo
    return true;
}

/**
 * Atribui o trial do plano Duo a um novo usuário.
 * Chamado automaticamente no signup via databaseHooks.
 * 
 * @returns Os dados para atualizar o usuário, ou null se trial já foi usado
 */
export async function assignDuoTrial(userId: string): Promise<boolean> {
    try {
        // Buscar o plano Duo
        const duoPlan = await prisma.plan.findFirst({
            where: { name: 'Duo', active: true },
        });

        if (!duoPlan) {
            console.error('[Trial] Plano Duo não encontrado no banco');
            return false;
        }

        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

        await prisma.user.update({
            where: { id: userId },
            data: {
                planId: duoPlan.id,
                maxScreens: duoPlan.screens,
                trialEndsAt,
                trialUsed: true,
            },
        });

        console.log(`[Trial] Trial Duo atribuído ao usuário ${userId}, expira em ${trialEndsAt.toISOString()}`);
        return true;
    } catch (error) {
        console.error('[Trial] Erro ao atribuir trial:', error);
        return false;
    }
}

/**
 * Expira trials vencidos — remove o plano de usuários cujo trial expirou.
 * Também limpa a família associada (remove membros e revoga convites).
 * Pode ser chamado por cron job ou verificado on-demand.
 */
export async function expireTrials(): Promise<number> {
    const now = new Date();

    // Buscar usuários com trial expirado
    const usersWithExpiredTrial = await prisma.user.findMany({
        where: {
            trialEndsAt: { lte: now },
            planId: { not: null },
        },
        select: { id: true },
    });

    if (usersWithExpiredTrial.length === 0) {
        return 0;
    }

    let expiredCount = 0;

    // Processar cada usuário em transação separada
    for (const user of usersWithExpiredTrial) {
        try {
            await prisma.$transaction(async (tx) => {
                // 1. Buscar família onde usuário é owner
                const family = await tx.family.findFirst({
                    where: { ownerId: user.id },
                    include: {
                        members: true,
                        invites: true,
                    },
                });

                if (family) {
                    // 2. Remover todos os membros
                    if (family.members.length > 0) {
                        await tx.familyMember.deleteMany({
                            where: { familyId: family.id },
                        });
                    }

                    // 3. Revogar todos os convites pendentes
                    if (family.invites.length > 0) {
                        await tx.familyInvite.deleteMany({
                            where: { familyId: family.id },
                        });
                    }

                    // 4. Deletar a família
                    await tx.family.delete({
                        where: { id: family.id },
                    });
                }

                // 5. Remover o plano do usuário
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        planId: null,
                        maxScreens: 1,
                        trialEndsAt: null,
                    },
                });
            });

            expiredCount++;
        } catch (error) {
            console.error(`[Trial] Erro ao expirar trial do usuário ${user.id}:`, error);
            // Continua processando os outros usuários
        }
    }

    if (expiredCount > 0) {
        console.log(`[Trial] ${expiredCount} trial(s) expirado(s) e família(s) removida(s)`);
    }

    return expiredCount;
}

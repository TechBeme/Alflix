import { prisma } from '@/lib/prisma';

/**
 * Access Control Utilities
 * 
 * Gerencia controle de acesso para streaming e recursos premium.
 * Valida tanto owners com planos próprios quanto membros de família.
 */

/**
 * Verifica se o usuário tem acesso ao streaming.
 * 
 * Valida:
 * 1. Plano próprio do usuário (owner)
 *    - Plano ativo + não expirado
 *    - Trial ativo (se trialEndsAt existir)
 * 
 * 2. Membro de família
 *    - Owner da família tem plano ativo
 *    - Trial do owner ainda ativo (se existir)
 * 
 * @param userId - ID do usuário a verificar
 * @returns true se tem acesso ao streaming
 */
export async function hasStreamingAccess(userId: string): Promise<boolean> {
    // Buscar usuário com plano
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
    });

    // Verifica se tem plano próprio (owner)
    if (user?.planId && user.plan?.active) {
        // Se tem trial, valida expiração
        if (user.trialEndsAt) {
            return new Date() < new Date(user.trialEndsAt);
        }
        // Plano pago ativo
        return true;
    }

    // Verifica se é membro de família
    const membership = await prisma.familyMember.findFirst({
        where: { userId },
        include: {
            family: {
                include: {
                    owner: {
                        include: { plan: true },
                    },
                },
            },
        },
    });

    if (!membership) return false;

    const owner = membership.family.owner;

    // Owner deve ter plano ativo
    if (!owner.planId || !owner.plan?.active) return false;

    // Se owner tem trial, valida expiração
    if (owner.trialEndsAt) {
        return new Date() < new Date(owner.trialEndsAt);
    }

    // Owner tem plano pago ativo
    return true;
}

/**
 * Obtém informações sobre o plano do usuário (próprio ou da família).
 * 
 * @param userId - ID do usuário
 * @returns Informações do plano ou null
 */
export async function getUserPlanInfo(userId: string): Promise<{
    planId: string;
    planName: string;
    maxScreens: number;
    isOwner: boolean;
    isTrial: boolean;
    trialEndsAt: Date | null;
} | null> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
    });

    // Se tem plano próprio
    if (user?.planId && user.plan) {
        return {
            planId: user.planId,
            planName: user.plan.name,
            maxScreens: user.plan.screens,
            isOwner: true,
            isTrial: !!user.trialEndsAt,
            trialEndsAt: user.trialEndsAt,
        };
    }

    // Verifica se é membro de família
    const membership = await prisma.familyMember.findFirst({
        where: { userId },
        include: {
            family: {
                include: {
                    owner: {
                        include: { plan: true },
                    },
                },
            },
        },
    });

    if (membership?.family.owner.plan) {
        return {
            planId: membership.family.owner.planId!,
            planName: membership.family.owner.plan.name,
            maxScreens: membership.family.owner.plan.screens,
            isOwner: false,
            isTrial: !!membership.family.owner.trialEndsAt,
            trialEndsAt: membership.family.owner.trialEndsAt,
        };
    }

    return null;
}

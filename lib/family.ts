import { prisma } from '@/lib/prisma';

/**
 * Expira convites de família que passaram da data de expiração.
 * Esta função deve ser chamada periodicamente por um cron job.
 * 
 * @returns Número de convites expirados
 */
export async function expireFamilyInvites(): Promise<number> {
    try {
        const result = await prisma.familyInvite.updateMany({
            where: {
                status: 'pending',
                expiresAt: {
                    lte: new Date(), // menor ou igual à data atual
                },
            },
            data: {
                status: 'expired',
            },
        });

        if (result.count > 0) {
            console.log(`[Family] ${result.count} convite(s) expirado(s) automaticamente`);
        }

        return result.count;
    } catch (error) {
        console.error('[Family] Erro ao expirar convites:', error);
        throw error;
    }
}

/**
 * Calcula quantos slots de membros estão disponíveis em uma família.
 * 
 * @param maxMembers - Número máximo de membros (inclui o owner)
 * @param currentMembersCount - Número atual de membros (não inclui o owner)
 * @returns Número de slots disponíveis
 */
export function calculateAvailableSlots(maxMembers: number, currentMembersCount: number): number {
    // maxMembers inclui o owner, então subtraímos 1 para obter slots adicionais
    // e depois subtraímos os membros atuais
    return maxMembers - 1 - currentMembersCount;
}

/**
 * Valida se uma família tem slots disponíveis para novos membros.
 * Considera membros atuais + convites pendentes.
 * 
 * @param maxMembers - Número máximo de membros (inclui o owner)
 * @param currentMembersCount - Número atual de membros (não inclui o owner)
 * @param pendingInvitesCount - Número de convites pendentes
 * @returns true se há slots disponíveis
 */
export function hasAvailableSlots(
    maxMembers: number,
    currentMembersCount: number,
    pendingInvitesCount: number = 0
): boolean {
    const availableSlots = calculateAvailableSlots(maxMembers, currentMembersCount);
    return availableSlots > pendingInvitesCount;
}

/**
 * Obtém a contagem total de membros incluindo o owner.
 * 
 * @param currentMembersCount - Número atual de membros (não inclui o owner)
 * @returns Contagem total incluindo owner
 */
export function getTotalMembersCount(currentMembersCount: number): number {
    return currentMembersCount + 1; // +1 para o owner
}

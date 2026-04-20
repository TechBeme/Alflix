import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateBody } from '@/lib/api/validation';
import { createFamilyInviteSchema, revokeFamilyInviteSchema } from '@/lib/validation/api-schemas';

/**
 * API para gerenciar convites de família
 * - POST: Gerar link de convite
 * - DELETE: Revogar convite pendente
 */

// POST - Criar convite
export async function POST(request: NextRequest) {
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

        const rateLimitResult = rateLimit(`family:invite:${session.user.id}`, {
            limit: 10,
            interval: 3600,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validação enterprise-grade com Zod
        const validation = await validateBody(request, createFamilyInviteSchema);

        if ('error' in validation) {
            return validation.error;
        }

        const { email } = validation.data;

        // Buscar família do owner
        let family = await prisma.family.findUnique({
            where: { ownerId: session.user.id },
            include: {
                members: true,
                invites: {
                    where: { status: 'pending', expiresAt: { gt: new Date() } },
                },
            },
        });

        // Se não tem família, criar automaticamente
        if (!family) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
            });

            if (!user || (user.maxScreens ?? 1) < 2) {
                return NextResponse.json(
                    { error: 'api.family.planNoFamilyShort' },
                    { status: 403 }
                );
            }

            family = await prisma.family.create({
                data: {
                    ownerId: session.user.id,
                    name: `Família de ${user.name || 'Usuário'}`,
                    maxMembers: user.maxScreens ?? 1,
                },
                include: {
                    members: true,
                    invites: {
                        where: { status: 'pending', expiresAt: { gt: new Date() } },
                    },
                },
            });
        }

        // Calcular slots disponíveis (maxMembers inclui o owner)
        // Ex: Plano Duo (maxMembers=2) = owner + 1 slot adicional
        // Ex: Plano Família (maxMembers=4) = owner + 3 slots adicionais
        const slotsDisponiveis = family.maxMembers - 1 - (family.members?.length ?? 0); // -1 para o owner
        const convitesPendentes = family.invites?.length ?? 0;

        if (slotsDisponiveis <= 0) {
            return NextResponse.json(
                { error: `Limite de ${family.maxMembers} membros atingido. Remova um membro para convidar novamente.` },
                { status: 400 }
            );
        }

        if (convitesPendentes >= slotsDisponiveis) {
            return NextResponse.json(
                { error: 'api.family.pendingInvitesLimit' },
                { status: 400 }
            );
        }

        // Limitar total de convites pendentes a 5 por segurança
        if (convitesPendentes >= 5) {
            return NextResponse.json(
                { error: 'api.family.maxPendingInvites' },
                { status: 400 }
            );
        }

        // Criar convite (expira em 7 dias)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.familyInvite.create({
            data: {
                familyId: family.id,
                email: email || null,
                expiresAt,
            },
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json(
            { error: 'api.family.inviteCreateError' },
            { status: 500 }
        );
    }
}

// DELETE - Revogar convite
export async function DELETE(request: NextRequest) {
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

        const rateLimitResult = rateLimit(`family:revoke:${session.user.id}`, {
            limit: 10,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validação enterprise-grade com Zod
        const validation = await validateBody(request, revokeFamilyInviteSchema);

        if ('error' in validation) {
            return validation.error;
        }

        const { inviteId } = validation.data;

        // Verificar que o convite pertence à família do owner
        const invite = await prisma.familyInvite.findUnique({
            where: { id: inviteId },
            include: { family: true },
        });

        if (!invite || invite.family.ownerId !== session.user.id) {
            return NextResponse.json(
                { error: 'api.family.inviteNotFound' },
                { status: 404 }
            );
        }

        await prisma.familyInvite.update({
            where: { id: inviteId },
            data: { status: 'revoked' },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error revoking invite:', error);
        return NextResponse.json(
            { error: 'api.family.inviteRevokeError' },
            { status: 500 }
        );
    }
}

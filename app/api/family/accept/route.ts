import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateBody } from '@/lib/api/validation';
import { acceptFamilyInviteSchema } from '@/lib/validation/api-schemas';

/**
 * API para aceitar convite de família
 * - POST: Aceitar convite via token
 */
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

        const rateLimitResult = rateLimit(`family:accept:${session.user.id}`, {
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
        const validation = await validateBody(request, acceptFamilyInviteSchema);

        if ('error' in validation) {
            return validation.error;
        }

        const { token } = validation.data;

        // Buscar convite
        const invite = await prisma.familyInvite.findUnique({
            where: { token },
            include: {
                family: {
                    include: {
                        members: true,
                        owner: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!invite) {
            return NextResponse.json(
                { error: 'api.family.inviteNotFound' },
                { status: 404 }
            );
        }

        if (invite.status !== 'pending') {
            return NextResponse.json(
                { error: 'api.family.inviteUsed' },
                { status: 400 }
            );
        }

        if (new Date() > invite.expiresAt) {
            // Marcar como expirado
            await prisma.familyInvite.update({
                where: { id: invite.id },
                data: { status: 'expired' },
            });
            return NextResponse.json(
                { error: 'api.family.inviteExpired' },
                { status: 400 }
            );
        }

        // Validar email se o convite especificou um email
        if (invite.email) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { email: true },
            });

            if (user?.email?.toLowerCase() !== invite.email.toLowerCase()) {
                return NextResponse.json(
                    { error: 'api.family.inviteWrongEmail' },
                    { status: 403 }
                );
            }
        }

        // Aceitar convite em transação com revalidação de slots e lock
        // Isso previne race condition se múltiplos usuários aceitarem ao mesmo tempo
        await prisma.$transaction(async (tx) => {
            // Lock pessimista: buscar família com FOR UPDATE
            // Previne que 2 transações leiam o mesmo estado simultaneamente
            const familyAtualizada = await tx.$queryRaw<Array<{ id: string; maxMembers: number; ownerId: string }>>` 
                SELECT id, "maxMembers", "ownerId" 
                FROM "Family" 
                WHERE id = ${invite.familyId} 
                FOR UPDATE
            `;

            if (!familyAtualizada || familyAtualizada.length === 0) {
                throw new Error('api.family.fetchError');
            }

            const family = familyAtualizada[0];

            // Verificar se o usuário é o próprio owner (dentro da transação)
            if (family.ownerId === session.user.id) {
                throw new Error('OWNER_CANNOT_ACCEPT');
            }

            // Verificar se já é membro desta família
            const existingMember = await tx.familyMember.findFirst({
                where: {
                    userId: session.user.id,
                    familyId: invite.familyId,
                },
            });

            if (existingMember) {
                throw new Error('ALREADY_MEMBER');
            }

            // Verificar se é membro de outra família ou owner de outra
            const [otherMembership, otherFamily] = await Promise.all([
                tx.familyMember.findFirst({
                    where: { userId: session.user.id },
                }),
                tx.family.findUnique({
                    where: { ownerId: session.user.id },
                }),
            ]);

            if (otherMembership) {
                throw new Error('MEMBER_OF_OTHER');
            }

            if (otherFamily) {
                throw new Error('OWNER_OF_OTHER');
            }

            // Verificar se usuário tem plano ativo
            // Membros de família devem cancelar plano próprio antes de entrar
            const userWithPlan = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { planId: true, trialEndsAt: true },
            });

            const hasActivePlan = userWithPlan?.planId !== null;
            const hasActiveTrial = userWithPlan?.trialEndsAt && new Date(userWithPlan.trialEndsAt) > new Date();

            if (hasActivePlan || hasActiveTrial) {
                throw new Error('HAS_ACTIVE_PLAN');
            }

            // Contar membros atuais
            const membersCount = await tx.familyMember.count({
                where: { familyId: invite.familyId },
            });

            const maxMembers = family.maxMembers;

            // Verificar se ainda tem vaga (maxMembers inclui o owner)
            const totalMembros = membersCount + 1; // +1 para o owner
            if (totalMembros >= maxMembers) {
                throw new Error('Esta família já atingiu o limite de membros');
            }

            // Criar membro e atualizar convite
            await tx.familyMember.create({
                data: {
                    familyId: invite.familyId,
                    userId: session.user.id,
                },
            });

            await tx.familyInvite.update({
                where: { id: invite.id },
                data: {
                    status: 'accepted',
                    usedBy: session.user.id,
                    usedAt: new Date(),
                },
            });

            // Garantir que o membro não tenha planId próprio
            // (medida de segurança redundante - validação HAS_ACTIVE_PLAN já impede)
            await tx.user.update({
                where: { id: session.user.id },
                data: {
                    planId: null,
                    maxScreens: 1,
                    trialEndsAt: null,
                },
            });
        }).catch((error) => {
            // Se a transação falhar, retornar erro apropriado
            if (error.message === 'Esta família já atingiu o limite de membros') {
                throw new Error('FAMILY_FULL');
            }
            if (error.message === 'OWNER_CANNOT_ACCEPT') {
                throw new Error('OWNER_CANNOT_ACCEPT');
            }
            if (error.message === 'ALREADY_MEMBER') {
                throw new Error('ALREADY_MEMBER');
            }
            if (error.message === 'MEMBER_OF_OTHER') {
                throw new Error('MEMBER_OF_OTHER');
            }
            if (error.message === 'OWNER_OF_OTHER') {
                throw new Error('OWNER_OF_OTHER');
            }
            if (error.message === 'HAS_ACTIVE_PLAN') {
                throw new Error('HAS_ACTIVE_PLAN');
            }
            throw error;
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error accepting invite:', error);

        // Tratar erros específicos
        if (error instanceof Error) {
            switch (error.message) {
                case 'FAMILY_FULL':
                    return NextResponse.json(
                        { error: 'api.family.familyFull' },
                        { status: 400 }
                    );
                case 'OWNER_CANNOT_ACCEPT':
                    return NextResponse.json(
                        { error: 'api.family.cannotAcceptOwn' },
                        { status: 400 }
                    );
                case 'ALREADY_MEMBER':
                    return NextResponse.json(
                        { error: 'api.family.alreadyFamilyMember' },
                        { status: 409 }
                    );
                case 'MEMBER_OF_OTHER':
                    return NextResponse.json(
                        { error: 'api.family.memberOfOther' },
                        { status: 409 }
                    );
                case 'OWNER_OF_OTHER':
                    return NextResponse.json(
                        { error: 'api.family.ownerOfOther' },
                        { status: 409 }
                    );
                case 'HAS_ACTIVE_PLAN':
                    return NextResponse.json(
                        { error: 'api.family.activePlan' },
                        { status: 409 }
                    );
            }
        }
        return NextResponse.json(
            { error: 'api.family.acceptError' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateBody } from '@/lib/api/validation';
import { manageFamilyMemberSchema } from '@/lib/validation/api-schemas';

/**
 * API para gerenciar membros da família
 * - DELETE: Remover membro (owner) ou sair da família (membro)
 */
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

        const rateLimitResult = rateLimit(`family:members:${session.user.id}`, {
            limit: 10,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validação enterprise-grade com Zod
        const validation = await validateBody(request, manageFamilyMemberSchema);

        if ('error' in validation) {
            return validation.error;
        }

        const { memberId, leave } = validation.data;

        // Sair da família (membro falando por si)
        if (leave) {
            const membership = await prisma.familyMember.findFirst({
                where: { userId: session.user.id },
            });

            if (!membership) {
                return NextResponse.json(
                    { error: 'api.family.notMember' },
                    { status: 404 }
                );
            }

            await prisma.familyMember.delete({
                where: { id: membership.id },
            });

            return new NextResponse(null, {
                status: 204,
                headers: getRateLimitHeaders(rateLimitResult)
            });
        }

        // Remover membro (owner removendo)
        // Nota: memberId já validado por Zod (UUID format)

        // Verificar owner + membro em paralelo
        const [family, member] = await Promise.all([
            prisma.family.findUnique({
                where: { ownerId: session.user.id },
            }),
            prisma.familyMember.findUnique({
                where: { id: memberId },
            }),
        ]);

        if (!family) {
            return NextResponse.json(
                { error: 'api.family.notOwner' },
                { status: 403 }
            );
        }

        if (!member || member.familyId !== family.id) {
            return NextResponse.json(
                { error: 'api.family.memberNotFound' },
                { status: 404 }
            );
        }

        await prisma.familyMember.delete({
            where: { id: memberId },
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error managing family member:', error);
        return NextResponse.json(
            { error: 'api.family.manageError' },
            { status: 500 }
        );
    }
}

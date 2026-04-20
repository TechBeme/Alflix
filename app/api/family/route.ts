import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * API para gerenciar família
 * - GET: Buscar família do usuário (como owner ou membro)
 * - POST: Criar família (automático ao primeiro convite)
 */

// GET - Buscar dados da família
export async function GET() {
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

        const rateLimitResult = rateLimit(`family:get:${session.user.id}`, {
            limit: 30,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Buscar como owner e como membro em paralelo
        const [ownedFamily, membership] = await Promise.all([
            prisma.family.findUnique({
                where: { ownerId: session.user.id },
                select: {
                    maxMembers: true,
                    members: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true,
                                    avatarIcon: true,
                                    avatarColor: true,
                                }
                            },
                        },
                        orderBy: { joinedAt: 'asc' },
                    },
                    invites: {
                        where: { status: 'pending', expiresAt: { gt: new Date() } },
                        select: {
                            id: true,
                            token: true,
                            email: true,
                            expiresAt: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            }),
            prisma.familyMember.findFirst({
                where: { userId: session.user.id },
                select: {
                    family: {
                        select: {
                            name: true,
                            owner: {
                                select: {
                                    name: true,
                                    email: true,
                                    avatarIcon: true,
                                    avatarColor: true,
                                }
                            },
                            members: {
                                select: {
                                    id: true,
                                    user: {
                                        select: {
                                            name: true,
                                            email: true,
                                            avatarIcon: true,
                                            avatarColor: true,
                                        }
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            ownedFamily,
            membership,
        });
    } catch (error) {
        console.error('Error fetching family:', error);
        return NextResponse.json(
            { error: 'api.family.fetchError' },
            { status: 500 }
        );
    }
}

// POST - Criar família
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

        const rateLimitResult = rateLimit(`family:create:${session.user.id}`, {
            limit: 5,
            interval: 3600,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Verificar plano, família existente e membership em paralelo
        const [user, existingFamily, existingMembership] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                include: { plan: true },
            }),
            prisma.family.findUnique({
                where: { ownerId: session.user.id },
            }),
            prisma.familyMember.findFirst({
                where: { userId: session.user.id },
            }),
        ]);

        if (!user || (user.maxScreens ?? 1) < 2) {
            return NextResponse.json(
                { error: 'api.family.planNoFamily' },
                { status: 403 }
            );
        }

        if (existingFamily) {
            return NextResponse.json(
                { error: 'api.family.alreadyOwner' },
                { status: 409 }
            );
        }

        if (existingMembership) {
            return NextResponse.json(
                { error: 'api.family.alreadyMember' },
                { status: 409 }
            );
        }

        const family = await prisma.family.create({
            data: {
                ownerId: session.user.id,
                name: `Família de ${user.name || 'Usuário'}`,
                maxMembers: user.maxScreens ?? 1,
            },
        });

        return NextResponse.json({
            family,
            message: 'api.family.createSuccess',
        }, { status: 201, headers: getRateLimitHeaders(rateLimitResult) });
    } catch (error) {
        console.error('Error creating family:', error);
        return NextResponse.json(
            { error: 'api.family.createError' },
            { status: 500 }
        );
    }
}

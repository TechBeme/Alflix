import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema de validação para DELETE
const deleteSessionSchema = z.object({
    sessionId: z.string().cuid().optional(),
    all: z.boolean().optional(),
}).refine(
    (data) => data.sessionId || data.all,
    { message: 'api.sessions.sessionIdRequired' }
);

/**
 * API para gerenciar sessões ativas do usuário
 * - GET: Listar todas as sessões
 * - DELETE: Revogar sessão específica ou todas as outras
 */

// GET - Listar sessões ativas
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

        const rateLimitResult = rateLimit(`sessions:get:${session.user.id}`, {
            limit: 20,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const sessions = (await prisma.session.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        }) as any) as Array<{
            id: string;
            ipAddress: string | null;
            userAgent: string | null;
            geoCity: string | null;
            geoCountry: string | null;
            geoCountryCode: string | null;
            createdAt: Date;
            updatedAt: Date;
        }>;

        return NextResponse.json({
            sessions,
            currentSessionId: session.session.id,
        }, { headers: getRateLimitHeaders(rateLimitResult) });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'api.sessions.fetchError' },
            { status: 500 }
        );
    }
}

// DELETE - Revogar sessão(ões)
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

        const rateLimitResult = rateLimit(`sessions:delete:${session.user.id}`, {
            limit: 10,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validar e parsear body
        const body = await request.json();

        const validation = deleteSessionSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error.issues[0]?.message || 'api.errors.badRequest';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { sessionId, all } = validation.data;

        if (all) {
            // Revogar todas as sessões exceto a atual
            await prisma.session.deleteMany({
                where: {
                    userId: session.user.id,
                    id: { not: session.session.id },
                },
            });

            return new NextResponse(null, {
                status: 204,
                headers: getRateLimitHeaders(rateLimitResult)
            });
        }

        // sessionId é obrigatório se all não foi especificado
        if (!sessionId) {
            return NextResponse.json(
                { error: 'api.sessions.sessionIdMissing' },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Não permite revogar a sessão atual
        if (sessionId === session.session.id) {
            return NextResponse.json(
                { error: 'api.sessions.cannotEndCurrent' },
                { status: 400 }
            );
        }

        // Verificar que a sessão pertence ao usuário
        const targetSession = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!targetSession || targetSession.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'api.sessions.notFound' },
                { status: 404 }
            );
        }

        await prisma.session.delete({
            where: { id: sessionId },
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error revoking session:', error);
        return NextResponse.json(
            { error: 'api.sessions.endError' },
            { status: 500 }
        );
    }
}

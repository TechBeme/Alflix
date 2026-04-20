import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema de validação
const updateNameSchema = z.object({
    name: z.string()
        .min(2, 'Nome deve ter pelo menos 2 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .regex(
            /^[a-zA-ZÀ-ÿ0-9\s\-_.]+$/,
            'api.settings.nameInvalid'
        )
        .transform(val => val.trim()),
});

/**
 * API para alterar nome do usuário
 * 
 * Permite ao usuário personalizar seu nome para identificação,
 * especialmente útil em planos familiares.
 * 
 * Segurança:
 * - Validação Better Auth (usuário autenticado)
 * - Usuário só altera seu próprio nome
 * - Rate limiting: 10 alterações/minuto
 * - Validação de tamanho e caracteres
 */

// PUT - Atualizar nome
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            query: { disableCookieCache: true },
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`name:put:${session.user.id}`, {
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

        const validation = updateNameSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error.issues[0]?.message || 'api.errors.badRequest';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { name: trimmedName } = validation.data;

        // Atualizar nome do usuário
        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: trimmedName },
        });

        // Retorna apenas sucesso - frontend já tem os dados
        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error updating name:', error);
        return NextResponse.json(
            { error: 'api.settings.nameUpdateError' },
            { status: 500 }
        );
    }
}

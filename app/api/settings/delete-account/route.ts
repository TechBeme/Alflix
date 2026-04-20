import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema de validação
const deleteAccountSchema = z.object({
    otp: z.string()
        .min(6, 'OTP deve ter 6 dígitos')
        .max(6, 'OTP deve ter 6 dígitos')
        .regex(/^\d{6}$/, 'OTP deve conter apenas números'),
});

/**
 * API para excluir conta do usuário
 * 
 * Processo seguro:
 * 1. Cliente envia email e OTP para este endpoint
 * 2. Servidor valida OTP via Better Auth (server-side)
 * 3. Se válido, servidor executa exclusão em transação atômica
 * 
 * Segurança:
 * - Validação de OTP no servidor via Better Auth
 * - Rate limiting rígido (5 tentativas/hora)
 * - Transação atômica para exclusão
 * - Cascade delete automático via Prisma
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

        // Rate limit rígido: 5 tentativas por hora
        const rateLimitResult = rateLimit(`delete-account:${session.user.id}`, {
            limit: 5,
            interval: 3600, // 1 hora
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitRetry' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validar e parsear body
        const body = await request.json();

        const validation = deleteAccountSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error.issues[0]?.message || 'api.errors.badRequest';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { otp } = validation.data;

        // VALIDAR OTP NO SERVIDOR via Better Auth
        // Usar o email da sessão autenticada (nunca confiar no frontend)
        const otpValidation = await auth.api.checkVerificationOTP({
            body: {
                email: session.user.email,
                otp,
                type: 'forget-password',
            },
        });

        if (!otpValidation || !otpValidation.success) {
            return NextResponse.json(
                { error: 'api.settings.deleteOtpInvalid' },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Excluir todos os dados do usuário (cascade garante a maioria)
        // Precisamos apenas excluir o user - cascade faz o resto
        // NOTA: Se for owner de família, membros perdem acesso imediatamente
        // TODO: Implementar sistema de notificação por email aos membros
        await prisma.$transaction(async (tx) => {
            // Excluir preferências
            await tx.userPreferences.deleteMany({ where: { userId: session.user.id } });

            // Excluir memberships de família
            await tx.familyMember.deleteMany({ where: { userId: session.user.id } });

            // Se for owner de família, excluir a família inteira
            await tx.family.deleteMany({ where: { ownerId: session.user.id } });

            // Excluir watchlist e histórico
            await tx.watchlist.deleteMany({ where: { userId: session.user.id } });
            await tx.watchHistory.deleteMany({ where: { userId: session.user.id } });

            // Excluir sessões e accounts
            await tx.session.deleteMany({ where: { userId: session.user.id } });
            await tx.account.deleteMany({ where: { userId: session.user.id } });

            // Excluir o usuário
            await tx.user.delete({ where: { id: session.user.id } });
        });

        // CRÍTICO: Invalidar cookies de autenticação após exclusão
        // Isso evita loop infinito de redirects porque limpa os cookies no navegador
        await auth.api.signOut({
            headers: await headers(),
        });

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'api.settings.deleteError' },
            { status: 500 }
        );
    }
}

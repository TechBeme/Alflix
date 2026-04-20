import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';

// Schema de validação
const changeEmailSchema = z.object({
    newEmail: z.string()
        .email('api.settings.emailFormat')
        .min(1, 'api.settings.emailRequired')
        .max(255, 'Email muito longo')
        .transform(val => val.trim().toLowerCase()),
    currentOtp: z.string()
        .min(6, 'OTP deve ter 6 dígitos')
        .max(6, 'OTP deve ter 6 dígitos')
        .regex(/^\d{6}$/, 'OTP deve conter apenas números'),
    newOtp: z.string()
        .min(6, 'OTP deve ter 6 dígitos')
        .max(6, 'OTP deve ter 6 dígitos')
        .regex(/^\d{6}$/, 'OTP deve conter apenas números'),
});

/**
 * API para alterar email do usuário com verificação OTP dupla
 * 
 * Fluxo seguro:
 * 1. Client envia OTP do email atual + novo email + OTP do novo email
 * 2. Server valida OTP do email atual (prova de identidade)
 * 3. Server valida OTP do novo email (prova de posse)
 * 4. Server faz a troca atômica
 * 
 * Segurança:
 * - Sessão ativa obrigatória
 * - Validação de ambos os OTPs no servidor
 * - Rate limit: 5 tentativas por hora
 * - Verifica que o novo email não está em uso
 * - Atualiza email no User e no Account atomicamente
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Validar sessão
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        // 2. Rate limit
        const rateLimitResult = rateLimit(`change-email:${session.user.id}`, {
            limit: 5,
            interval: 3600,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitRetry' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // Validar e parsear body
        const body = await request.json();

        const validation = changeEmailSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error.issues[0]?.message || 'api.errors.badRequest';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const { newEmail: normalizedEmail, currentOtp, newOtp } = validation.data;

        // 4. Verificar que não é o mesmo email
        if (normalizedEmail === session.user.email.toLowerCase()) {
            return NextResponse.json(
                { error: 'api.settings.emailDifferent' },
                { status: 400 }
            );
        }

        // 5+6. VALIDAR AMBOS OTPs EM PARALELO (independentes)
        const [currentOtpValidation, newOtpValidation] = await Promise.all([
            auth.api.checkVerificationOTP({
                body: {
                    email: session.user.email,
                    otp: currentOtp,
                    type: 'email-verification',
                },
            }),
            auth.api.checkVerificationOTP({
                body: {
                    email: normalizedEmail,
                    otp: newOtp,
                    type: 'email-verification',
                },
            }),
        ]);

        if (!currentOtpValidation || !currentOtpValidation.success) {
            return NextResponse.json(
                { error: 'api.settings.emailOtpInvalid' },
                { status: 400 }
            );
        }

        if (!newOtpValidation || !newOtpValidation.success) {
            return NextResponse.json(
                { error: 'api.settings.newEmailOtpInvalid' },
                { status: 400 }
            );
        }

        // 7. Verificar que o novo email não está em uso
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
        });

        if (existingUser) {
            // Resposta genérica — não revela se o email está cadastrado
            return NextResponse.json(
                { error: 'api.settings.emailChangeError' },
                { status: 409 }
            );
        }

        // 8. Atualizar email atomicamente (User + Account)
        await prisma.$transaction([
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    email: normalizedEmail,
                    emailVerified: true, // Ambos OTPs já foram verificados
                },
            }),
            prisma.account.updateMany({
                where: {
                    userId: session.user.id,
                    providerId: 'credential',
                },
                data: {
                    accountId: normalizedEmail,
                },
            }),
        ]);

        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult),
        });
    } catch (error) {
        console.error('[change-email] Erro:', error);
        return NextResponse.json(
            { error: 'api.settings.internalError' },
            { status: 500 }
        );
    }
}

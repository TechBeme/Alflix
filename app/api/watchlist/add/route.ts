import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { validateBody, requireAuth } from '@/lib/api/validation';
import { success, errors, errorToResponse } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

/**
 * API para adicionar item à watchlist do usuário
 * 
 * Segurança Empresarial:
 * - ✅ Autenticação via Better Auth (session-based)
 * - ✅ Rate limiting (30 req/min por IP)
 * - ✅ Validação de entrada com Zod
 * - ✅ Sanitização automática
 * - ✅ Respostas padronizadas
 * - ✅ Erro handling robusto
 * - ✅ Unique constraint no DB (previne duplicatas)
 * - ✅ Usa ID da sessão (não confia no cliente)
 */

// Schema de validação
const addWatchlistSchema = z.object({
    tmdbId: z.number().int().positive('api.validation.positiveId'),
    mediaType: z.enum(['movie', 'tv'], {
        message: 'api.validation.mediaTypeMovieOrTv',
    }),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Rate limiting
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = checkRateLimit(ip, RATE_LIMITS.WRITE);
        if (!rateLimitResult.allowed) {
            return errors.rateLimitExceeded(rateLimitResult.resetTime);
        }

        // 2. Verificar autenticação
        const authResult = await requireAuth(req);
        if ('error' in authResult) {
            return authResult.error;
        }
        const userId = authResult.userId;

        // 3. Validar body
        const validationResult = await validateBody(req, addWatchlistSchema);
        if ('error' in validationResult) {
            return validationResult.error;
        }
        const { tmdbId, mediaType } = validationResult.data;

        // 4. Adicionar à watchlist (upsert = cria ou atualiza)
        await prisma.watchlist.upsert({
            where: {
                userId_tmdbId_mediaType: {
                    userId,
                    tmdbId,
                    mediaType,
                },
            },
            update: {
                // Se já existe, apenas atualiza o timestamp
                addedAt: new Date(),
            },
            create: {
                userId,
                tmdbId,
                mediaType,
            },
        });

        // 204 No Content - frontend faz optimistic update e não precisa de resposta
        return new Response(null, { status: 204 });
    } catch (error) {
        return errorToResponse(error);
    }
}
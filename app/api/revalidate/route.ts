import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * API Endpoint para Revalidação Manual de Cache
 * 
 * NOTA: Este endpoint força o Next.js a refazer o cache na próxima requisição.
 * O cron job (warm-cache) já cuida de manter o cache aquecido automaticamente.
 * Use este endpoint apenas em casos de emergência ou debugging.
 * 
 * Uso:
 * POST /api/revalidate?tag=content
 * Authorization: Bearer <ADMIN_SECRET>
 * 
 * Tags disponíveis:
 * - content: Força revalidação de todo conteúdo
 * - landing: Revalida cache da landing page
 * - home: Revalida cache da home
 * - movies: Revalida movies cache
 * - tv: Revalida TV shows cache
 * 
 * Exemplos:
 * curl -X POST "https://live.allflix.dev/api/revalidate?tag=content" \
 *   -H "Authorization: Bearer $ADMIN_SECRET"
 */

// Schema de validação para query parameters
const revalidateQuerySchema = z.object({
    tag: z.enum(['content', 'landing', 'home', 'movies', 'tv'], {
        message: 'api.revalidate.invalidTag'
    }),
});
export async function POST(request: NextRequest) {
    try {
        // ─── AUTENTICAÇÃO VIA HEADER (SEGURO) ────────────────
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.ADMIN_SECRET;

        // Em produção, ADMIN_SECRET é obrigatório
        if (process.env.NODE_ENV === 'production') {
            if (!expectedSecret || expectedSecret.trim() === '') {
                console.error('❌ [Revalidate] ERRO: ADMIN_SECRET não configurada em produção!');
                return NextResponse.json(
                    { error: 'Server misconfiguration' },
                    { status: 500 }
                );
            }

            if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
                console.warn('⚠️  [Revalidate] Tentativa de acesso não autorizado');
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        } else {
            // Em desenvolvimento, secret obrigatório se configurado
            if (!expectedSecret || !authHeader || authHeader !== `Bearer ${expectedSecret}`) {
                console.warn('⚠️  [Revalidate] Secret inválido ou ausente em desenvolvimento');
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        // ─── VALIDA QUERY PARAMS COM ZOD ───────────────────
        const { searchParams } = new URL(request.url);
        const paramsObject = Object.fromEntries(searchParams.entries());

        const validationResult = revalidateQuerySchema.safeParse(paramsObject);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return NextResponse.json(
                {
                    error: firstError.message,
                    field: firstError.path.join('.')
                },
                { status: 400 }
            );
        }

        const { tag } = validationResult.data;

        // NOTA: Com a estratégia de warm-cache via cron job, a revalidação manual
        // não é mais necessária. O cache é automaticamente aquecido a cada  4 horas.
        // Este endpoint existe apenas para casos de emergência de debugging.

        console.log(`[Revalidate API] ⚠️  Revalidação manual solicitada para: ${tag}`);
        console.log(`[Revalidate API] ℹ️  Nota: Cache é aquecido automaticamente a cada 4h via cron job`);
        console.log(`[Revalidate API] ℹ️  Para refresh imediato, execute /api/cron/warm-cache`);

        return NextResponse.json({
            success: true,
            tag,
            message: 'api.revalidate.success',
            note: 'Cache é aquecido automaticamente a cada 4 horas via cron job',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[Revalidate API] Error:', error);
        return NextResponse.json(
            {
                error: 'api.revalidate.failure',
                message: error instanceof Error ? error.message : 'api.errors.unknown'
            },
            { status: 500 }
        );
    }
}

// Método GET desabilitado (usar apenas POST com Authorization header)
export async function GET(request: NextRequest) {
    return NextResponse.json(
        {
            error: 'api.errors.methodNotAllowed',
            message: 'Use POST com Authorization: Bearer <ADMIN_SECRET> no header'
        },
        { status: 405 }
    );
}

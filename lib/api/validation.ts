/**
 * API Validation Middleware
 * 
 * Valida requisições usando schemas Zod e retorna erros padronizados.
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';
import { errors } from './response';

/**
 * Valida o corpo da requisição contra um schema Zod
 */
export async function validateBody<T extends ZodSchema>(
    request: NextRequest,
    schema: T
): Promise<{ data: z.infer<T> } | { error: ReturnType<typeof errors.validationError> }> {
    try {
        const body = await request.json();
        const data = schema.parse(body);

        return { data };
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return {
                error: errors.validationError(
                    'api.errors.invalidBody',
                    errorMessages
                ),
            };
        }

        return {
            error: errors.badRequest('api.errors.bodyParseError'),
        };
    }
}

/**
 * Valida query parameters contra um schema Zod
 */
export function validateQuery<T extends ZodSchema>(
    request: NextRequest,
    schema: T
): { data: z.infer<T> } | { error: ReturnType<typeof errors.validationError> } {
    try {
        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams.entries());

        const data = schema.parse(params);

        return { data };
    } catch (err) {
        if (err instanceof z.ZodError) {
            const errorMessages = err.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return {
                error: errors.validationError(
                    'api.errors.invalidQuery',
                    errorMessages
                ),
            };
        }

        return {
            error: errors.badRequest('api.errors.queryParseError'),
        };
    }
}

/**
 * Verifica se o usuário está autenticado via Better Auth
 */
export async function requireAuth(request: NextRequest): Promise<{ userId: string } | { error: ReturnType<typeof errors.unauthorized> }> {
    try {
        // Importa auth dinamicamente para evitar ciclos
        const { auth } = await import('@/lib/auth');
        const { headers } = await import('next/headers');

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { error: errors.unauthorized('api.errors.authRequired') };
        }

        return { userId: session.user.id };
    } catch (err) {
        console.error('Auth error:', err);
        return { error: errors.unauthorized('api.errors.authError') };
    }
}

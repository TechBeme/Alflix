/**
 * API Response Utilities
 * 
 * Helpers para criar respostas padronizadas e seguras nas APIs.
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Cria resposta de sucesso padronizada
 */
export function success<T>(data: T, message?: string, status = 200): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            ...(message && { message }),
        },
        { status }
    );
}

/**
 * Cria resposta de erro padronizada
 */
export function error(
    code: string,
    message: string,
    status = 400,
    details?: unknown
): NextResponse<ApiErrorResponse> {
    const errorObj: ApiErrorResponse = {
        success: false,
        error: {
            code,
            message,
        },
    };

    if (details) {
        errorObj.error.details = details;
    }

    return NextResponse.json(errorObj, { status });
}

/**
 * Respostas de erro pré-definidas
 * 
 * Messages are i18n keys — the frontend translates them using
 * the user's locale via translateApiError() from lib/i18n.ts.
 */
export const errors = {
    unauthorized: (message = 'api.errors.unauthorized') => error('UNAUTHORIZED', message, 401),

    forbidden: (message = 'api.errors.forbidden') => error('FORBIDDEN', message, 403),

    notFound: (message = 'api.errors.notFound') => error('NOT_FOUND', message, 404),

    badRequest: (message = 'api.errors.badRequest', details?: unknown) =>
        error('BAD_REQUEST', message, 400, details),

    validationError: (message = 'api.errors.validationError', details?: unknown) =>
        error('VALIDATION_ERROR', message, 422, details),

    rateLimitExceeded: (resetTime?: number) =>
        error(
            'RATE_LIMIT_EXCEEDED',
            'api.errors.rateLimitExceeded',
            429,
            resetTime ? { resetTime } : undefined
        ),

    internalError: (message = 'api.errors.internalError') =>
        error('INTERNAL_ERROR', message, 500),

    methodNotAllowed: (message = 'api.errors.methodNotAllowed') =>
        error('METHOD_NOT_ALLOWED', message, 405),
} as const;

/**
 * Wrapper para tratamento de erros em APIs
 */
export async function handleApiError(fn: () => Promise<NextResponse>): Promise<NextResponse> {
    try {
        return await fn();
    } catch (err) {
        console.error('API Error:', err);

        if (err instanceof Error) {
            return errors.internalError(
                process.env.NODE_ENV === 'development' ? err.message : undefined
            );
        }

        return errors.internalError();
    }
}

/**
 * Converte erro em resposta padronizada
 */
export function errorToResponse(err: unknown): NextResponse {
    console.error('API Error:', err);

    if (err instanceof Error) {
        return errors.internalError(
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }

    return errors.internalError();
}

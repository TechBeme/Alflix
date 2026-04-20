import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { tmdbService } from '@/lib/tmdb';

/**
 * API para busca rápida do SearchModal
 * 
 * Segurança:
 * - Autenticação obrigatória (apenas usuários logados)
 * - Rate limiting: 30 req/min
 * 
 * Retorna apenas os primeiros 6 resultados para preview
 */

// Schema de validação para query parameters
const quickSearchSchema = z.object({
    query: z.string().min(2, 'Busca deve ter no mínimo 2 caracteres').max(200, 'Busca muito longa'),
});

export async function GET(req: Request) {
    try {
        // 1. Autenticação obrigatória
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated', results: [] },
                { status: 401 }
            );
        }

        // 2. Rate limiting
        const rateLimitResult = rateLimit(`quick-search:${session.user.id}`, {
            limit: 30,
            interval: 60, // 1 minuto
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort', results: [] },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // 3. Validar query params com Zod
        const { searchParams } = new URL(req.url);
        const paramsObject = Object.fromEntries(searchParams.entries());

        const validationResult = quickSearchSchema.safeParse(paramsObject);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return NextResponse.json(
                {
                    error: firstError.message,
                    results: []
                },
                {
                    status: 400,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const { query } = validationResult.data;

        // Buscar direto do TMDB
        const searchData = await tmdbService.search(query, 'multi', 1);

        // Filtrar apenas filmes e séries com poster
        const filteredResults = (searchData.results || [])
            .filter((item: any) =>
                (item.media_type === 'movie' || item.media_type === 'tv') &&
                item.poster_path
            )
            .slice(0, 6); // Limitar a 6 resultados para o preview

        return NextResponse.json(
            {
                results: filteredResults,
                total_results: searchData.total_results || 0,
            },
            { headers: getRateLimitHeaders(rateLimitResult) }
        );
    } catch (error) {
        console.error('Error in quick search:', error);
        return NextResponse.json(
            { error: 'api.search.searchFailed', results: [] },
            { status: 500 }
        );
    }
}
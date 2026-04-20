import { NextRequest, NextResponse } from 'next/server';
import { tmdbService } from '@/lib/tmdb';
import { TMDB_API_KEY, INDEXING_LANGUAGE } from '@/lib/config';

/**
 * Health Check Endpoint - INTERNAL USE ONLY
 * 
 * Verifica se o serviço de conteúdo está funcionando corretamente.
 * Requer autenticação via Bearer token para acesso.
 * 
 * Uso:
 * GET /api/health/tmdb
 * Authorization: Bearer <ADMIN_SECRET>
 * 
 * Response:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": string
 * }
 */
export async function GET(request: NextRequest) {
    // ─── AUTHENTICATION ──────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

    // Em produção, secret é obrigatório
    if (process.env.NODE_ENV === 'production' && (!adminSecret || adminSecret.trim() === '')) {
        console.error('❌ [Health TMDB] ERRO: ADMIN_SECRET ou CRON_SECRET não configurada em produção!');
        return NextResponse.json(
            { error: 'Server misconfiguration' },
            { status: 500 }
        );
    }

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        console.warn('⚠️  [Health TMDB] Tentativa de acesso não autorizado');
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';

    try {
        // Check 1: Content API key configurada
        const apiKeyConfigured = !!TMDB_API_KEY && TMDB_API_KEY.length > 0;

        if (!apiKeyConfigured) {
            console.error('[Health Check] Content API key not configured');
            return NextResponse.json({
                status: 'unhealthy',
                message: 'Content service not configured',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

        // Check 2: Consegue buscar conteúdo
        const startTime = Date.now();
        const trendingData = await tmdbService.getTrending('all', 'week', 1, INDEXING_LANGUAGE);
        const responseTime = Date.now() - startTime;

        const contentAvailable = trendingData.results.length > 0;
        const dataCount = trendingData.results.length;

        // Determinar status baseado nos checks (sem expor detalhes)
        if (contentAvailable && dataCount > 10) {
            status = 'healthy';
        } else if (contentAvailable && dataCount > 0) {
            status = 'degraded';
        } else {
            status = 'unhealthy';
        }

        const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

        // Response sanitizado (sem detalhes internos)
        return NextResponse.json({
            status,
            service: 'content',
            response_time_ms: responseTime,
            timestamp: new Date().toISOString()
        }, { status: statusCode });

    } catch (error) {
        console.error('[Health Check] Content service error:', error);

        return NextResponse.json({
            status: 'unhealthy',
            service: 'content',
            message: 'Service temporarily unavailable',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
}

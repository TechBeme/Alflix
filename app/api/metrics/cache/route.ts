import { NextRequest, NextResponse } from 'next/server';
import { metricsStore } from '@/lib/cache-metrics';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CACHE METRICS API ENDPOINT - INTERNAL USE ONLY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Expõe métricas internas de performance para monitoring.
 * Requer autenticação via Bearer token.
 * 
 * USAGE:
 * GET /api/metrics/cache
 * Authorization: Bearer <ADMIN_SECRET>
 * 
 * RESPONSE (sanitizado):
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "uptime": number,
 *   "performance": { ... }
 * }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export async function GET(request: NextRequest) {
    // ─── AUTHENTICATION ──────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    
    // Em produção, secret é obrigatório
    if (process.env.NODE_ENV === 'production' && (!adminSecret || adminSecret.trim() === '')) {
        console.error('❌ [Metrics Cache] ERRO: ADMIN_SECRET ou CRON_SECRET não configurada em produção!');
        return NextResponse.json(
            { error: 'Server misconfiguration' },
            { status: 500 }
        );
    }
    
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
        console.warn('⚠️  [Metrics Cache] Tentativa de acesso não autorizado');
        // Retornar resposta genérica sem expor estrutura
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
    try {
        const health = metricsStore.getHealthReport();
        
        // Calcular success rate
        const successRate = health.metrics.totalOperations > 0
            ? (health.metrics.successfulOperations / health.metrics.totalOperations) * 100
            : 100;

        // Formatar uptime em human-readable
        const uptimeSeconds = Math.floor(health.uptime / 1000);
        const uptimeMinutes = Math.floor(uptimeSeconds / 60);
        const uptimeHours = Math.floor(uptimeMinutes / 60);
        const uptimeDays = Math.floor(uptimeHours / 24);

        // Response sanitizado (sem expor detalhes internos)
        const response = {
            status: health.status,
            uptime: health.uptime,
            performance: {
                operations: health.metrics.totalOperations,
                successRate: parseFloat(successRate.toFixed(2)),
                avgLatency: health.metrics.averageLatencyMs,
                p95Latency: health.metrics.p95LatencyMs
            },
            uptimeHuman: `${uptimeDays}d ${uptimeHours % 24}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`,
            timestamp: new Date().toISOString()
        };

        // Status code baseado na saúde do sistema
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;

        return NextResponse.json(response, { status: statusCode });
        
    } catch (error) {
        console.error('[Metrics API] Error:', error);
        return NextResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 500 }
        );
    }
}

/**
 * Formato Prometheus (opcional)
 * GET /api/metrics/cache?format=prometheus
 */
export async function generatePrometheusMetrics(): Promise<string> {
    const health = metricsStore.getHealthReport();
    const successRate = health.metrics.totalOperations > 0
        ? (health.metrics.successfulOperations / health.metrics.totalOperations) * 100
        : 100;

    return `
# HELP tmdb_cache_operations_total Total number of cache operations
# TYPE tmdb_cache_operations_total counter
tmdb_cache_operations_total ${health.metrics.totalOperations}

# HELP tmdb_cache_operations_successful Total number of successful cache operations
# TYPE tmdb_cache_operations_successful counter
tmdb_cache_operations_successful ${health.metrics.successfulOperations}

# HELP tmdb_cache_operations_failed Total number of failed cache operations
# TYPE tmdb_cache_operations_failed counter
tmdb_cache_operations_failed ${health.metrics.failedOperations}

# HELP tmdb_cache_success_rate Success rate percentage
# TYPE tmdb_cache_success_rate gauge
tmdb_cache_success_rate ${successRate}

# HELP tmdb_cache_latency_average_ms Average latency in milliseconds
# TYPE tmdb_cache_latency_average_ms gauge
tmdb_cache_latency_average_ms ${health.metrics.averageLatencyMs}

# HELP tmdb_cache_latency_p95_ms P95 latency in milliseconds
# TYPE tmdb_cache_latency_p95_ms gauge
tmdb_cache_latency_p95_ms ${health.metrics.p95LatencyMs}

# HELP tmdb_cache_latency_p99_ms P99 latency in milliseconds
# TYPE tmdb_cache_latency_p99_ms gauge
tmdb_cache_latency_p99_ms ${health.metrics.p99LatencyMs}

# HELP tmdb_cache_uptime_seconds System uptime in seconds
# TYPE tmdb_cache_uptime_seconds counter
tmdb_cache_uptime_seconds ${Math.floor(health.uptime / 1000)}

# HELP tmdb_cache_health_status Health status (0=healthy, 1=degraded, 2=unhealthy)
# TYPE tmdb_cache_health_status gauge
tmdb_cache_health_status ${health.status === 'healthy' ? 0 : health.status === 'degraded' ? 1 : 2}
`.trim();
}

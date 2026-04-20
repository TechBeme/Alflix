/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE CACHE METRICS & MONITORING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de métricas e monitoramento para cache TMDB.
 * 
 * FEATURES:
 * - Métricas de performance (latência, throughput, etc.)
 * - Tracking de success/failure rate
 * - Alertas configuráveis
 * - Logs estruturados para agregação
 * - Integração pronta para services externos (Datadog, New Relic, etc.)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface CacheMetric {
    operation: string;
    timestamp: string;
    durationMs: number;
    success: boolean;
    dataCount?: number;
    error?: string;
    metadata?: Record<string, any>;
}

export interface CacheHealthReport {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    metrics: {
        totalOperations: number;
        successfulOperations: number;
        failedOperations: number;
        averageLatencyMs: number;
        p95LatencyMs: number;
        p99LatencyMs: number;
    };
    recentErrors: Array<{
        timestamp: string;
        operation: string;
        error: string;
    }>;
    lastSuccessfulWarmUp?: string;
}

/**
 * In-memory metrics store (em produção, usar Redis ou similar)
 */
class MetricsStore {
    private metrics: CacheMetric[] = [];
    private maxMetrics = 1000; // Manter últimos 1000 eventos
    private startTime = Date.now();

    add(metric: CacheMetric): void {
        this.metrics.push(metric);
        
        // Limitar tamanho do buffer
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        // Log estruturado para agregação externa
        this.logStructured(metric);
    }

    private logStructured(metric: CacheMetric): void {
        const logEntry = {
            timestamp: metric.timestamp,
            level: metric.success ? 'info' : 'error',
            service: 'content-cache', // Genérico, não expor tmdb
            operation: metric.operation.replace(/tmdb/gi, 'content'), // Sanitizar
            duration_ms: metric.durationMs,
            success: metric.success,
            data_count: metric.dataCount,
            // Não incluir error message em produção (pode conter detalhes sensíveis)
            ...(process.env.NODE_ENV === 'development' && metric.error ? { error: metric.error } : {}),
            ...metric.metadata
        };

        // JSON estruturado para fácil parsing por ferramentas de log aggregation
        console.log(JSON.stringify(logEntry));
    }

    getMetrics(since?: Date): CacheMetric[] {
        if (!since) return this.metrics;
        
        const sinceTs = since.getTime();
        return this.metrics.filter(m => new Date(m.timestamp).getTime() >= sinceTs);
    }

    getHealthReport(): CacheHealthReport {
        const now = Date.now();
        const uptime = now - this.startTime;
        
        // Métricas gerais
        const totalOps = this.metrics.length;
        const successfulOps = this.metrics.filter(m => m.success).length;
        const failedOps = totalOps - successfulOps;
        
        // Latência
        const durations = this.metrics.map(m => m.durationMs).sort((a, b) => a - b);
        const avgLatency = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;
        const p95Index = Math.floor(durations.length * 0.95);
        const p99Index = Math.floor(durations.length * 0.99);
        
        // Erros recentes (últimos 10)
        const recentErrors = this.metrics
            .filter(m => !m.success)
            .slice(-10)
            .map(m => ({
                timestamp: m.timestamp,
                operation: m.operation,
                error: m.error || 'Unknown error'
            }));
        
        // Último warm-up bem-sucedido
        const lastWarmUp = this.metrics
            .filter(m => m.success && m.operation.includes('warm-up'))
            .slice(-1)[0];
        
        // Determinar status de saúde
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        const successRate = totalOps > 0 ? successfulOps / totalOps : 1;
        
        if (successRate < 0.5) {
            status = 'unhealthy';
        } else if (successRate < 0.9) {
            status = 'degraded';
        }
        
        return {
            status,
            uptime,
            metrics: {
                totalOperations: totalOps,
                successfulOperations: successfulOps,
                failedOperations: failedOps,
                averageLatencyMs: Math.round(avgLatency),
                p95LatencyMs: durations[p95Index] || 0,
                p99LatencyMs: durations[p99Index] || 0,
            },
            recentErrors,
            lastSuccessfulWarmUp: lastWarmUp?.timestamp
        };
    }

    clear(): void {
        this.metrics = [];
    }
}

// Singleton instance
export const metricsStore = new MetricsStore();

/**
 * Decorator para tracking automático de métricas
 */
export function trackCacheOperation<T>(
    operationName: string,
    fn: () => Promise<T>
): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    return fn()
        .then(result => {
            const durationMs = Date.now() - startTime;
            
            // Tentar contar dados retornados
            let dataCount: number | undefined;
            if (result && typeof result === 'object') {
                if ('results' in result && Array.isArray((result as any).results)) {
                    dataCount = (result as any).results.length;
                } else if ('trending' in result && (result as any).trending?.results) {
                    dataCount = (result as any).trending.results.length;
                }
            }

            metricsStore.add({
                operation: operationName,
                timestamp,
                durationMs,
                success: true,
                dataCount
            });

            return result;
        })
        .catch(error => {
            const durationMs = Date.now() - startTime;
            
            metricsStore.add({
                operation: operationName,
                timestamp,
                durationMs,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            // Re-throw para não suprimir o erro
            throw error;
        });
}

/**
 * Sistema de Alertas
 */
export class AlertSystem {
    private lastAlertTime: Record<string, number> = {};
    private alertCooldown = 300000; // 5 minutos entre alertas do mesmo tipo

    /**
     * Enviar alerta (pode ser integrado com Slack, PagerDuty, email, etc.)
     */
    async sendAlert(
        level: 'warning' | 'critical',
        title: string,
        message: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        const alertKey = `${level}-${title}`;
        const now = Date.now();

        // Cooldown para evitar spam
        if (this.lastAlertTime[alertKey] && now - this.lastAlertTime[alertKey] < this.alertCooldown) {
            return;
        }

        this.lastAlertTime[alertKey] = now;

        // Log estruturado (sanitizado para não expor detalhes internos em produção)
        const alertLog: any = {
            timestamp: new Date().toISOString(),
            level: level === 'critical' ? 'error' : 'warn',
            alert: true,
            title: title.replace(/TMDB/gi, 'Content Service'), // Sanitizar
            message: message.replace(/TMDB/gi, 'content service')
        };
        
        // Apenas incluir metadata em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            alertLog.metadata = metadata;
        }
        
        console.error(JSON.stringify(alertLog));

        // TODO: Integrar com serviço de alertas externo
        // Exemplos:
        // - await sendSlackNotification(level, title, message);
        // - await sendPagerDutyAlert(level, title, message);
        // - await sendEmail(ADMIN_EMAIL, title, message);
    }

    /**
     * Verificar métricas e enviar alertas se necessário
     */
    async checkAndAlert(): Promise<void> {
        const health = metricsStore.getHealthReport();

        // Alerta: Sistema unhealthy
        if (health.status === 'unhealthy') {
            await this.sendAlert(
                'critical',
                'Content Cache Unhealthy',
                `Cache system is unhealthy. Success rate: ${
                    ((health.metrics.successfulOperations / health.metrics.totalOperations) * 100).toFixed(1)
                }%`,
                process.env.NODE_ENV === 'development' ? { health } : undefined
            );
        }

        // Alerta: Sistema degraded
        if (health.status === 'degraded') {
            await this.sendAlert(
                'warning',
                'Content Cache Degraded',
                `Cache system is degraded. Success rate: ${
                    ((health.metrics.successfulOperations / health.metrics.totalOperations) * 100).toFixed(1)
                }%`,
                process.env.NODE_ENV === 'development' ? { health } : undefined
            );
        }

        // Alerta: Latência alta
        if (health.metrics.p95LatencyMs > 10000) { // 10 segundos
            await this.sendAlert(
                'warning',
                'High Cache Latency',
                `P95 latency is ${health.metrics.p95LatencyMs}ms (threshold: 10000ms)`,
                { latency: health.metrics }
            );
        }

        // Alerta: Warm-up não executado há muito tempo
        if (health.lastSuccessfulWarmUp) {
            const lastWarmUpTime = new Date(health.lastSuccessfulWarmUp).getTime();
            const timeSinceWarmUp = Date.now() - lastWarmUpTime;
            const maxAge = 6 * 60 * 60 * 1000; // 6 horas

            if (timeSinceWarmUp > maxAge) {
                await this.sendAlert(
                    'warning',
                    'Cache Warm-Up Overdue',
                    `Last successful warm-up was ${Math.round(timeSinceWarmUp / 3600000)} hours ago`,
                    { lastWarmUp: health.lastSuccessfulWarmUp }
                );
            }
        }
    }
}

export const alertSystem = new AlertSystem();

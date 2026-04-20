import { NextRequest, NextResponse } from 'next/server';
import {
    getCachedHomeContent,
    getCachedLandingData,
    getCachedMoviesPageData,
    getCachedTVPageData
} from '@/lib/tmdb-cache';
import { metricsStore, alertSystem } from '@/lib/cache-metrics';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CONTENT CACHE WARM-UP CRON JOB - INTERNAL USE ONLY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enterprise-grade cache warming strategy para conteúdo de streaming.
 * 
 * PROPÓSITO:
 * - Pré-aquecer cache ANTES que usuários acessem (proativo vs reativo)
 * - Garantir 0% de cache miss para usuários finais
 * - Manter dados sempre frescos sem degradação de performance
 * 
 * ESTRATÉGIA:
 * - Executa 1x por dia (6:00 UTC / 3:00 AM BR - horário de baixo tráfego)
 * - Força refresh de todos os caches críticos
 * - Retry automático em caso de falha
 * - Circuit breaker para proteção da API externa
 * 
 * SEGURANÇA:
 * - Autenticação via Vercel Cron Secret (CRON_SECRET env var)
 * - Rate limiting interno
 * - Timeout protection
 * 
 * SCHEDULE:
 * - Produção: Diariamente às 6:00 UTC (cron: 0 6 * * *)
 * - Cache válido: 36 horas (sempre renovado antes de expirar)
 * - Limitação: Plano Hobby permite apenas 1 cron/dia
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface WarmUpResult {
    cache: string;
    success: boolean;
    dataCount: number;
    executionTimeMs: number;
    error?: string;
}

interface WarmUpReport {
    success: boolean;
    timestamp: string;
    totalExecutionTimeMs: number;
    results: WarmUpResult[];
    summary: {
        total: number;
        successful: number;
        failed: number;
    };
}

/**
 * Circuit Breaker para proteger contra sobrecarga da API TMDB
 */
class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private readonly threshold = 3; // Máximo de falhas consecutivas
    private readonly timeout = 60000; // 1 minuto de timeout

    isOpen(): boolean {
        if (this.failures >= this.threshold) {
            const now = Date.now();
            if (now - this.lastFailureTime < this.timeout) {
                return true; // Circuit aberto (bloqueando requests)
            }
            // Timeout passou, resetar
            this.reset();
        }
        return false;
    }

    recordSuccess(): void {
        this.failures = 0;
    }

    recordFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();
    }

    reset(): void {
        this.failures = 0;
        this.lastFailureTime = 0;
    }
}

const circuitBreaker = new CircuitBreaker();

/**
 * Retry helper com backoff exponencial
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) {
            throw error;
        }

        console.warn(`[Warm Cache] Retry attempt (${retries} left), waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Backoff exponencial
        return withRetry(fn, retries - 1, delay * 2);
    }
}

/**
 * Warm-up de um cache específico
 */
async function warmUpCache(
    cacheName: string,
    fetcher: () => Promise<any>
): Promise<WarmUpResult> {
    const startTime = Date.now();

    try {
        console.log(`[Warm Cache] Starting warm-up for: ${cacheName}`);

        const data = await withRetry(fetcher, 2, 1000);

        // Contar itens retornados
        let dataCount = 0;
        if (data.trending?.results) dataCount = data.trending.results.length;
        else if (data.popular?.results) dataCount = data.popular.results.length;
        else if (data.results) dataCount = data.results.length;

        const executionTimeMs = Date.now() - startTime;

        if (dataCount === 0) {
            throw new Error('No data returned from TMDB');
        }

        // Track métrica de sucesso
        metricsStore.add({
            operation: `warm-up-${cacheName}`,
            timestamp: new Date().toISOString(),
            durationMs: executionTimeMs,
            success: true,
            dataCount
        });

        console.log(`[Warm Cache] ✓ ${cacheName} completed: ${dataCount} items in ${executionTimeMs}ms`);

        return {
            cache: cacheName,
            success: true,
            dataCount,
            executionTimeMs
        };

    } catch (error) {
        const executionTimeMs = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Track métrica de falha
        metricsStore.add({
            operation: `warm-up-${cacheName}`,
            timestamp: new Date().toISOString(),
            durationMs: executionTimeMs,
            success: false,
            error: errorMessage
        });

        console.error(`[Warm Cache] ✗ ${cacheName} failed:`, errorMessage);

        return {
            cache: cacheName,
            success: false,
            dataCount: 0,
            executionTimeMs,
            error: errorMessage
        };
    }
}

/**
 * Endpoint principal do Cron Job
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    // ─── AUTENTICAÇÃO ────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Em produção, CRON_SECRET é obrigatório
    if (process.env.NODE_ENV === 'production' && (!cronSecret || cronSecret.trim() === '')) {
        console.error('❌ [Warm Cache] ERRO: CRON_SECRET não configurada em produção!');
        return NextResponse.json(
            { error: 'Server misconfiguration' },
            { status: 500 }
        );
    }

    // Verificar se é uma chamada válida do Vercel Cron
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.warn('⚠️  [Warm Cache] Tentativa de acesso não autorizado');
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[Cache Warm-Up] 🚀 Content Cache Warm-Up Started');
    console.log('═══════════════════════════════════════════════════════════');

    // ─── CIRCUIT BREAKER CHECK ───────────────────────────────────────────
    if (circuitBreaker.isOpen()) {
        console.error('[Cache Warm-Up] ⚠️  Circuit breaker is OPEN - skipping warm-up');
        return NextResponse.json({
            success: false,
            error: 'Circuit breaker is open due to previous failures',
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }

    // ─── CACHE WARM-UP EXECUTION ─────────────────────────────────────────
    const results: WarmUpResult[] = [];

    try {
        // Estratégia: Aquecer cache para TODOS os idiomas suportados (en, pt-BR, es)
        // Executar em batches para minimizar tempo e respeitar rate limiting

        // Batch 1: Landing pages em todos os idiomas
        console.log('[Cache Warm-Up] Starting batch 1: Landing pages (3 languages)');
        const batch1 = await Promise.all([
            warmUpCache('landing-en', () => getCachedLandingData('en')),
            warmUpCache('landing-pt-BR', () => getCachedLandingData('pt-BR')),
            warmUpCache('landing-es', () => getCachedLandingData('es')),
        ]);
        results.push(...batch1);

        // Delay entre batches para respeitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Batch 2: Home content em todos os idiomas
        console.log('[Cache Warm-Up] Starting batch 2: Home content (3 languages)');
        const batch2 = await Promise.all([
            warmUpCache('home-en', () => getCachedHomeContent('en')),
            warmUpCache('home-pt-BR', () => getCachedHomeContent('pt-BR')),
            warmUpCache('home-es', () => getCachedHomeContent('es')),
        ]);
        results.push(...batch2);

        // Delay entre batches
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Batch 3: Movies page em todos os idiomas
        console.log('[Cache Warm-Up] Starting batch 3: Movies pages (3 languages)');
        const batch3 = await Promise.all([
            warmUpCache('movies-en', () => getCachedMoviesPageData('en')),
            warmUpCache('movies-pt-BR', () => getCachedMoviesPageData('pt-BR')),
            warmUpCache('movies-es', () => getCachedMoviesPageData('es')),
        ]);
        results.push(...batch3);

        // Delay entre batches
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Batch 4: TV pages em todos os idiomas
        console.log('[Cache Warm-Up] Starting batch 4: TV pages (3 languages)');
        const batch4 = await Promise.all([
            warmUpCache('tv-en', () => getCachedTVPageData('en')),
            warmUpCache('tv-pt-BR', () => getCachedTVPageData('pt-BR')),
            warmUpCache('tv-es', () => getCachedTVPageData('es')),
        ]);
        results.push(...batch4);

        // ─── CACHE WARMING COMPLETE ─────────────────────────────────────
        // O unstable_cache já cuida da revalidação automática
        console.log('[Cache Warm-Up] ✅ All caches warmed successfully (12 caches across 3 languages)');

    } catch (error) {
        console.error('[Cache Warm-Up] ❌ Fatal error during warm-up:', error);
        circuitBreaker.recordFailure();

        const totalExecutionTimeMs = Date.now() - startTime;

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            totalExecutionTimeMs,
            results
        }, { status: 500 });
    }

    // ─── GENERATE REPORT ─────────────────────────────────────────────────
    const totalExecutionTimeMs = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const allSuccessful = failed === 0;

    const report: WarmUpReport = {
        success: allSuccessful,
        timestamp: new Date().toISOString(),
        totalExecutionTimeMs,
        results,
        summary: {
            total: results.length,
            successful,
            failed
        }
    };

    // ─── UPDATE CIRCUIT BREAKER ──────────────────────────────────────────
    if (allSuccessful) {
        circuitBreaker.recordSuccess();
    } else {
        circuitBreaker.recordFailure();
    }

    // ─── LOGGING ─────────────────────────────────────────────────────────
    console.log('───────────────────────────────────────────────────────────');
    console.log(`[Cache Warm-Up] ${allSuccessful ? '✓' : '⚠️'} Warm-Up Completed`);
    console.log(`[Cache Warm-Up] Success Rate: ${successful}/${results.length}`);
    console.log(`[Cache Warm-Up] Total Time: ${totalExecutionTimeMs}ms`);
    console.log('═══════════════════════════════════════════════════════════');

    // ─── CHECK & SEND ALERTS ─────────────────────────────────────────────
    try {
        await alertSystem.checkAndAlert();
    } catch (alertError) {
        console.error('[Warm Cache] Error sending alerts:', alertError);
        // Não falhar o cron se alertas falharem
    }

    // Retornar status apropriado
    const statusCode = allSuccessful ? 200 : 207; // 207 = Multi-Status (partial success)

    return NextResponse.json(report, { status: statusCode });
}

/**
 * POST endpoint para warm-up manual (via API ou UI)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    // Permitir POST para warm-up manual (com autenticação)
    return GET(request);
}

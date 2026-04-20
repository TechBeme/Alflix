/**
 * Sistema de rate limiting simples em memória
 * ✅ Sem dependências externas
 * ✅ Leve e eficiente
 * ⚠️ Não funciona em ambientes distribuídos (usar Redis em produção se necessário)
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Cache em memória
const cache = new Map<string, RateLimitEntry>();

// Limpar cache periodicamente (a cada 1 minuto)
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
        if (now > entry.resetAt) {
            cache.delete(key);
        }
    }
}, 60000);

export interface RateLimitConfig {
    /**
     * Número máximo de requisições permitidas no intervalo
     * @default 10
     */
    limit?: number;

    /**
     * Intervalo de tempo em segundos
     * @default 60 (1 minuto)
     */
    interval?: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
}

/**
 * Verifica se uma requisição está dentro do rate limit
 * 
 * @param identifier - Identificador único (userId, IP, etc)
 * @param config - Configuração de limite
 * @returns Objeto com status e informações de rate limit
 * 
 * @example
 * const result = rateLimit(userId, { limit: 10, interval: 60 });
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
 *   );
 * }
 */
export function rateLimit(
    identifier: string,
    config: RateLimitConfig = {}
): RateLimitResult {
    const { limit = 10, interval = 60 } = config;
    const now = Date.now();
    const key = `ratelimit:${identifier}`;

    // Obter entrada do cache
    let entry = cache.get(key);

    // Se não existe ou expirou, criar nova
    if (!entry || now > entry.resetAt) {
        entry = {
            count: 0,
            resetAt: now + interval * 1000,
        };
        cache.set(key, entry);
    }

    // Incrementar contador
    entry.count++;

    // Verificar se excedeu o limite
    const success = entry.count <= limit;
    const remaining = Math.max(0, limit - entry.count);

    return {
        success,
        limit,
        remaining,
        resetAt: entry.resetAt,
    };
}

/**
 * Converte resultado de rate limit para headers HTTP
 * 
 * @example
 * const result = rateLimit(userId);
 * return NextResponse.json(data, { headers: getRateLimitHeaders(result) });
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
    };
}

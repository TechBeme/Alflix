/**
 * Rate Limiting Utilities
 * 
 * Implementa rate limiting simples baseado em memória.
 * Para produção com múltiplas instâncias, use Redis + Upstash.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// Armazena contadores de rate limit em memória
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpa entradas expiradas a cada 5 minutos
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

const defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
};

/**
 * Verifica se uma requisição deve ser bloqueada por rate limiting
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    // Se não existe entrada ou expirou, criar nova
    if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(identifier, newEntry);

        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: newEntry.resetTime,
        };
    }

    // Se ainda está dentro do limite
    if (entry.count < config.maxRequests) {
        entry.count++;
        rateLimitStore.set(identifier, entry);

        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    // Limite excedido
    return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
    };
}

/**
 * Reseta o rate limit para um identificador específico
 */
export function resetRateLimit(identifier: string): void {
    rateLimitStore.delete(identifier);
}

/**
 * Configurações pré-definidas de rate limit
 */
export const RATE_LIMITS = {
    // APIs públicas de leitura
    PUBLIC_READ: {
        maxRequests: 100,
        windowMs: 60 * 1000, // 100 req/min
    },

    // APIs de escrita/mutação
    WRITE: {
        maxRequests: 30,
        windowMs: 60 * 1000, // 30 req/min
    },

    // Login/Autenticação (mais restritivo)
    AUTH: {
        maxRequests: 5,
        windowMs: 60 * 1000, // 5 tentativas/min
    },

    // Busca (pode ser custoso)
    SEARCH: {
        maxRequests: 50,
        windowMs: 60 * 1000, // 50 req/min
    },

    // Upload/Download
    UPLOAD: {
        maxRequests: 10,
        windowMs: 60 * 1000, // 10 req/min
    },
} as const;

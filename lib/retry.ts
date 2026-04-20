/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE RETRY LOGIC WITH EXPONENTIAL BACKOFF
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Implementa retry pattern robusto para chamadas externas (TMDB API, etc.)
 * 
 * FEATURES:
 * - Exponential backoff (1s → 2s → 4s → ...)
 * - Jitter para evitar thundering herd
 * - Retry apenas em erros transientes (5xx, timeout, network)
 * - Fail-fast em erros permanentes (4xx exceto 429)
 * - Logging detalhado para debugging
 * - TypeScript type-safe
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface RetryOptions {
    /** Número máximo de tentativas (incluindo a primeira) */
    maxAttempts?: number;
    
    /** Delay inicial em ms (será multiplicado exponencialmente) */
    initialDelayMs?: number;
    
    /** Multiplicador para backoff exponencial */
    backoffMultiplier?: number;
    
    /** Delay máximo em ms (cap para evitar waits muito longos) */
    maxDelayMs?: number;
    
    /** Adicionar jitter aleatório (0-100% do delay) */
    jitter?: boolean;
    
    /** Função para determinar se deve fazer retry baseado no erro */
    shouldRetry?: (error: any) => boolean;
    
    /** Callback executado antes de cada retry */
    onRetry?: (error: any, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
    jitter: true,
    shouldRetry: (error: any) => {
        // Retry em erros de rede, timeout, e 5xx
        if (error?.code === 'ECONNREFUSED' || 
            error?.code === 'ETIMEDOUT' ||
            error?.code === 'ENOTFOUND') {
            return true;
        }
        
        // Retry em 5xx (server errors)
        if (error?.response?.status >= 500) {
            return true;
        }
        
        // Retry em 429 (rate limit) - com backoff
        if (error?.response?.status === 429) {
            return true;
        }
        
        // Não retry em 4xx (client errors) exceto 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
        }
        
        // Retry em outros erros não categorizados
        return true;
    },
    onRetry: () => {}
};

/**
 * Calcula delay com exponential backoff e jitter opcional
 */
function calculateDelay(
    attempt: number,
    initialDelay: number,
    multiplier: number,
    maxDelay: number,
    useJitter: boolean
): number {
    // Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
    const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
    
    // Cap no máximo
    let delay = Math.min(exponentialDelay, maxDelay);
    
    // Adicionar jitter (randomização 0-100% do delay)
    if (useJitter) {
        const jitterAmount = Math.random() * delay;
        delay = delay - jitterAmount;
    }
    
    return Math.floor(delay);
}

/**
 * Aguarda por um período de tempo
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executa uma função com retry automático em caso de falha
 * 
 * @param fn - Função assíncrona para executar
 * @param options - Opções de configuração do retry
 * @returns Promise com o resultado da função
 * @throws Error da última tentativa se todas falharem
 * 
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => fetch('https://api.example.com/data'),
 *   { maxAttempts: 5, initialDelayMs: 2000 }
 * );
 * ```
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    let lastError: any;
    
    for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
        try {
            // Executar a função
            const result = await fn();
            
            // Se chegou aqui, sucesso!
            if (attempt > 0) {
                console.log(`[Retry] ✓ Success on attempt ${attempt + 1}/${opts.maxAttempts}`);
            }
            
            return result;
            
        } catch (error) {
            lastError = error;
            
            // Se é a última tentativa, throw
            if (attempt === opts.maxAttempts - 1) {
                console.error(`[Retry] ✗ Failed after ${opts.maxAttempts} attempts:`, error);
                throw error;
            }
            
            // Verificar se deve fazer retry
            if (!opts.shouldRetry(error)) {
                console.error(`[Retry] ✗ Non-retryable error, failing fast:`, error);
                throw error;
            }
            
            // Calcular delay
            const delay = calculateDelay(
                attempt,
                opts.initialDelayMs,
                opts.backoffMultiplier,
                opts.maxDelayMs,
                opts.jitter
            );
            
            // Log e callback
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(
                `[Retry] ⚠ Attempt ${attempt + 1}/${opts.maxAttempts} failed, ` +
                `retrying in ${delay}ms...`,
                { error: errorMessage }
            );
            
            opts.onRetry(error, attempt + 1, delay);
            
            // Aguardar antes do próximo retry
            await sleep(delay);
        }
    }
    
    // Nunca deveria chegar aqui, mas TypeScript precisa
    throw lastError;
}

/**
 * Versão com timeout para evitar que operações fiquem travadas infinitamente
 */
export async function withRetryAndTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    retryOptions: RetryOptions = {}
): Promise<T> {
    return withRetry(
        () => Promise.race([
            fn(),
            new Promise<T>((_, reject) => 
                setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
            )
        ]),
        retryOptions
    );
}

/**
 * Wrapper conveniente para chamadas HTTP com retry
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withRetry(
        async () => {
            const response = await fetch(url, init);
            
            // Se não ok, throw para trigger retry
            if (!response.ok) {
                const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.response = response;
                throw error;
            }
            
            return response;
        },
        retryOptions
    );
}

/**
 * Batch retry - executa múltiplas operações com retry individual
 * Se alguma falhar após retries, continua com as outras
 */
export async function batchWithRetry<T>(
    operations: Array<() => Promise<T>>,
    retryOptions?: RetryOptions
): Promise<Array<T | Error>> {
    return Promise.all(
        operations.map(op => 
            withRetry(op, retryOptions)
                .catch(error => error) // Captura erro mas não falha o batch
        )
    );
}

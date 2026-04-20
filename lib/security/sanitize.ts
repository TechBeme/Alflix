/**
 * Input Sanitization Utilities
 * 
 * Sanitiza inputs do usuário para prevenir XSS, SQL Injection e outros ataques.
 * Usar em todas as APIs e formulários antes de processar dados.
 */

/**
 * Remove caracteres perigosos de HTML para prevenir XSS
 */
export function sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Remove caracteres especiais de SQL para prevenir SQL Injection
 * Nota: Use sempre Prisma/ORM que já faz escape automático
 */
export function sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';

    return input
        .replace(/['";\\]/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
}

/**
 * Sanitiza email removendo espaços e convertendo para lowercase
 */
export function sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';

    return email
        .trim()
        .toLowerCase()
        .replace(/[^\w.@+-]/g, '');
}

/**
 * Sanitiza nome removendo caracteres perigosos mas mantendo acentos
 */
export function sanitizeName(name: string): string {
    if (typeof name !== 'string') return '';

    return name
        .trim()
        .replace(/[<>\"'`]/g, '')
        .replace(/\s+/g, ' ');
}

/**
 * Sanitiza texto genérico removendo scripts e tags HTML
 */
export function sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';

    return text
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
        .replace(/<embed\b[^<]*>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

/**
 * Sanitiza URLs permitindo apenas protocolos seguros
 */
export function sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';

    const trimmed = url.trim();

    // Permitir apenas http, https e rotas relativas
    if (trimmed.startsWith('/')) {
        return trimmed;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    return '';
}

/**
 * Limita o tamanho de um texto
 */
export function limitLength(text: string, maxLength: number): string {
    if (typeof text !== 'string') return '';

    return text.slice(0, maxLength);
}

/**
 * Remove espaços extras e normaliza quebras de linha
 */
export function normalizeWhitespace(text: string): string {
    if (typeof text !== 'string') return '';

    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

/**
 * Sanitiza input completo com múltiplas proteções
 */
export function sanitizeInput(input: string, type: 'email' | 'name' | 'text' | 'url' = 'text'): string {
    if (!input || typeof input !== 'string') return '';

    switch (type) {
        case 'email':
            return sanitizeEmail(input);
        case 'name':
            return sanitizeName(input);
        case 'url':
            return sanitizeUrl(input);
        case 'text':
        default:
            return sanitizeText(normalizeWhitespace(input));
    }
}

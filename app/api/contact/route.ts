import { NextRequest } from 'next/server';
import { z } from 'zod';
import { validateBody } from '@/lib/api/validation';
import { success, errors, errorToResponse } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { sanitizeInput } from '@/lib/security/sanitize';

/**
 * API de Contato - Exemplo de Implementação Completa
 * 
 * Esta API demonstra todas as práticas de segurança empresariais:
 * 
 * 🔒 CAMADAS DE SEGURANÇA:
 * 1. Rate Limiting - Previne spam e ataques DDoS (5 req/min)
 * 2. Validação com Zod - Garante dados válidos antes de processar
 * 3. Sanitização de Input - Remove XSS, SQL injection, scripts maliciosos
 * 4. Respostas Padronizadas - Consistência e segurança nas mensagens
 * 5. Error Handling Robusto - Nunca vaza informações sensíveis
 * 
 * 📋 FLUXO DE EXECUÇÃO:
 * Request → Rate Limit → Validação → Sanitização → Processamento → Response
 * 
 * 🎯 USO EM PRODUÇÃO:
 * Este padrão deve ser replicado em TODAS as APIs públicas.
 * Para APIs autenticadas, adicione requireAuth() após o rate limiting.
 */

// Schema de validação para contato
const contactSchema = z.object({
    name: z.string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome muito longo'),
    email: z.string()
        .email('api.contact.emailInvalid')
        .toLowerCase()
        .trim(),
    subject: z.string()
        .min(5, 'Assunto deve ter no mínimo 5 caracteres')
        .max(200, 'Assunto muito longo'),
    message: z.string()
        .min(20, 'Mensagem deve ter no mínimo 20 caracteres')
        .max(5000, 'Mensagem muito longa'),
});

export async function POST(req: NextRequest) {
    try {
        // ⏱️ ETAPA 1: Rate Limiting
        // Limita requisições para prevenir spam/abuse
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = checkRateLimit(ip, RATE_LIMITS.AUTH);
        if (!rateLimitResult.allowed) {
            return errors.rateLimitExceeded(rateLimitResult.resetTime);
        }

        // ✅ ETAPA 2: Validação de Dados
        // Valida estrutura e tipos antes de processar
        const validationResult = await validateBody(req, contactSchema);
        if ('error' in validationResult) {
            return validationResult.error;
        }

        const rawData = validationResult.data;

        // 🧹 ETAPA 3: Sanitização de Input
        // Remove scripts maliciosos, SQL injection, etc.
        const sanitizedData = {
            name: sanitizeInput(rawData.name, 'name'),
            email: sanitizeInput(rawData.email, 'email'),
            subject: sanitizeInput(rawData.subject, 'text'),
            message: sanitizeInput(rawData.message, 'text'),
        };

        // 📧 ETAPA 4: Processamento
        // Aqui você enviaria o email, salvaria no banco, etc.
        console.log('📨 Nova mensagem de contato:', {
            from: sanitizedData.name,
            email: sanitizedData.email,
            subject: sanitizedData.subject,
            timestamp: new Date().toISOString(),
        });

        // Exemplo: Enviar email (descomentar quando configurar SMTP)
        /*
        await sendEmail({
            to: process.env.CONTACT_EMAIL!,
            replyTo: sanitizedData.email,
            subject: `[Contato] ${sanitizedData.subject}`,
            text: `
                Nome: ${sanitizedData.name}
                Email: ${sanitizedData.email}
                Assunto: ${sanitizedData.subject}
                
                Mensagem:
                ${sanitizedData.message}
            `,
        });
        */

        // Exemplo: Salvar no banco (descomentar quando configurar)
        /*
        await prisma.contactMessage.create({
            data: {
                name: sanitizedData.name,
                email: sanitizedData.email,
                subject: sanitizedData.subject,
                message: sanitizedData.message,
                ipAddress: req.ip || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown',
            },
        });
        */

        // ✨ ETAPA 5: Resposta Padronizada
        return success(
            {
                id: crypto.randomUUID(), // ID temporário para tracking
                receivedAt: new Date().toISOString(),
            },
            'api.contact.success',
            201
        );

    } catch (error) {
        // 🚨 Error Handling Centralizado
        // errorToResponse garante que erros nunca vazam informações sensíveis
        return errorToResponse(error);
    }
}

// Configuração do runtime (opcional, mas recomendado)
export const runtime = 'nodejs'; // ou 'edge' para deploy Edge
export const dynamic = 'force-dynamic'; // Desabilita caching

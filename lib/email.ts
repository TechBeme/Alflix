/**
 * Email Service — Resend SDK
 * 
 * Serviço centralizado de envio de email via Resend SDK oficial.
 * Compatível com serverless (Vercel) — todas as chamadas devem ser awaited.
 * 
 * Funcionalidades:
 * - Envio de emails transacionais (OTP, verificação)
 * - Fallback para console em desenvolvimento sem API key
 * - Validação de configuração com erros descritivos
 * - Singleton do cliente Resend (uma instância por cold start)
 * 
 * Variáveis de ambiente:
 * - RESEND_API_KEY: Chave de API do Resend (https://resend.com/api-keys)
 * - EMAIL_FROM: Remetente (ex: "ALLFLIX <noreply@yourdomain.com>")
 * 
 * @see https://resend.com/docs/api-reference/emails/send-email
 */

import { Resend } from "resend";
import { SITE_NAME_FULL, RESEND_API_KEY, EMAIL_FROM } from "./config";

// ─── Resend Client (singleton per cold start) ──────────────────────────────

let resendClient: Resend | null = null;

function getResendClient(): Resend {
    if (!resendClient) {
        resendClient = new Resend(RESEND_API_KEY);
    }
    return resendClient;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface EmailOptions {
    to: string
    subject: string
    html: string
}

interface EmailResult {
    success: true
    id: string
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Envia um email via Resend SDK.
 * 
 * IMPORTANTE: Sempre usar `await` ao chamar esta função em ambiente serverless.
 * Sem await, a função serverless pode encerrar antes do envio completar.
 * 
 * Em desenvolvimento sem RESEND_API_KEY, faz log no console.
 * Em produção sem RESEND_API_KEY, lança erro.
 * 
 * @throws {Error} Se a API key não estiver configurada em produção
 * @throws {Error} Se o EMAIL_FROM estiver inválido
 * @throws {Error} Se o Resend retornar erro na API
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<EmailResult> {
    // ── Dev fallback: log no console quando sem API key ──
    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Email] RESEND_API_KEY não configurada — modo preview');
            console.log(`[Email] Preview → To: ${to} | Subject: ${subject} | Size: ${html.length}b`);
            return { success: true, id: `dev-${Date.now()}` }
        }
        throw new Error(
            'RESEND_API_KEY não configurada em produção. ' +
            'Configure a variável de ambiente: https://resend.com/api-keys'
        )
    }

    // ── Validação do remetente ──
    if (!EMAIL_FROM || EMAIL_FROM.includes('undefined')) {
        throw new Error(`EMAIL_FROM inválido: "${EMAIL_FROM}". Verifique a variável de ambiente.`)
    }

    // ── Envio via SDK ──
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
    });

    if (error) {
        console.error(`[Email] Falha ao enviar para ${to}:`, error.name, error.message);
        throw new Error(`Resend API error: ${error.name} — ${error.message}`)
    }

    if (!data?.id) {
        throw new Error('Resend retornou resposta sem ID — envio possivelmente falhou')
    }

    console.log(`[Email] Enviado → ${to} | ID: ${data.id}`);
    return { success: true, id: data.id }
}

/**
 * Template para email de OTP
 * 
 * Usado para sign-in, verificação de email, recuperação e ações customizadas.
 * O código expira em 5 minutos.
 * 
 * @param otp - Código OTP de 6 dígitos
 * @param type - Tipo da operação (Better Auth types + custom types via contexto)
 * @param baseUrl - URL base do site
 * @param metadata - Metadata adicional do contexto (opcional)
 */
export function getOTPEmailTemplate(
    otp: string,
    type: string,
    baseUrl: string,
    metadata?: Record<string, unknown>
) {
    const titleMap: Record<string, string> = {
        'sign-in': 'Seu código de acesso',
        'email-verification': 'Verifique seu email',
        'forget-password': 'Verificação de identidade',
    }

    const descriptionMap: Record<string, string> = {
        'sign-in': 'Use o código abaixo para acessar sua conta.',
        'email-verification': 'Use o código abaixo para verificar seu endereço de email.',
        'forget-password': 'Recebemos uma solicitação para confirmar sua identidade. Se você não fez essa solicitação, ignore este email.',
    }

    const title = titleMap[type] || 'Código de verificação'
    const description = descriptionMap[type] || `Use o código abaixo para continuar no ${SITE_NAME_FULL}.`

    // Adiciona warning visual extra para ações críticas (forget-password é usado para ações destrutivas)
    const isDestructiveAction = type === 'forget-password'
    const warningBorder = isDestructiveAction ? 'border-top: 4px solid #d0212a;' : ''

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title} - ${SITE_NAME_FULL}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #d0212a 0%, #ff4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">${SITE_NAME_FULL}</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none; ${warningBorder}">
                <h2 style="color: #333; margin-top: 0; text-align: center;">${title}</h2>
                
                <p style="color: #666; line-height: 1.6; text-align: center;">
                    ${description}
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; background: #f8f8f8; border: 2px dashed #d0212a; border-radius: 10px; padding: 20px 40px;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d0212a; font-family: 'Courier New', monospace;">
                            ${otp}
                        </span>
                    </div>
                </div>

                <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">
                    Este código expira em <strong>5 minutos</strong>.
                </p>

                ${isDestructiveAction ? `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; padding: 16px; margin: 24px 0;">
                    <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>Esta ação não pode ser desfeita.</strong>
                    </p>
                </div>
                ` : ''}

                <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
                
                <p style="color: #999; font-size: 13px; text-align: center;">
                    Nunca compartilhe este código com ninguém.
                </p>
                
                <p style="color: #bbb; font-size: 11px; text-align: center; margin-top: 20px;">
                    ${SITE_NAME_FULL} &mdash; <a href="${baseUrl}" style="color: #d0212a; text-decoration: none;">${baseUrl}</a>
                </p>
            </div>
        </body>
        </html>
    `
}

/**
 * Template para email de verificação (link)
 */
export function getVerificationEmailTemplate(token: string, baseUrl: string) {
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Verifique seu email - ${SITE_NAME_FULL}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #d0212a 0%, #ff4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <a href="${baseUrl}" style="text-decoration: none;">
                    <img src="${baseUrl}/favicon-96x96.png" alt="${SITE_NAME_FULL}" width="48" height="48" style="display: block; margin: 0 auto 10px; border-radius: 8px;" />
                    <h1 style="color: white; margin: 0;">${SITE_NAME_FULL}</h1>
                </a>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Verifique seu email</h2>
                
                <p style="color: #666; line-height: 1.6;">
                    Obrigado por se cadastrar no ${SITE_NAME_FULL}! Para completar seu cadastro, 
                    clique no botão abaixo para verificar seu endereço de email.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background: #d0212a; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verificar Email
                    </a>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                    Se você não se cadastrou no ${SITE_NAME_FULL}, pode ignorar este email.
                </p>
                
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    Link alternativo: <a href="${verificationUrl}">${verificationUrl}</a>
                </p>
            </div>
        </body>
        </html>
    `
}

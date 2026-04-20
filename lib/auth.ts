import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { emailOTP } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "./prisma"
import { sendEmail, getOTPEmailTemplate } from "./email"
import { SITE_NAME_FULL, BETTER_AUTH_SECRET, SITE_URL } from "./config"
import { assignDuoTrial } from "./trial"

/**
 * Better Auth Configuration — OTP-only (sem senha)
 * 
 * Autenticação exclusivamente via código OTP enviado por email.
 * 
 * Arquitetura simplificada:
 * - Better Auth fornece 3 tipos nativos: "sign-in", "email-verification", "forget-password"
 * - Mapeamos ações customizadas para esses tipos (ex: delete account → forget-password)
 * - Templates de email condicionais baseados no tipo
 * - Better Auth gerencia toda segurança (OTP hashing, validação, expiração, rate limit)
 * 
 * Segurança (checklist OWASP):
 * - ✅ Respostas genéricas (não vaza se email existe)
 * - ✅ Rate limiting por IP (global + customizado por rota)
 * - ✅ TTL curto de 5 min para OTP
 * - ✅ Máximo 3 tentativas por OTP antes de invalidar
 * - ✅ await email send com catch (compatível com serverless)
 * - ✅ Sessões seguras (HttpOnly, SameSite, Secure em prod)
 * - ✅ Rotação de sessão automática (a cada 24h)
 * - ✅ CSRF protection ativo (Origin + Fetch Metadata)
 * - ✅ OTP armazenado com hash bcrypt no banco
 * 
 * @see https://better-auth.com/docs/plugins/email-otp
 * @see https://better-auth.com/docs/reference/security
 */

export const auth = betterAuth({
    // App configuration
    secret: BETTER_AUTH_SECRET,
    appName: SITE_NAME_FULL,
    baseURL: SITE_URL,

    // Database adapter - usa nome do MODEL do Prisma (não tabela)
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    // Hook: atribuir trial do plano Duo automaticamente ao criar usuário
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Verifica se o email já usou trial antes (ex: recriação de conta)
                    // O campo trialUsed é false por default, mas verificamos por segurança
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: user.id },
                            select: { trialUsed: true },
                        });
                        if (dbUser && !dbUser.trialUsed) {
                            await assignDuoTrial(user.id);
                        }
                    } catch (error) {
                        console.error('[Auth] Erro ao atribuir trial no signup:', error);
                    }
                },
            },
        },
    },

    // Senha desabilitada — autenticação exclusivamente via OTP
    emailAndPassword: {
        enabled: false,
    },

    // Plugins
    plugins: [
        emailOTP({
            // Envia o OTP por email — resposta genérica para não vazar existência de conta
            async sendVerificationOTP({ email, otp, type }) {
                // Subject maps para os 3 tipos nativos do Better Auth
                const subjectMap: Record<string, string> = {
                    "sign-in": `Seu código de acesso - ${SITE_NAME_FULL}`,
                    "email-verification": `Verifique seu email - ${SITE_NAME_FULL}`,
                    "forget-password": `Código de verificação - ${SITE_NAME_FULL}`,
                }

                // Deve ser await para garantir envio em ambiente serverless (Vercel)
                // Better Auth já retorna resposta genérica independente do resultado,
                // então não há risco de timing attack por email existence leak
                try {
                    await sendEmail({
                        to: email,
                        subject: subjectMap[type] || `Código de verificação - ${SITE_NAME_FULL}`,
                        html: getOTPEmailTemplate(otp, type, SITE_URL),
                    })
                } catch (error) {
                    console.error('[Auth] Falha ao enviar OTP:', error)
                    // Não relança — Better Auth retorna sucesso genérico de qualquer forma
                }
            },
            // Tamanho do OTP: 6 dígitos
            otpLength: 6,
            // TTL curto: 5 minutos
            expiresIn: 300,
            // Máximo 3 tentativas antes de invalidar o OTP (bloqueio progressivo)
            allowedAttempts: 3,
            // Armazena OTP com hash no banco (segurança em caso de leak do DB)
            storeOTP: "hashed",
            // Auto-registra usuário no primeiro login via OTP
            disableSignUp: false,
            // Envia OTP de verificação no signup
            sendVerificationOnSignUp: false,
        }),
        // Next.js cookie integration — garante que Set-Cookie headers de
        // session refresh sejam propagados corretamente via cookies() do Next.js.
        // Sem este plugin, sessões expiram no browser mesmo que o DB as renove,
        // causando redirect inesperado para /login em Server Components.
        nextCookies(),
    ],

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 dias
        updateAge: 60 * 60 * 24, // Rotação de sessão a cada 24h
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutos — NÃO confundir com duração da sessão!
            // cookieCache é um cache de leitura para evitar DB hit em cada getSession().
            // Após maxAge, o servidor re-valida no banco. Valor alto = sessão revogada
            // continua ativa até expirar o cache. 5 min é o default recomendado.
            strategy: "compact", // Menor tamanho (Base64url + HMAC)
        },
    },

    // User configuration
    user: {
        additionalFields: {
            planId: {
                type: "string",
                required: false,
            },
            maxScreens: {
                type: "number",
                required: false,
                defaultValue: 1,
            },
            trialEndsAt: {
                type: "date",
                required: false,
            },
            trialUsed: {
                type: "boolean",
                required: false,
                defaultValue: false,
            },
            avatarIcon: {
                type: "string",
                required: false,
                defaultValue: "user",
            },
            avatarColor: {
                type: "string",
                required: false,
                defaultValue: "red",
            },
        },
        // Email change habilitado
        changeEmail: {
            enabled: true,
        },
        // Delete user desabilitado (requer confirmação)
        deleteUser: {
            enabled: false,
        },
    },

    // Account linking
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"], // OAuth providers confiáveis
        },
    },

    // Security configuration
    advanced: {
        // CSRF protection ativo (NUNCA desabilitar em produção)
        disableCSRFCheck: false,

        // Cookies seguros em produção (HttpOnly + SameSite=Lax padrão do Better Auth)
        useSecureCookies: process.env.NODE_ENV === "production",

        // Cross subdomain cookies (ex: app.allflix.dev e api.allflix.dev)
        crossSubDomainCookies: {
            enabled: false, // Ativar apenas se necessário
        },

        // IP address tracking para rate limiting e segurança
        ipAddress: {
            ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
        },
    },

    // Rate limiting global (previne brute force por IP)
    rateLimit: {
        enabled: true,
        window: 60, // 1 minuto
        max: 10, // 10 requests por minuto (rotas sem regra customizada)

        // "database" persiste contadores de rate limit no banco (funciona em serverless/multi-instance)
        // Em dev local, o overhead é negligível. Para alta escala, considerar "secondary-storage" (Redis).
        storage: "database",

        // Regras customizadas: rotas sensíveis restritivas, rotas passivas permissivas
        customRules: {
            // Envio de OTP — restritivo (previne brute force)
            "/email-otp/send-verification-otp": {
                window: 60,
                max: 5, // Apenas 5 OTPs por minuto por IP
            },
            // Login com OTP — restritivo (previne brute force)
            "/sign-in/email-otp": {
                window: 60,
                max: 10,
            },
            // get-session — permissivo (chamado automaticamente por useSession,
            // troca de aba, navegação, etc. — é read-only e usa cookie cache)
            "/get-session": {
                window: 60,
                max: 100,
            },
        },
    },

    // Trusted origins para CORS
    trustedOrigins: [SITE_URL],
})

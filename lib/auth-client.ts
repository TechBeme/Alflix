import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"
import { SITE_URL } from "./seo"

/**
 * Better Auth Client — OTP-only
 * 
 * Cliente configurado com emailOTPClient para autenticação via código OTP.
 * 
 * Features:
 * - useSession() hook nativo (otimizado com Nanostores)
 * - Cache compartilhado entre componentes
 * - Cross-tab synchronization
 * - Deduplicação de requests (evita múltiplas chamadas simultâneas)
 * - signIn.emailOtp() para login com OTP
 * - emailOtp.sendVerificationOtp() para envio de código
 * 
 * @see https://better-auth.com/docs
 */
export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined"
        ? window.location.origin
        : SITE_URL,
    fetchOptions: {
        credentials: 'include',
    },
    plugins: [
        emailOTPClient(),
    ],
})

/**
 * Type exports para uso em toda aplicação
 * Inferidos automaticamente do servidor
 */
export type Session = typeof authClient.$Infer.Session
export type User = Session['user']

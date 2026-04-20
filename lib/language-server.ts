/**
 * Language Server-Side Utilities
 * 
 * Funções que dependem de Prisma/banco de dados (só podem ser usadas em Server Components)
 * Para funções puras (client-safe), use @/lib/language
 */

import { parseAcceptLanguage, localeToTMDB } from '@/lib/language';
import { cookies } from 'next/headers';

/**
 * Obtém o idioma do usuário autenticado ou detecta do navegador
 * 
 * ⚠️ SERVER-ONLY: Usa Prisma, não pode ser usado em Client Components
 * 
 * Ordem de prioridade:
 * 1. UserPreferences.language (usuário autenticado no banco)
 * 2. NEXT_LOCALE cookie (explicitamente selecionado pelo usuário via navbar)
 * 3. Accept-Language header (detectado do navegador)
 * 
 * @param userId - ID do usuário (se autenticado)
 * @param acceptLanguageHeader - Header Accept-Language
 * @returns Código de idioma TMDB
 */
export async function getUserLanguage(
    userId: string | null | undefined,
    acceptLanguageHeader: string | null
): Promise<string> {
    // 1. Usuário autenticado: buscar preferências do banco
    if (userId) {
        try {
            const { prisma } = await import('@/lib/prisma');
            const preferences = await prisma.userPreferences.findUnique({
                where: { userId },
                select: { language: true },
            });

            if (preferences?.language) {
                return preferences.language;
            }
        } catch (error) {
            console.error('[Language Detection] Error fetching user preferences:', error);
        }
    }

    // 2. Cookie NEXT_LOCALE: idioma explicitamente selecionado pelo usuário na navbar
    try {
        const cookieStore = await cookies();
        const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
        if (localeCookie) {
            return localeToTMDB(localeCookie);
        }
    } catch {
        // cookies() may throw in some contexts — ignore
    }

    // 3. Visitante: detectar idioma do navegador
    return parseAcceptLanguage(acceptLanguageHeader);
}

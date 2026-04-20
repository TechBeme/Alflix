'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export interface UseAuthReturn {
    user: NonNullable<ReturnType<typeof authClient.useSession>['data']>['user'] | null;
    session: NonNullable<ReturnType<typeof authClient.useSession>['data']>['session'] | null;
    loading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar autenticação usando Better Auth nativo
 * 
 * Usa o hook nativo `useSession()` do Better Auth para gerenciar estado de autenticação.
 * Isso garante:
 * - Cache automático e otimizado
 * - Sincronização entre abas/janelas
 * - Reatividade em tempo real
 * - Performance máxima
 * 
 * @param redirectOnUnauthenticated - Se true, redireciona para /login quando não autenticado
 * @returns Objeto com user, session, loading, isAuthenticated e funções de controle
 * 
 * @example
 * ```tsx
 * const { user, loading, logout } = useAuth(true);
 * 
 * if (loading) return <LoadingSpinner />;
 * if (!user) return null;
 * 
 * return <div>Bem-vindo, {user.name}</div>
 * ```
 */
export function useAuth(redirectOnUnauthenticated: boolean = false): UseAuthReturn {
    const router = useRouter();

    // Usa o hook nativo do Better Auth (otimizado com Nanostores)
    const { data, isPending, refetch } = authClient.useSession();

    const user = data?.user || null;
    const session = data?.session || null;
    const isAuthenticated = !!user;

    /**
     * Faz logout do usuário
     */
    const logout = useCallback(async (): Promise<void> => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // Limpa cache local
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('auth_user_state');
                            localStorage.removeItem('navbar_user_state');
                            // Força redirecionamento completo para landing page
                            window.location.href = '/';
                        }
                    },
                },
            });
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }, []);

    /**
     * Redireciona para login se não autenticado
     */
    if (redirectOnUnauthenticated && !isPending && !isAuthenticated) {
        router.push('/login');
    }

    return {
        user,
        session,
        loading: isPending,
        isAuthenticated,
        logout,
        refetch,
    };
}

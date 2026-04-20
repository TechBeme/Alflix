import { Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import Navbar from './Navbar';
import type { Session } from '@/lib/auth-client';

/**
 * Navbar Wrapper - Server Component
 * 
 * Busca a sessão no servidor (SSR) e passa para a Navbar como prop inicial.
 * Isso elimina o "flash" de loading, pois a Navbar já renderiza com o estado correto.
 * 
 * Fluxo:
 * 1. Server Component busca sessão (auth.api.getSession)
 * 2. Passa sessão inicial para Navbar (Client Component)
 * 3. Navbar usa useSession() com initialCache para hidratação suave
 * 4. useSession() mantém sincronizado com cache/servidor + cross-tab sync
 * 
 * Nota: Suspense é necessário pois Navbar usa useSearchParams().
 * Sem Suspense, Next.js pode forçar re-render client-side da árvore inteira,
 * causando flash/flicker em produção (Vercel).
 * 
 * Benefícios:
 * - Zero flash de conteúdo não autenticado (SSR)
 * - Cross-tab sync automático (via useSession)
 * - Cache compartilhado entre componentes
 * - 1 única query (sem redundância)
 */
export default async function NavbarWrapper() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <Suspense>
            <Navbar initialSession={session} />
        </Suspense>
    );
}

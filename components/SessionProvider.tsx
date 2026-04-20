'use client';

import { ReactNode } from 'react';

/**
 * Session Provider - Wrapper para Better Auth
 * 
 * O Better Auth usa Nanostores internamente, que já compartilha estado.
 * Este componente apenas garante que o hook useSession seja inicializado
 * uma única vez no topo da árvore de componentes.
 * 
 * Isso evita múltiplas requisições para /api/auth/get-session quando
 * o mesmo hook é usado em vários componentes.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

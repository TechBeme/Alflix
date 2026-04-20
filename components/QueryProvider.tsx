'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Dados ficam "fresh" por 1 minuto
                        staleTime: 60 * 1000,
                        // Cache mantido por 5 minutos após não ser usado
                        gcTime: 5 * 60 * 1000,
                        // Tentar 3 vezes em caso de erro
                        retry: 3,
                        // Não refetch ao voltar para a janela (evita requisições desnecessárias)
                        refetchOnWindowFocus: false,
                        // Não refetch ao reconectar (já temos retry)
                        refetchOnReconnect: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

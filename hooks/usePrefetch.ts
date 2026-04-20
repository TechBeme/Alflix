'use client';

import { useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';

/**
 * Hook customizado para prefetch com delay
 * 
 * Evita prefetches desnecessários quando o usuário está fazendo scroll rápido.
 * Só faz o prefetch se o mouse ficar sobre o elemento por um tempo mínimo.
 * 
 * @param url - URL para fazer prefetch
 * @param delay - Delay em ms antes de fazer prefetch (padrão: 300ms)
 * @returns Objeto com handleMouseEnter e handleMouseLeave
 */
export function usePrefetch(url: string, delay: number = 300) {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
        // Limpa qualquer timeout anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Inicia novo timeout para prefetch
        timeoutRef.current = setTimeout(() => {
            router.prefetch(url);
        }, delay);
    }, [router, url, delay]);

    const handleMouseLeave = useCallback(() => {
        // Cancela o prefetch se o mouse sair antes do delay
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return {
        handleMouseEnter,
        handleMouseLeave,
    };
}

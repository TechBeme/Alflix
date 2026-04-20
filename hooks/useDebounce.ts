import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para debounce de funções (limitar chamadas)
 * Útil para auto-save, search, etc.
 * 
 * @example
 * const debouncedSave = useDebounce(saveProgress, 2000);
 * debouncedSave(data);
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Manter callback atualizado
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            // Cancelar timeout anterior
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Criar novo timeout
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    );
}

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar a watchlist do usuário
 * 
 * Features:
 * - Adicionar/remover itens da watchlist
 * - Verificar se um item está na watchlist
 * - Listar todos os itens da watchlist
 * - Cache otimizado para evitar múltiplas requisições
 * 
 * @example
 * ```tsx
 * const { isInWatchlist, toggleWatchlist, loading } = useWatchlist(12345, 'movie');
 * 
 * <button onClick={toggleWatchlist}>
 *   {isInWatchlist ? 'Remover' : 'Adicionar'}
 * </button>
 * ```
 */

interface UseWatchlistOptions {
    /** Carregar automaticamente o estado inicial */
    autoLoad?: boolean;
}

interface WatchlistItem {
    id: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    addedAt: string;
}

export function useWatchlist(
    tmdbId?: number,
    mediaType?: 'movie' | 'tv',
    options: UseWatchlistOptions = { autoLoad: true }
) {
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    /**
     * Carrega a watchlist completa do usuário
     */
    const loadWatchlist = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/watchlist');

            if (!response.ok) {
                throw new Error('Erro ao carregar watchlist');
            }

            const data = await response.json();

            if (data.success) {
                setWatchlist(data.data || []);

                // Se tmdbId foi fornecido, verificar se está na lista
                if (tmdbId && mediaType) {
                    const isInList = data.data.some(
                        (item: WatchlistItem) =>
                            item.mediaId === tmdbId && item.mediaType === mediaType
                    );
                    setIsInWatchlist(isInList);
                }
            }
        } catch (error) {
            console.error('Error loading watchlist:', error);
        } finally {
            setLoading(false);
        }
    }, [tmdbId, mediaType]);

    /**
     * Adiciona um item à watchlist
     */
    const addToWatchlist = useCallback(
        async (id: number, type: 'movie' | 'tv') => {
            setLoading(true);
            try {
                const response = await fetch('/api/watchlist/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tmdbId: id,
                        mediaType: type,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao adicionar');
                }

                setIsInWatchlist(true);

                // Recarregar watchlist para manter cache sincronizado
                await loadWatchlist();

                return { success: true };
            } catch (error) {
                console.error('Error adding to watchlist:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                };
            } finally {
                setLoading(false);
            }
        },
        [loadWatchlist]
    );

    /**
     * Remove um item da watchlist
     */
    const removeFromWatchlist = useCallback(
        async (id: number, type: 'movie' | 'tv') => {
            setLoading(true);
            try {
                const response = await fetch('/api/watchlist/remove', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tmdbId: id,
                        mediaType: type,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Erro ao remover');
                }

                setIsInWatchlist(false);

                // Recarregar watchlist para manter cache sincronizado
                await loadWatchlist();

                return { success: true };
            } catch (error) {
                console.error('Error removing from watchlist:', error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                };
            } finally {
                setLoading(false);
            }
        },
        [loadWatchlist]
    );

    /**
     * Alterna o estado de favorito (adiciona ou remove)
     */
    const toggleWatchlist = useCallback(async () => {
        if (!tmdbId || !mediaType) {
            console.error('tmdbId and mediaType are required for toggle');
            return { success: false, error: 'Missing parameters' };
        }

        if (isInWatchlist) {
            return await removeFromWatchlist(tmdbId, mediaType);
        } else {
            return await addToWatchlist(tmdbId, mediaType);
        }
    }, [tmdbId, mediaType, isInWatchlist, addToWatchlist, removeFromWatchlist]);

    // Carregar watchlist automaticamente
    useEffect(() => {
        if (options.autoLoad) {
            loadWatchlist();
        }
    }, [loadWatchlist, options.autoLoad]);

    return {
        /** Se o item atual está na watchlist */
        isInWatchlist,

        /** Lista completa da watchlist */
        watchlist,

        /** Se está carregando */
        loading,

        /** Adicionar à watchlist */
        addToWatchlist,

        /** Remover da watchlist */
        removeFromWatchlist,

        /** Alternar estado (add/remove) */
        toggleWatchlist,

        /** Recarregar watchlist */
        reload: loadWatchlist,
    };
}

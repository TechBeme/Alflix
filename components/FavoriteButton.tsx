'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { COLORS } from '@/lib/theme';

/**
 * FavoriteButton - Botão de favoritar/desfavoritar reutilizável
 * 
 * Características:
 * - Animação Plus/Check
 * - Estados: normal, hover, favorited
 * - Integração com API de watchlist
 * - Feedback visual e toast notifications
 * - Loading state durante requisições
 * - Suporta variantes de tamanho
 * - Sincronização global via eventos customizados
 * 
 * @example
 * ```tsx
 * <FavoriteButton
 *   tmdbId={12345}
 *   mediaType="movie"
 *   initialFavorited={false}
 *   size="md"
 * />
 * ```
 */

// Evento customizado para sincronização entre componentes
const WATCHLIST_EVENT = 'watchlist-change';

interface WatchlistChangeEvent {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    isFavorited: boolean;
}

// Helper para emitir eventos de mudança na watchlist
const emitWatchlistChange = (data: WatchlistChangeEvent) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(WATCHLIST_EVENT, { detail: data }));
    }
};

export interface FavoriteButtonProps {
    /** ID do filme/série no TMDB */
    tmdbId: number;

    /** Tipo de mídia */
    mediaType: 'movie' | 'tv';

    /** Estado inicial (se já está nos favoritos) */
    initialFavorited?: boolean;

    /** Tamanho do botão */
    size?: 'sm' | 'md' | 'lg';

    /** Classe CSS adicional */
    className?: string;

    /** Callback quando o estado muda */
    onToggle?: (favorited: boolean) => void;

    /** Mostrar apenas o ícone (sem fundo circular) */
    iconOnly?: boolean;

    /** Ícone customizado (substitui o coração) */
    customIcon?: React.ReactNode;

    /** Desabilitar toast notifications */
    silent?: boolean;
}

export default function FavoriteButton({
    tmdbId,
    mediaType,
    initialFavorited = false,
    size = 'md',
    className,
    onToggle,
    iconOnly = false,
    customIcon,
    silent = false,
}: FavoriteButtonProps) {
    const t = useTranslations('media');
    const tc = useTranslations('common');
    const [isFavorited, setIsFavorited] = useState(initialFavorited);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Atualizar estado quando prop mudar
    useEffect(() => {
        setIsFavorited(initialFavorited);
    }, [initialFavorited]);

    // Escutar eventos de mudança de outros FavoriteButtons para sincronização global
    useEffect(() => {
        const handleWatchlistChange = (event: Event) => {
            const customEvent = event as CustomEvent<WatchlistChangeEvent>;
            const { tmdbId: eventTmdbId, mediaType: eventMediaType, isFavorited: eventIsFavorited } = customEvent.detail;

            // Se o evento é para este mesmo item, atualizar estado
            if (eventTmdbId === tmdbId && eventMediaType === mediaType) {
                setIsFavorited(eventIsFavorited);
            }
        };

        window.addEventListener(WATCHLIST_EVENT, handleWatchlistChange);
        return () => {
            window.removeEventListener(WATCHLIST_EVENT, handleWatchlistChange);
        };
    }, [tmdbId, mediaType]);

    // Tamanhos do ícone e botão
    const sizes = {
        sm: {
            icon: 'w-4 h-4',
            button: 'w-8 h-8',
            padding: 'p-1.5',
        },
        md: {
            icon: 'w-5 h-5',
            button: 'w-10 h-10',
            padding: 'p-2',
        },
        lg: {
            icon: 'w-6 h-6',
            button: 'w-12 h-12',
            padding: 'p-2.5',
        },
    };

    const handleToggle = useCallback(async (e: React.MouseEvent) => {
        // Prevenir propagação para não acionar cliques em cards pai
        e.stopPropagation();
        e.preventDefault();

        if (isLoading) return;

        // Optimistic update - muda o estado imediatamente
        const previousState = isFavorited;
        const newFavorited = !isFavorited;
        setIsFavorited(newFavorited);
        setIsLoading(true);

        // Emitir evento para sincronizar outros botões IMEDIATAMENTE (optimistic)
        emitWatchlistChange({ tmdbId, mediaType, isFavorited: newFavorited });

        try {
            const endpoint = previousState ? '/api/watchlist/remove' : '/api/watchlist/add';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tmdbId,
                    mediaType,
                }),
            });

            if (!response.ok) {
                // Reverter estado em caso de erro
                setIsFavorited(previousState);
                // Reverter evento global também
                emitWatchlistChange({ tmdbId, mediaType, isFavorited: previousState });

                // Tratamento de erros específicos
                if (response.status === 401) {
                    if (!silent) {
                        toast.error(t('loginToAdd'));
                    }
                    setTimeout(() => {
                        window.location.href = `/login?redirect=${window.location.pathname}`;
                    }, 1000);
                    return;
                }

                // Tentar ler erro do JSON (se houver corpo)
                let errorMessage = t('errorUpdateList');
                try {
                    const data = await response.json();
                    errorMessage = data.error || errorMessage;
                } catch {
                    // Ignorar erro de parse se não houver JSON
                }

                throw new Error(errorMessage);
            }

            // Sucesso (204 No Content ou outro status de sucesso)
            // Callback opcional
            onToggle?.(newFavorited);

        } catch (error) {
            // Reverter estado em caso de erro
            setIsFavorited(previousState);
            // Reverter evento global também
            emitWatchlistChange({ tmdbId, mediaType, isFavorited: previousState });

            console.error(tc('errorTogglingFavorite'), error);
            if (!silent) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : t('errorUpdateList')
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, isFavorited, tmdbId, mediaType, onToggle, silent]);

    // Renderização apenas do ícone (para uso em overlays)
    if (iconOnly) {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    'relative transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    className
                )}
                title={isFavorited ? t('removeFromList') : t('addToList')}
                aria-label={isFavorited ? t('removeFromList') : t('addToList')}
            >
                <motion.div
                    animate={{
                        scale: isHovered ? 1.2 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <AnimatePresence mode="wait">
                        {isFavorited ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.3, type: "spring" }}
                            >
                                <Check
                                    className={cn(sizes[size].icon)}
                                    style={{ color: 'white' }}
                                    aria-hidden="true"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="plus"
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: -180 }}
                                transition={{ duration: 0.3, type: "spring" }}
                            >
                                <Plus
                                    className={cn(sizes[size].icon)}
                                    style={{ color: 'white' }}
                                    aria-hidden="true"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </button>
        );
    }

    // Renderização completa com botão circular
    return (
        <motion.button
            onClick={handleToggle}
            disabled={isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                'relative rounded-full flex items-center justify-center',
                'transition-all duration-200',
                'border border-white/20',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                sizes[size].button,
                sizes[size].padding,
                isFavorited
                    ? 'bg-black/60 border-white/40'
                    : 'bg-black/60 hover:bg-black/80',
                className
            )}
            title={isFavorited ? t('removeFromList') : t('addToList')}
            aria-label={isFavorited ? t('removeFromList') : t('addToList')}
        >
            {/* Icon com animação Plus/Check */}
            <AnimatePresence mode="wait">
                {customIcon ? (
                    <motion.div
                        key="custom"
                        className={cn(sizes[size].icon, 'relative z-10')}
                        style={{ color: 'white' }}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, type: "spring" }}
                    >
                        {customIcon}
                    </motion.div>
                ) : isFavorited ? (
                    <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="relative z-10"
                    >
                        <Check
                            className={cn(sizes[size].icon)}
                            style={{ color: 'white' }}
                            aria-hidden="true"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="plus"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -180 }}
                        transition={{ duration: 0.3, type: "spring" }}
                        className="relative z-10"
                    >
                        <Plus
                            className={cn(sizes[size].icon)}
                            style={{ color: 'white' }}
                            aria-hidden="true"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
// Exportar helper para uso em outros componentes que precisem escutar mudanças
export { WATCHLIST_EVENT, emitWatchlistChange };
export type { WatchlistChangeEvent };
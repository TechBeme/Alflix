'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, Trash2, Film, Tv } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getPosterSmallUrl } from '@/lib/image-utils';
import { COLORS, GRADIENTS } from '@/lib/theme';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';

interface WatchHistoryItem {
    id: string;
    tmdbId: number;
    mediaType: string;
    seasonNumber: number;
    episodeNumber: number;
    progress: number;
    lastWatchedAt: string;
    title?: string;
    posterPath?: string;
}

interface WatchHistoryResponse {
    history: WatchHistoryItem[];
}

/**
 * HistorySection - Seção de Histórico de Visualizações
 * 
 * ✅ PADRÃO EMPRESARIAL: Usa React Query para:
 * - Cache automático e deduplicação de requisições
 * - Retry automático em caso de falha
 * - Invalidação de cache após mutações
 * - Loading/Error states gerenciados
 * - Prevenção de race conditions
 * - Refetch inteligente (on focus, on reconnect)
 */
export default function HistorySection() {
    const [showClearDialog, setShowClearDialog] = useState(false);
    const queryClient = useQueryClient();
    const t = useTranslations('settingsHistory');
    const tA11y = useTranslations('a11y');
    const tc = useTranslations('common');
    const locale = useLocale();

    // ✅ QUERY: Buscar histórico com React Query
    const {
        data,
        isLoading,
        error,
    } = useQuery<WatchHistoryResponse>({
        queryKey: ['watch-history'],
        queryFn: async () => {
            const response = await fetch('/api/watch-history');
            if (!response.ok) {
                throw new Error(t('fetchError'));
            }
            return response.json();
        },
        staleTime: 1000 * 30, // 30 segundos - dados ficam frescos por pouco tempo
        gcTime: 1000 * 60 * 10, // 10 minutos - mantém cache
        retry: 2, // Tenta 2x antes de falhar
        refetchOnWindowFocus: true, // Refetch ao voltar para a tab
        refetchOnMount: true, // SEMPRE refetch ao montar (garante dados atualizados)
    });

    const history = data?.history || [];

    // ✅ MUTATION: Deletar item individual (com season/episode para séries)
    const deleteMutation = useMutation({
        mutationFn: async ({ tmdbId, mediaType, seasonNumber, episodeNumber }: { tmdbId: number; mediaType: string; seasonNumber: number; episodeNumber: number }) => {
            let url = `/api/watch-history?tmdbId=${tmdbId}&mediaType=${mediaType}`;
            if (mediaType === 'tv' && seasonNumber > 0) {
                url += `&seasonNumber=${seasonNumber}&episodeNumber=${episodeNumber}`;
            }
            const response = await fetch(url, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(t('removeError'));
            }

            // 204 No Content - sem corpo
            return;
        },
        onMutate: async ({ tmdbId, mediaType, seasonNumber, episodeNumber }) => {
            // ✅ OPTIMISTIC UPDATE: Remove imediatamente da UI
            await queryClient.cancelQueries({ queryKey: ['watch-history'] });

            const previousData = queryClient.getQueryData<WatchHistoryResponse>(['watch-history']);

            queryClient.setQueryData<WatchHistoryResponse>(['watch-history'], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    history: old.history.filter(
                        item => !(item.tmdbId === tmdbId && item.mediaType === mediaType && item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber)
                    ),
                };
            });

            return { previousData };
        },
        onError: (error, variables, context) => {
            // ✅ ROLLBACK: Reverte em caso de erro
            if (context?.previousData) {
                queryClient.setQueryData(['watch-history'], context.previousData);
            }
            toast.error(t('removeHistoryError'));
        },
        onSuccess: () => {
            // Optimistic update já remove da UI - sem toast necessário
            // ✅ REFETCH IMEDIATO: Garante sincronização imediata com servidor
            queryClient.refetchQueries({ queryKey: ['watch-history'] });
        },
    });

    // ✅ MUTATION: Limpar todo o histórico
    const clearAllMutation = useMutation({
        mutationFn: async (items: WatchHistoryItem[]) => {
            // Deduplicar por tmdbId+mediaType (séries podem ter múltiplos episódios)
            const uniqueKeys = new Map<string, { tmdbId: number; mediaType: string }>();
            for (const item of items) {
                const key = `${item.tmdbId}-${item.mediaType}`;
                if (!uniqueKeys.has(key)) {
                    uniqueKeys.set(key, { tmdbId: item.tmdbId, mediaType: item.mediaType });
                }
            }

            const results = await Promise.allSettled(
                Array.from(uniqueKeys.values()).map(({ tmdbId, mediaType }) =>
                    fetch(`/api/watch-history?tmdbId=${tmdbId}&mediaType=${mediaType}`, {
                        method: 'DELETE',
                    })
                )
            );

            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                throw new Error(t('deleteFailCount', { count: failed.length }));
            }

            return results;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['watch-history'] });

            const previousData = queryClient.getQueryData<WatchHistoryResponse>(['watch-history']);

            queryClient.setQueryData<WatchHistoryResponse>(['watch-history'], {
                history: [],
            });

            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['watch-history'], context.previousData);
            }
            toast.error(t('clearError'));
        },
        onSuccess: () => {
            toast.success(t('clearSuccess'));
            setShowClearDialog(false);
            // ✅ REFETCH IMEDIATO: Garante sincronização imediata com servidor
            queryClient.refetchQueries({ queryKey: ['watch-history'] });
        },
    });

    const handleDelete = (item: WatchHistoryItem) => {
        deleteMutation.mutate({ tmdbId: item.tmdbId, mediaType: item.mediaType, seasonNumber: item.seasonNumber, episodeNumber: item.episodeNumber });
    };

    const handleClearAll = () => {
        clearAllMutation.mutate(history);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
                            <p className="text-sm text-gray-400">
                                {isLoading ? t('loading') : `${history.length} ${history.length === 1 ? t('item') : t('items')}`}
                            </p>
                        </div>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={() => setShowClearDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('clearAll')}</span>
                            <span className="sr-only sm:hidden">{t('clearAll')}</span>
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <History className="w-12 h-12 text-red-400/20 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-red-400 font-medium">{t('loadError')}</p>
                        <p className="text-gray-500 text-sm mt-1">{t('tryAgainLater')}</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <History className="w-12 h-12 text-white/10 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-gray-400 font-medium">{t('noItems')}</p>
                        <p className="text-gray-500 text-sm mt-1">{t('noItemsDesc')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {history.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                            >
                                {/* Poster */}
                                <div className="w-14 h-20 rounded-lg overflow-hidden bg-white/[0.06] shrink-0 relative">
                                    {item.posterPath ? (
                                        <OptimizedImage
                                            src={getPosterSmallUrl(item.posterPath)}
                                            alt={item.title || ''}
                                            fill
                                            className="object-cover"
                                            sizes="56px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {item.mediaType === 'movie' ? (
                                                <Film className="w-5 h-5 text-white/20" aria-hidden="true" />
                                            ) : (
                                                <Tv className="w-5 h-5 text-white/20" aria-hidden="true" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">{item.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500 capitalize">
                                            {item.mediaType === 'movie' ? t('movie') : t('series')}
                                        </span>
                                        {item.mediaType === 'tv' && item.seasonNumber > 0 && (
                                            <>
                                                <span className="text-xs text-gray-600">•</span>
                                                <span className="text-xs font-medium" style={{ color: COLORS.primary }}>
                                                    {tA11y('seasonEpisode', { season: item.seasonNumber, episode: item.episodeNumber })}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">{formatDate(item.lastWatchedAt)}</span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <div
                                            className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"
                                            role="progressbar"
                                            aria-valuenow={Math.round(item.progress)}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(100, item.progress)}%`,
                                                    backgroundColor: item.progress >= 90 ? '#22c55e' : COLORS.primary,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-medium">
                                            {Math.round(item.progress)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(item)}
                                    disabled={deleteMutation.isPending}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:opacity-100"
                                    title={t('removeFromHistory')}
                                    aria-label={t('removeFromHistory')}
                                >
                                    {deleteMutation.isPending ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={showClearDialog}
                onOpenChange={(open) => !clearAllMutation.isPending && setShowClearDialog(open)}
                title={t('clearHistory')}
                message={t('clearHistoryDesc')}
                confirmText={clearAllMutation.isPending ? t('clearing') : t('clearAll')}
                cancelText={tc('cancel')}
                onConfirm={handleClearAll}
                loading={clearAllMutation.isPending}
            />
        </div>
    );
}

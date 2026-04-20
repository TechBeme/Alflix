'use client';

import { useState, useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useWatchlistInfinite, type WatchlistPage } from './useWatchlistInfinite';
import MediaTypeFilter, { type MediaType } from '@/components/MediaTypeFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import InfiniteGrid from '@/components/InfiniteGrid';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useTranslations } from 'next-intl';

interface MyListClientProps {
    userId: string;
}

function removeItemFromWatchlistData(
    oldData: InfiniteData<WatchlistPage> | undefined,
    mediaId: number,
    mediaType: 'movie' | 'tv'
) {
    if (!oldData) return oldData;

    const removedCount = oldData.pages.reduce((count, page) => (
        count + page.items.filter((item) => item.mediaId === mediaId && item.mediaType === mediaType).length
    ), 0);

    if (removedCount === 0) return oldData;

    return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter(
                (item) => !(item.mediaId === mediaId && item.mediaType === mediaType)
            ),
            total: Math.max(0, page.total - removedCount),
        })),
    };
}

/**
 * MyListClient - Cliente CSR para Watchlist com Scroll Infinito
 * 
 * Features:
 * - CSR puro (sempre busca dados frescos)
 * - Refetch automático ao voltar para página
 * - Filtro local inteligente quando a lista "all" está completa
 * - Remoção otimista de itens
 * - Infinite scroll com TanStack Query
 */

export default function MyListClient({ userId }: MyListClientProps) {
    const t = useTranslations('myListPage');
    const tc = useTranslations('common');
    const tl = useTranslations('myList');
    const [filter, setFilter] = useState<MediaType>('all');

    // Hook de scroll to top
    const [showScrollTop, scrollToTop] = useScrollToTop(500);

    // QueryClient para atualização otimista
    const queryClient = useQueryClient();

    // Query base: sempre carrega "all"
    const {
        data: allData,
        fetchNextPage: fetchNextAllPage,
        isFetchingNextPage: isFetchingNextAllPage,
        isLoading: isAllLoading,
        isError: isAllError,
        error: allError,
        refetch: refetchAll,
    } = useWatchlistInfinite({
        userId,
        filter: 'all',
        fallbackErrorMessage: tl('watchlistLoadFailed'),
    });

    const allItems = allData?.pages.flatMap((page) => page.items) ?? [];
    const allTotalCount = allData?.pages[0]?.total ?? 0;
    const isAllComplete = !!allData && allItems.length >= allTotalCount;
    const allCanLoadMore = allItems.length < allTotalCount;

    // Query de filtro específico só é habilitada quando "all" ainda não terminou
    const specificFilter: 'movie' | 'tv' = filter === 'tv' ? 'tv' : 'movie';
    const shouldFetchSpecificFilter = filter !== 'all' && !isAllComplete;
    const shouldFilterLocally = filter !== 'all' && isAllComplete;

    const {
        data: filteredData,
        fetchNextPage: fetchNextFilteredPage,
        isFetchingNextPage: isFetchingNextFilteredPage,
        isLoading: isFilteredLoading,
        isError: isFilteredError,
        error: filteredError,
        refetch: refetchFiltered,
    } = useWatchlistInfinite({
        userId,
        filter: specificFilter,
        enabled: shouldFetchSpecificFilter,
        fallbackErrorMessage: tl('watchlistLoadFailed'),
    });

    const filteredItemsFromApi = filteredData?.pages.flatMap((page) => page.items) ?? [];
    const filteredTotalCountFromApi = filteredData?.pages[0]?.total ?? 0;
    const filteredCanLoadMore = filteredItemsFromApi.length < filteredTotalCountFromApi;

    const displayedItems = filter === 'all'
        ? allItems
        : shouldFilterLocally
            ? allItems.filter((item) => item.mediaType === filter)
            : filteredItemsFromApi;

    const totalCount = filter === 'all'
        ? allTotalCount
        : shouldFilterLocally
            ? displayedItems.length
            : filteredTotalCountFromApi;

    const hasNextPage = filter === 'all'
        ? allCanLoadMore
        : shouldFilterLocally
            ? false
            : filteredCanLoadMore;

    const isFetchingNextPage = filter === 'all'
        ? isFetchingNextAllPage
        : shouldFilterLocally
            ? false
            : isFetchingNextFilteredPage;

    const isGridLoading = filter === 'all'
        ? isAllLoading && !allData
        : shouldFilterLocally
            ? false
            : isFilteredLoading && !filteredData;

    const shouldShowError = filter === 'all'
        ? isAllError && displayedItems.length === 0
        : !shouldFilterLocally && isFilteredError && displayedItems.length === 0;

    const refetch = filter === 'all' || shouldFilterLocally ? refetchAll : refetchFiltered;

    // Adicionar inWatchlist: true em todos os itens (todos est\u00e3o na watchlist)
    const displayedItemsWithWatchlist = displayedItems.map(item => ({
        ...item,
        inWatchlist: true,
    }));

    const handleLoadMore = useCallback(() => {
        if (filter === 'all') {
            fetchNextAllPage();
            return;
        }

        if (!shouldFilterLocally) {
            fetchNextFilteredPage();
        }
    }, [filter, shouldFilterLocally, fetchNextAllPage, fetchNextFilteredPage]);

    // Handler para remover item da lista (atualização otimista em todos os caches)
    const handleRemoveFromWatchlist = useCallback((mediaId: number, mediaType: 'movie' | 'tv') => {
        const keys: MediaType[] = ['all', 'movie', 'tv'];

        keys.forEach((key) => {
            queryClient.setQueryData<InfiniteData<WatchlistPage>>(
                ['watchlist', userId, key],
                (oldData) => removeItemFromWatchlistData(oldData, mediaId, mediaType)
            );
        });
    }, [queryClient, userId]);

    return (
        <div className="pt-24 px-4 md:px-12 pb-20 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-white text-4xl font-bold flex items-center gap-3">
                            <Heart className="text-red-500" size={40} aria-hidden="true" />
                            {t('title')}
                        </h1>
                        <p className="text-gray-400 mt-2">
                            {isGridLoading
                                ? t('loading')
                                : totalCount === 0
                                    ? t('noItems')
                                    : filter === 'all'
                                        ? t('itemCount', { count: totalCount })
                                        : filter === 'movie'
                                            ? t('movieCount', { count: totalCount })
                                            : t('showCount', { count: totalCount })}
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="mb-8">
                    <MediaTypeFilter activeFilter={filter} onChange={setFilter} />
                </div>

                {/* Loading apenas no conteúdo do grid */}
                {isGridLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : shouldShowError ? (
                    <div className="text-center py-20">
                        <Heart className="w-20 h-20 text-red-500 mx-auto mb-4 opacity-50" aria-hidden="true" />
                        <h2 className="text-white text-2xl font-bold mb-2">
                            {t('loadError')}
                        </h2>
                        <p className="text-gray-400 mb-6">
                            {(filter === 'all' ? allError?.message : filteredError?.message) || tl('unexpectedError')}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {tc('retry')}
                        </button>
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="text-center py-20">
                        <Heart className="w-20 h-20 text-gray-700 mx-auto mb-4" aria-hidden="true" />
                        <h2 className="text-white text-2xl font-bold mb-2">
                            {filter === 'all'
                                ? t('emptyList')
                                : filter === 'movie'
                                    ? t('noMovies')
                                    : t('noShows')}
                        </h2>
                        <p className="text-gray-400">
                            {filter === 'all'
                                ? t('addPrompt')
                                : filter === 'movie'
                                    ? t('addMoviesPrompt')
                                    : t('addShowsPrompt')}
                        </p>
                    </div>
                ) : (
                    <InfiniteGrid
                        items={displayedItemsWithWatchlist}
                        isFetchingNextPage={isFetchingNextPage}
                        hasNextPage={hasNextPage}
                        onLoadMore={handleLoadMore}
                        mediaTypeFilter={filter}
                        showMediaTypeIcon={true}
                        endMessage={tc('seenAll')}
                        rootMargin="400px"
                        onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    />
                )}

                {/* Scroll to Top Button */}
                {showScrollTop && <ScrollToTopButton onClick={scrollToTop} />}
            </div>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import MediaCard, { MediaCardItem } from '@/components/MediaCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonCard from '@/components/SkeletonCard';
import { useTranslations } from 'next-intl';

interface InfiniteGridItem {
  id?: number | string;
  mediaId?: number;
  mediaType?: 'movie' | 'tv';
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  voteAverage?: number;
  vote_average?: number;
  releaseDate?: string;
  release_date?: string;
  first_air_date?: string;
  inWatchlist?: boolean; // Vem da API (search) ou calculado (mylist)
}

interface InfiniteGridProps {
  /** Itens a serem exibidos */
  items: InfiniteGridItem[];
  /** Se está carregando a próxima página */
  isFetchingNextPage: boolean;
  /** Se há mais páginas */
  hasNextPage: boolean;
  /** Callback quando atingir o final */
  onLoadMore: () => void;
  /** Filtro de tipo de mídia para determinar mediaType quando não especificado */
  mediaTypeFilter: 'all' | 'movie' | 'tv';
  /** Mostrar ícone de tipo de mídia nos cards */
  showMediaTypeIcon?: boolean;
  /** Texto de fim dos resultados */
  endMessage?: string;
  /** Margem do Intersection Observer (padrão: 400px) */
  rootMargin?: string;
  /** Callback para remover item da watchlist (usado em MyList) */
  onRemoveFromWatchlist?: (mediaId: number, mediaType: 'movie' | 'tv') => void;
}

/**
 * InfiniteGrid - Grid reutilizável para scroll infinito
 * 
 * Gerencia:
 * - Grid responsivo de MediaCards
 * - Intersection Observer para auto-load
 * - Skeleton loaders durante fetch
 * - Mensagem de fim dos resultados
 * 
 * Usado em: MyListClient, SearchInfinite
 */
export default function InfiniteGrid({
  items,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  mediaTypeFilter,
  showMediaTypeIcon = true,
  endMessage,
  rootMargin = '400px',
  onRemoveFromWatchlist,
}: InfiniteGridProps) {
  const tc = useTranslations('common');

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin,
  });

  // Auto-fetch ao atingir o final
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <>
      {/* Grid de Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12"
      >
        {items.map((item, index) => {
          // Determinar o tipo de mídia
          const itemMediaType =
            item.mediaType || // MyList usa mediaType
            item.media_type || // Search usa media_type
            (mediaTypeFilter === 'all' ? 'movie' : mediaTypeFilter);

          const mediaId = item.mediaId || (typeof item.id === 'number' ? item.id : 0);
          const isInWatchlist = item.inWatchlist || false; // Vem da API ou é false

          // Adapter para MediaCardItem
          const cardItem: MediaCardItem = {
            id: mediaId,
            title: item.title || (itemMediaType === 'movie' ? item.title : undefined),
            name: item.name || (itemMediaType === 'tv' ? item.title || item.name : undefined),
            poster_path: item.posterPath || item.poster_path || null,
            backdrop_path: item.backdropPath || item.backdrop_path || null,
            vote_average: item.voteAverage || item.vote_average || 0,
            media_type: itemMediaType,
            release_date: item.releaseDate || item.release_date,
            first_air_date: item.first_air_date,
          };

          return (
            <motion.div
              key={`${itemMediaType}-${mediaId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MediaCard
                item={cardItem}
                mediaType={itemMediaType}
                width="w-full"
                height="aspect-[2/3]"
                showActions={true}
                showBadges={true}
                showMediaTypeIcon={showMediaTypeIcon}
                showInfoBelow={true}
                initialFavorited={isInWatchlist}
                isInWatchlist={isInWatchlist}
                onRemoveFromWatchlist={
                  onRemoveFromWatchlist
                    ? () => onRemoveFromWatchlist(mediaId, itemMediaType as 'movie' | 'tv')
                    : undefined
                }
              />
            </motion.div>
          );
        })}

        {/* Skeleton Loaders durante fetch */}
        {isFetchingNextPage &&
          Array(6)
            .fill(0)
            .map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <SkeletonCard />
              </motion.div>
            ))}
      </motion.div>

      {/* Intersection Observer Trigger */}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex justify-center items-center py-8 mt-8"
          role="status"
          aria-live="polite"
        >
          {isFetchingNextPage && <LoadingSpinner />}
        </div>
      )}

      {/* Fim dos resultados */}
      {!hasNextPage && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-300 text-lg font-medium mb-2">
            {endMessage ?? tc('seenAll')}
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {tc('exploreMore')}
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover hover:shadow-lg hover:scale-105 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
            {tc('scrollToTop')}
          </button>
        </motion.div>
      )}
    </>
  );
}

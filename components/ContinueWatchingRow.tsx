'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Play, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getBackdropUrl } from '@/lib/image-utils';
import SkeletonRow from './SkeletonRow';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTranslations } from 'next-intl';

interface ContinueWatchingItem {
    id: string;
    tmdbId: number;
    mediaType: string;
    seasonNumber: number;
    episodeNumber: number;
    progress: number;
    lastWatchedAt: string;
    title: string;
    backdropPath: string | null;
}

// Componente auxiliar para cada card com prefetch
function ItemCard({
    item,
    onRemove,
}: {
    item: ContinueWatchingItem;
    onRemove: (item: ContinueWatchingItem) => void;
}) {
    const t = useTranslations('media');
    const tA11y = useTranslations('a11y');
    const mediaUrl = `/media/${item.mediaType}/${item.tmdbId}`;
    const watchUrl = item.mediaType === 'tv'
        ? `/watch/tv/${item.tmdbId}/${item.seasonNumber}/${item.episodeNumber}`
        : `/watch/movie/${item.tmdbId}`;

    // Prefetch com delay de 400ms
    const mediaPrefetch = usePrefetch(mediaUrl, 400);
    const watchPrefetch = usePrefetch(watchUrl, 400);

    // Subtítulo mostra episódio para séries
    const subtitle = item.mediaType === 'tv'
        ? tA11y('seasonEpisode', { season: item.seasonNumber, episode: item.episodeNumber })
        : '';

    return (
        <div className="relative flex-shrink-0 w-64 md:w-80 group/card">
            <div className="relative rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105">
                {/* Backdrop image with link to details */}
                <Link
                    href={mediaUrl}
                    prefetch={false}
                    onMouseEnter={mediaPrefetch.handleMouseEnter}
                    onMouseLeave={mediaPrefetch.handleMouseLeave}
                    aria-label={item.title}
                    className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <div className="relative w-full h-36 md:h-44">
                        <OptimizedImage
                            src={getBackdropUrl(item.backdropPath)}
                            alt={item.title}
                            fill
                            loading="lazy"
                            sizeContext="continueWatching"
                            className="object-cover"
                        />
                    </div>
                </Link>

                {/* Remove button - Top right (mobile: always visible, desktop: hover) */}
                <button
                    onClick={() => onRemove(item)}
                    className="absolute top-2 right-2 z-20 p-2 text-red-400 bg-black/60 hover:text-white hover:bg-red-500/90 backdrop-blur-sm rounded-lg transition-all opacity-60 md:opacity-0 md:group-hover/card:opacity-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t('removeFromHistory')}
                    title={t('removeFromHistory')}
                >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Play overlay - links to watch page */}
                <Link
                    href={watchUrl}
                    prefetch={false}
                    onMouseEnter={watchPrefetch.handleMouseEnter}
                    onMouseLeave={watchPrefetch.handleMouseLeave}
                    aria-label={tA11y('playContent', { title: item.title })}
                    className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <div className="bg-white rounded-full p-3">
                            <Play className="w-8 h-8 text-black" fill="black" aria-hidden="true" />
                        </div>
                    </div>
                </Link>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(item.progress, 100)}%` }}
                        role="progressbar"
                        aria-valuenow={item.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={tA11y('progressBar')}
                    />
                </div>
            </div>

            {/* Title */}
            <div className="mt-2">
                <h3 className="text-white text-sm font-medium line-clamp-1">
                    {item.title}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

export default function ContinueWatchingRow() {
    const t = useTranslations('media');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const [items, setItems] = useState<ContinueWatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadContinueWatching();
    }, []);

    const loadContinueWatching = async () => {
        try {
            // Uma única requisição - API retorna dados prontos para exibição
            const response = await fetch('/api/watch-history?continueWatching=true');
            if (!response.ok) return;

            const data = await response.json();
            setItems(data.items || []);
        } catch (error) {
            console.error(tc('errorLoadingContinueWatching'), error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromHistory = async (item: ContinueWatchingItem) => {
        // 1. Remover imediatamente da UI (optimistic update)
        const itemIndex = items.findIndex(i => i.id === item.id);
        setItems(prev => prev.filter(i => i.id !== item.id));

        try {
            // 2. Construir URL de delete com season/episode
            const params = new URLSearchParams({
                tmdbId: item.tmdbId.toString(),
                mediaType: item.mediaType,
            });

            if (item.mediaType === 'tv') {
                params.append('seasonNumber', item.seasonNumber.toString());
                params.append('episodeNumber', item.episodeNumber.toString());
            }

            // 3. Chamar API
            const response = await fetch(`/api/watch-history?${params.toString()}`, {
                method: 'DELETE',
            });

            // 4. Se erro, reverter e mostrar toast
            if (!response.ok) {
                throw new Error(t('errorRemoveHistory'));
            }

            // 5. Sucesso: não fazer nada (item já foi removido)
        } catch (error) {
            // Reverter: adicionar item de volta na posição original
            setItems(prev => {
                const newItems = [...prev];
                newItems.splice(itemIndex, 0, item);
                return newItems;
            });

            const episodeInfo = item.mediaType === 'tv'
                ? ` (${tA11y('seasonEpisode', { season: item.seasonNumber, episode: item.episodeNumber })})`
                : '';

            toast.error(t('errorRemoving'), {
                description: t('errorRemovingDesc', { title: `${item.title}${episodeInfo}` }),
            });
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = direction === 'left' ? -800 : 800;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const targetScroll = container.scrollLeft + scrollAmount;

        if (direction === 'right' && targetScroll >= maxScroll) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        } else if (direction === 'left' && targetScroll <= 0) {
            container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        } else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (loading) {
        return <SkeletonRow title={t('continueWatching')} count={4} variant="landscape" />;
    }

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 group">
            <h2 className="text-white text-2xl font-semibold mb-4 px-4 md:px-12">
                {t('continueWatching')}
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={tA11y('scrollLeft')}
                >
                    <ChevronLeft className="w-8 h-8" aria-hidden="true" />
                </button>

                {/* Items Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-2 overflow-x-scroll scrollbar-hide px-4 md:px-12 pb-4"
                >
                    {items.map((item) => (
                        <ItemCard
                            key={`${item.tmdbId}-${item.seasonNumber}-${item.episodeNumber}`}
                            item={item}
                            onRemove={removeFromHistory}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={tA11y('scrollRight')}
                >
                    <ChevronRight className="w-8 h-8" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

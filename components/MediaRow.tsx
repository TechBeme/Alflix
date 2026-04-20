'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SkeletonRow from './SkeletonRow';
import MediaCard, { MediaCardItem } from './MediaCard';

interface MediaRowProps {
    title: string;
    items: MediaCardItem[];
    mediaType: 'movie' | 'tv';
    loading?: boolean;
    watchlistMap?: Record<string, boolean>;
}

export default function MediaRow({ title, items, mediaType, loading = false, watchlistMap }: MediaRowProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const tA11y = useTranslations('a11y');

    // Debug: verificar duplicatas
    if (process.env.NODE_ENV === 'development') {
        const ids = items.map(item => item.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            console.warn(`⚠️ [${title}] Duplicatas detectadas!`, {
                total: ids.length,
                unique: uniqueIds.size,
                duplicates: ids.filter((id, i) => ids.indexOf(id) !== i)
            });
        }
    }

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const scrollAmount = direction === 'left' ? -800 : 800;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const targetScroll = container.scrollLeft + scrollAmount;

        // Se tentar scrollar além do final, voltar para o início
        if (direction === 'right' && targetScroll >= maxScroll) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        }
        // Se tentar scrollar antes do início, ir para o final
        else if (direction === 'left' && targetScroll <= 0) {
            container.scrollTo({ left: maxScroll, behavior: 'smooth' });
        }
        // Scroll normal
        else {
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Show skeleton while loading
    if (loading) {
        return <SkeletonRow title={title} count={6} variant="poster" />;
    }

    return (
        <div className="mb-8 group overflow-hidden">
            <h2 className="text-white text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 px-3 sm:px-4 md:px-12">
                {title}
            </h2>

            <div className="relative">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-30 w-8 md:w-12 bg-gradient-to-r from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={tA11y('scrollLeft')}
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
                </button>

                {/* Items Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-2 overflow-x-scroll scrollbar-hide px-3 sm:px-4 md:px-12 pb-4"
                >
                    {items.map((item) => {
                        // Usar media_type do item quando disponível (ex: trending), senão usar a prop
                        const itemMediaType = (item.media_type === 'movie' || item.media_type === 'tv')
                            ? item.media_type
                            : mediaType;
                        const watchlistKey = `${item.id}-${itemMediaType}`;

                        return (
                            <MediaCard
                                key={`${title}-${item.id}-${itemMediaType}`}
                                item={item}
                                mediaType={itemMediaType}
                                showActions={true}
                                initialFavorited={watchlistMap ? watchlistMap[watchlistKey] || false : false}
                                showBadges={true}
                            />
                        );
                    })}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-30 w-8 md:w-12 bg-gradient-to-l from-black/60 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={tA11y('scrollRight')}
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
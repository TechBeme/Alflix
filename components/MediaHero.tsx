'use client';

import Link from 'next/link';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FavoriteButton from '@/components/FavoriteButton';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Movie, TVShow } from '@/lib/tmdb';
import { getBackdropUrl } from '@/lib/image-utils';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTranslations } from 'next-intl';

interface MediaHeroProps {
    media: (Movie | TVShow) & { media_type?: string };
    onPlayClick?: () => void;
    onInfoClick?: () => void;
    className?: string;
    initialFavorited?: boolean;
}

/**
 * MediaHero - Hero section for authenticated home page featuring a movie/TV show
 * Used in: main home page (page.tsx)
 */
export default function MediaHero({
    media,
    onPlayClick,
    onInfoClick,
    className = '',
    initialFavorited = false,
}: MediaHeroProps) {
    const t = useTranslations('mediaHero');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');

    const getTitle = (item: Movie | TVShow) => {
        return 'title' in item ? item.title : item.name;
    };

    // Primeiro verifica media_type se disponível (trending), depois verifica se tem 'title' (movie) ou não (tv)
    const mediaType = media.media_type === 'movie' || media.media_type === 'tv'
        ? media.media_type
        : ('title' in media ? 'movie' : 'tv');
    const watchUrl = `/watch/${mediaType}/${media.id}`;
    const detailsUrl = `/media/${mediaType}/${media.id}`;

    // Prefetch para os botões
    const watchPrefetch = usePrefetch(watchUrl, 300);
    const detailsPrefetch = usePrefetch(detailsUrl, 300);

    const handlePlayClick = () => {
        if (onPlayClick) {
            onPlayClick();
        }
    };

    const handleInfoClick = () => {
        if (onInfoClick) {
            onInfoClick();
        }
    };

    return (
        <div
            className={`relative h-[70vh] sm:h-[80vh] mb-8 ${className} overflow-hidden`}
        >
            {/* Link invisível que cobre o banner no mobile - cliques passam por pointer-events */}
            <Link
                href={detailsUrl}
                className="absolute inset-0 z-[1] sm:hidden"
                aria-label={t('viewDetails', { title: getTitle(media) })}
            />
            {/* Backdrop Image otimizada com next/image (priority para LCP) */}
            <div className="absolute inset-0">
                <OptimizedImage
                    src={getBackdropUrl(media?.backdrop_path)}
                    alt={t('backdropAlt', { title: getTitle(media) })}
                    fill
                    priority
                    sizeContext="heroBackdrop"
                    quality={75}
                    className="object-cover object-center"
                    placeholder="blur"
                />
                <div className="absolute inset-0 bg-gradient-hero-overlay" />
            </div>

            <div className="relative z-10 pointer-events-none sm:pointer-events-auto flex flex-col justify-end h-full px-4 sm:px-6 md:px-12 pb-24 sm:pb-32 max-w-full">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 max-w-full md:max-w-3xl line-clamp-2 sm:line-clamp-none">
                    {getTitle(media)}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-4 sm:mb-6 max-w-full sm:max-w-xl md:max-w-2xl line-clamp-2 sm:line-clamp-3">
                    {media?.overview}
                </p>
                <div className="flex items-center space-x-2 mb-4 sm:mb-6" aria-label={tA11y('rating', { value: media.vote_average?.toFixed(1) })}>
                    <span className="text-yellow-400 text-lg sm:text-xl" aria-hidden="true">★</span>
                    <span className="text-white text-lg sm:text-xl font-semibold">
                        {media?.vote_average?.toFixed(1)}
                    </span>
                </div>
                <div className="pointer-events-auto flex flex-wrap gap-2 sm:gap-3 md:space-x-0 md:flex-nowrap">
                    {onPlayClick ? (
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-gray-200 text-base px-6 py-3 flex-shrink-0"
                            onClick={handlePlayClick}
                        >
                            <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="black" aria-hidden="true" />
                            {tc('watch')}
                        </Button>
                    ) : (
                        <Link
                            href={watchUrl}
                            prefetch={false}
                            onMouseEnter={watchPrefetch.handleMouseEnter}
                            onMouseLeave={watchPrefetch.handleMouseLeave}
                        >
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-base px-6 py-3 flex-shrink-0">
                                <Play className="w-5 h-5 md:w-6 md:h-6 mr-2" fill="black" aria-hidden="true" />
                                {tc('watch')}
                            </Button>
                        </Link>
                    )}
                    {onInfoClick ? (
                        <Button
                            size="lg"
                            variant="outline"
                            className="hidden sm:flex bg-gray-800 bg-opacity-70 text-white border-gray-600 hover:bg-gray-700 text-sm sm:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex-shrink-0"
                            onClick={handleInfoClick}
                        >
                            <Info className="w-5 h-5 md:w-6 md:h-6 mr-2" aria-hidden="true" />
                            {t('moreInfo')}
                        </Button>
                    ) : (
                        <Link
                            href={detailsUrl}
                            prefetch={false}
                            onMouseEnter={detailsPrefetch.handleMouseEnter}
                            onMouseLeave={detailsPrefetch.handleMouseLeave}
                            className="hidden sm:block"
                        >
                            <Button
                                size="lg"
                                variant="outline"
                                className="bg-gray-800 bg-opacity-70 text-white border-gray-600 hover:bg-gray-700 text-sm sm:text-base px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex-shrink-0"
                            >
                                <Info className="w-5 h-5 md:w-6 md:h-6 mr-2" aria-hidden="true" />
                                {t('moreInfo')}
                            </Button>
                        </Link>
                    )}
                    <FavoriteButton
                        tmdbId={media.id}
                        mediaType={mediaType}
                        size="lg"
                        initialFavorited={initialFavorited}
                    />
                </div>
            </div>
        </div>
    );
}

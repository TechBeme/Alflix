'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Film, Tv } from 'lucide-react';
import { getPosterUrl } from '@/lib/image-utils';
import FavoriteButton from '@/components/FavoriteButton';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTranslations } from 'next-intl';

export interface MediaCardItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    vote_average: number;
    media_type?: string;
    release_date?: string;
    first_air_date?: string;
}

interface MediaCardProps {
    item: MediaCardItem;
    mediaType?: 'movie' | 'tv';
    width?: string;
    height?: string;
    showActions?: boolean;
    showBadges?: boolean;
    /** Mostrar ícone de tipo de mídia (filme/série) no canto superior direito */
    showMediaTypeIcon?: boolean;
    /** Mostrar título e ano abaixo do card (usado na busca) */
    showInfoBelow?: boolean;
    initialFavorited?: boolean;
    /** Callback para remover da watchlist (usado na página Minha Lista) */
    onRemoveFromWatchlist?: () => void;
    /** Se o item está na watchlist (passado pela página Minha Lista) */
    isInWatchlist?: boolean;
}

/**
 * MediaCard - Componente de card modular para exibição de filmes e séries
 * Usado em: MediaRow, HorizontalScrollGallery, Search e outros componentes de galeria
 */
export default function MediaCard({
    item,
    mediaType: propMediaType,
    width = 'w-40 md:w-48',
    height = 'h-60 md:h-72',
    showActions = true,
    showBadges = true,
    showMediaTypeIcon = true,
    showInfoBelow = false,
    initialFavorited = false,
    onRemoveFromWatchlist,
    isInWatchlist = false
}: MediaCardProps) {
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const itemTitle = item.title || item.name || tc('noTitle');

    // Detectar o tipo de mídia
    const getMediaType = (): 'movie' | 'tv' => {
        // Se media_type está definido no item, use-o
        if (item.media_type && (item.media_type === 'movie' || item.media_type === 'tv')) {
            return item.media_type;
        }
        // Se foi passado como prop, use-o
        if (propMediaType) {
            return propMediaType;
        }
        // Caso contrário, detecte pelo campo title (movie) ou name (tv)
        return 'title' in item && item.title ? 'movie' : 'tv';
    };

    const mediaType = getMediaType();

    // Detectar badges (Novo, etc)
    const getBadges = () => {
        if (!showBadges) return [];

        const badges = [];
        const releaseDate = item.release_date || item.first_air_date;

        if (releaseDate) {
            const release = new Date(releaseDate);
            const now = new Date();
            const diffDays = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays <= 60) {
                badges.push({ label: tc('new'), color: 'bg-green-600' });
            }
        }

        return badges;
    };

    const badges = getBadges();
    const router = useRouter();

    // Prefetch com delay de 400ms para evitar prefetch durante scroll
    const { handleMouseEnter, handleMouseLeave } = usePrefetch(
        `/media/${mediaType}/${item.id}`,
        400 // delay de 400ms - só faz prefetch se o mouse ficar sobre o card
    );

    // Obter o ano de lançamento
    const getYear = () => {
        const releaseDate = item.release_date || item.first_air_date;
        if (releaseDate) {
            return new Date(releaseDate).getFullYear();
        }
        return null;
    };

    const year = getYear();

    const handleCardClick = () => {
        router.push(`/media/${mediaType}/${item.id}`);
    };

    return (
        <div
            className={`relative flex-shrink-0 ${width} cursor-pointer group/card overflow-hidden`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className={`relative ${height} rounded-md overflow-hidden transform transition-all duration-300 group-hover/card:scale-105 group-hover/card:z-10 max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
                onClick={handleCardClick}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
                aria-label={itemTitle}
            >
                {/* Top Row - Badges Left + Rating Right */}
                <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-start transition-all duration-300 group-hover/card:top-3">
                    {/* Left Side - Badges (visible) / Media Type (on hover) */}
                    <div className="relative">
                        {/* Badges - Hidden on Hover */}
                        {badges.length > 0 && (
                            <div className="flex gap-2 opacity-100 group-hover/card:opacity-0 transition-opacity duration-300">
                                {badges.map((badge, idx) => (
                                    <span
                                        key={idx}
                                        className={`${badge.color} text-white text-xs font-bold px-2 py-1 rounded`}
                                    >
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Media Type Icon - Shown on Hover (replaces badges) */}
                        {showMediaTypeIcon && (
                            <div className={`opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ${badges.length > 0 ? 'absolute top-0 left-0' : ''}`}>
                                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1">
                                    {mediaType === 'movie' ? (
                                        <Film aria-hidden="true" className="w-3 h-3" />
                                    ) : (
                                        <Tv aria-hidden="true" className="w-3 h-3" />
                                    )}
                                    {mediaType === 'movie' ? tc('movie') : tc('tvShow')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Rating (always visible) */}
                    {item.vote_average > 0 && (
                        <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded" aria-label={tA11y('rating', { value: item.vote_average.toFixed(1) })}>
                            <span aria-hidden="true">★</span> {item.vote_average.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Poster Image */}
                <OptimizedImage
                    src={getPosterUrl(item.poster_path)}
                    alt={itemTitle}
                    fill
                    loading="lazy"
                    className="object-cover"
                    sizes="(max-width: 768px) 160px, 192px"
                />

                {/* Year - Bottom Right on Hover (só mostra se não estiver mostrando abaixo do card) */}
                {year && !showInfoBelow && (
                    <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                        <span className="text-white text-sm font-semibold drop-shadow-lg">{year}</span>
                    </div>
                )}

                {/* Hover Overlay com gradiente suave */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    {/* Título - só mostra no hover se não estiver mostrando abaixo do card */}
                    {!showInfoBelow && (
                        <h3 className="text-white text-sm font-semibold mb-2 line-clamp-2 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                            {itemTitle}
                        </h3>
                    )}

                    {/* Action Buttons */}
                    {showActions && (
                        <div className={`flex space-x-2 ${!showInfoBelow ? 'mt-2' : ''} transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300 delay-100`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/watch/${mediaType}/${item.id}`);
                                }}
                                className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={tc('watch')}
                            >
                                <Play className="w-4 h-4" fill="black" aria-hidden="true" />
                            </button>
                            <div onClick={(e) => e.stopPropagation()}>
                                <FavoriteButton
                                    tmdbId={item.id}
                                    mediaType={mediaType}
                                    size="sm"
                                    iconOnly={false}
                                    initialFavorited={isInWatchlist || initialFavorited}
                                    onToggle={onRemoveFromWatchlist ? (favorited) => {
                                        if (!favorited && onRemoveFromWatchlist) {
                                            onRemoveFromWatchlist();
                                        }
                                    } : undefined}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Below Card (usado na busca) */}
            {showInfoBelow && (
                <div className="mt-2">
                    <h3 className="text-sm font-medium text-white line-clamp-2">
                        {itemTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {year || tc('notAvailable')}
                    </p>
                </div>
            )}
        </div>
    );
}

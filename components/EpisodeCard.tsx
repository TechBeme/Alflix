'use client';

import { Play, Clock } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Episode } from '@/lib/tmdb';
import { getEpisodeThumbnailUrl } from '@/lib/image-utils';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { COMPLETION_THRESHOLD } from '@/lib/watch-constants';
import { useTranslations, useLocale } from 'next-intl';

interface EpisodeCardProps {
    episode: Episode;
    tvId: number;
    onPlay?: () => void;
    /** Watch progress percentage (0-100). Undefined = not watched. */
    progress?: number;
}

/**
 * EpisodeCard - Card component for displaying TV show episode information
 * Shows thumbnail, title, description, runtime, play button, and watch progress
 */
export default function EpisodeCard({ episode, tvId, onPlay, progress }: EpisodeCardProps) {
    const t = useTranslations('episode');
    const tA11y = useTranslations('a11y');
    const locale = useLocale();

    const handlePlayClick = () => {
        if (onPlay) {
            onPlay();
        } else {
            window.location.href = `/watch/tv/${tvId}/${episode.season_number}/${episode.episode_number}`;
        }
    };

    const formatRuntime = (minutes: number | null) => {
        if (!minutes) return '';
        if (minutes < 60) return tA11y('minutes', { value: minutes });
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return tA11y('hoursMinutes', { hours, mins });
    };

    return (
        <div
            onClick={handlePlayClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayClick(); } }}
            className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-primary transition-all duration-300 cursor-pointer shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            style={{ background: GRADIENTS.surface }}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden">
                <OptimizedImage
                    src={getEpisodeThumbnailUrl(episode.still_path)}
                    alt={episode.name}
                    fill
                    loading="lazy"
                    sizeContext="episodeThumbnail"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div
                        className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center transition-colors"
                        aria-label={t('watchEpisode', { number: episode.episode_number })}
                    >
                        <Play className="w-6 h-6 text-white ml-1" fill="white" aria-hidden="true" />
                    </div>
                </div>

                {/* Episode Number Badge */}
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-xs font-semibold">
                    {tA11y('episodeNumber', { number: episode.episode_number })}
                </div>

                {/* Rating Badge - Bottom Right on Hover */}
                {episode.vote_average > 0 && (
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                        <span aria-hidden="true" className="text-yellow-400 text-lg">★</span>
                        <span className="text-lg font-bold" aria-label={tA11y('rating', { value: episode.vote_average.toFixed(1) })}>{episode.vote_average.toFixed(1)}</span>
                    </div>
                )}

                {/* Progress bar at bottom of thumbnail */}
                {progress !== undefined && progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/80" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${progress >= COMPLETION_THRESHOLD ? 100 : progress}%`,
                                backgroundColor: COLORS.primary,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Episode Info */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-white line-clamp-1 flex-1">
                        {episode.episode_number}. {episode.name}
                    </h4>
                    {episode.runtime && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {formatRuntime(episode.runtime)}
                        </span>
                    )}
                </div>

                {episode.overview && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                        {episode.overview}
                    </p>
                )}

                {episode.air_date && (
                    <p className="text-xs text-gray-500 mt-2">
                        {new Date(episode.air_date).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                )}
            </div>
        </div>
    );
}

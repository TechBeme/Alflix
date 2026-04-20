'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '@/lib/theme';

export interface NextEpisodeInfo {
    season: number;
    episode: number;
    title: string;
    thumbnail?: string | null;
    seriesTitle?: string;
}

export interface NextEpisodeOverlayProps {
    nextEpisode: NextEpisodeInfo;
    autoplayNext: boolean;
    onPlayNext: () => void;
    onDismiss: () => void;
    /** Whether the video has actually ended */
    videoEnded: boolean;
}

/** Countdown duration in seconds when autoplay is enabled */
const AUTOPLAY_COUNTDOWN = 10;

/**
 * Netflix-style "Next Episode" overlay
 * Appears near the end of an episode with countdown and play button.
 * Auto-advances when countdown reaches 0 (if autoplayNext is enabled).
 */
export default function NextEpisodeOverlay({
    nextEpisode,
    autoplayNext,
    onPlayNext,
    onDismiss,
    videoEnded,
}: NextEpisodeOverlayProps) {
    const t = useTranslations('player');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const [countdown, setCountdown] = useState(AUTOPLAY_COUNTDOWN);
    const [countdownActive, setCountdownActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start countdown when video ends and autoplay is enabled
    useEffect(() => {
        if (videoEnded && autoplayNext) {
            setCountdownActive(true);
            setCountdown(AUTOPLAY_COUNTDOWN);
        }
    }, [videoEnded, autoplayNext]);

    // Countdown timer
    useEffect(() => {
        if (!countdownActive) return;

        intervalRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    onPlayNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [countdownActive, onPlayNext]);

    const handlePlayNow = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onPlayNext();
    }, [onPlayNext]);

    const handleDismiss = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCountdownActive(false);
        onDismiss();
    }, [onDismiss]);

    const thumbnailUrl = nextEpisode.thumbnail
        ? `https://image.tmdb.org/t/p/w300${nextEpisode.thumbnail}`
        : '/placeholder.jpg';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="absolute bottom-24 right-4 md:right-8 z-40 w-72 md:w-80"
            >
                <div
                    className="rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60 backdrop-blur-md"
                    style={{ background: 'rgba(10, 10, 10, 0.92)' }}
                >
                    {/* Thumbnail */}
                    <div className="relative w-full h-36 md:h-40">
                        <OptimizedImage
                            src={thumbnailUrl}
                            alt={nextEpisode.title}
                            fill
                            className="object-cover"
                            sizes="320px"
                        />

                        {/* Play button overlay on thumbnail */}
                        <button
                            onClick={handlePlayNow}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors group/play focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={tA11y('playNext')}
                        >
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover/play:scale-110"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                <Play className="w-5 h-5 text-white ml-0.5" fill="white" aria-hidden="true" />
                            </div>
                        </button>

                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={tc('close')}
                        >
                            <X className="w-4 h-4 text-white" aria-hidden="true" />
                        </button>

                        {/* Countdown progress ring at bottom of thumbnail */}
                        {countdownActive && (
                            <div className="absolute bottom-2 left-2">
                                <div className="relative w-8 h-8">
                                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32" aria-hidden="true">
                                        <circle
                                            cx="16" cy="16" r="13"
                                            fill="rgba(0,0,0,0.6)"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="2.5"
                                        />
                                        <circle
                                            cx="16" cy="16" r="13"
                                            fill="none"
                                            stroke={COLORS.primary}
                                            strokeWidth="2.5"
                                            strokeDasharray={`${(countdown / AUTOPLAY_COUNTDOWN) * 81.68} 81.68`}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 linear"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                                        {countdown}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info section */}
                    <div className="px-4 py-3">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                            {t('nextEpisode')}
                        </p>
                        <p className="text-white text-sm font-semibold line-clamp-1">
                            {tA11y('seasonEpisode', { season: nextEpisode.season, episode: nextEpisode.episode })}: {nextEpisode.title}
                        </p>
                        {nextEpisode.seriesTitle && (
                            <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                                {nextEpisode.seriesTitle}
                            </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={handlePlayNow}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white text-sm font-semibold transition-colors hover:brightness-110"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                <Play className="w-4 h-4" fill="white" aria-hidden="true" />
                                {t('watchNow')}
                            </button>

                            {countdownActive && (
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                    {tA11y('countdownSeconds', { count: countdown })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

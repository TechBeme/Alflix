'use client';

import { Video } from '@/lib/tmdb';
import { Play } from 'lucide-react';
import { useState } from 'react';
import { GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

interface TrailerSectionProps {
    videos: Video[];
}

/**
 * TrailerSection - Component for displaying trailers and videos
 * Shows YouTube trailers with modal playback
 */
export default function TrailerSection({ videos }: TrailerSectionProps) {
    const t = useTranslations('trailers');
    const tc = useTranslations('common');
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    // Filter for YouTube trailers and teasers
    const trailers = videos.filter(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );

    if (trailers.length === 0) return null;

    // Get main trailer (first official trailer or first trailer)
    const mainTrailer = trailers.find((t) => t.official) || trailers[0];

    return (
        <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">{t('title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trailers.slice(0, 6).map((video) => (
                    <TrailerCard
                        key={video.id}
                        video={video}
                        isMain={video.id === mainTrailer.id}
                        onClick={() => setSelectedVideo(video)}
                        mainTrailerLabel={t('mainTrailer')}
                    />
                ))}
            </div>

            {/* Video Modal */}
            {selectedVideo && (
                <VideoModal
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    closeLabel={tc('close')}
                />
            )}
        </section>
    );
}

interface TrailerCardProps {
    video: Video;
    isMain: boolean;
    onClick: () => void;
    mainTrailerLabel: string;
}

function TrailerCard({ video, isMain, onClick, mainTrailerLabel }: TrailerCardProps) {
    const tA11y = useTranslations('a11y');
    const thumbnailUrl = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;

    return (
        <button
            onClick={onClick}
            className="group relative aspect-video rounded-xl overflow-hidden border border-white/[0.06] hover:border-primary transition-all shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
            style={{ background: GRADIENTS.trailer }}
            aria-label={tA11y('playTrailer', { name: video.name || 'trailer' })}
        >
            {/* Thumbnail */}
            <img
                src={thumbnailUrl}
                alt={video.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" aria-hidden="true" />
                </div>
            </div>

            {/* Video Title */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <p className="text-sm font-semibold text-white line-clamp-2">
                    {video.name}
                </p>
                {isMain && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-primary text-xs rounded">
                        {mainTrailerLabel}
                    </span>
                )}
            </div>
        </button>
    );
}

interface VideoModalProps {
    video: Video;
    onClose: () => void;
    closeLabel: string;
}

function VideoModal({ video, onClose, closeLabel }: VideoModalProps) {
    const tA11y = useTranslations('a11y');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={tA11y('playTrailer', { name: video.name || 'trailer' })}>
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.06]" style={{ background: GRADIENTS.trailerModal }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/80 hover:bg-black flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={closeLabel}
                >
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* YouTube Embed */}
                <iframe
                    src={`https://www.youtube.com/embed/${video.key}?autoplay=1`}
                    title={video.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}

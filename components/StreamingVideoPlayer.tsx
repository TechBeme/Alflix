'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import VideoPlayer from '@/components/VideoPlayer';
import { Loader2, AlertCircle } from 'lucide-react';
import { GRADIENTS } from '@/lib/theme';
import type { NextEpisodeInfo } from '@/components/NextEpisodeOverlay';

interface StreamingVideoPlayerProps {
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    season?: number;
    episode?: number;
    /** Next episode info for auto-advance (TV only) */
    nextEpisode?: NextEpisodeInfo;
    /** Whether to auto-play next episode (from user preferences) */
    autoplayNext?: boolean;
}

interface VideoQuality {
    label: string;
    url: string;
    bitrate?: number;
}

interface VideoSubtitle {
    label: string;
    language: string;
    src: string;
}

interface AudioTrack {
    label: string;
    language: string;
}

interface StreamingResponse {
    success: boolean;
    url?: string;
    qualities?: VideoQuality[];
    defaultQuality?: string;
    subtitles?: VideoSubtitle[];
    audioTracks?: AudioTrack[];
    error?: string;
    source?: string;
    message?: string;
    expiresAt?: string;
    quality?: string;
}

export default function StreamingVideoPlayer({
    tmdbId,
    mediaType,
    title,
    season,
    episode,
    nextEpisode,
    autoplayNext = false,
}: StreamingVideoPlayerProps) {
    const t = useTranslations('streaming');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const router = useRouter();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [qualities, setQualities] = useState<VideoQuality[]>([]);
    const [defaultQuality, setDefaultQuality] = useState<string>('auto');
    const [subtitles, setSubtitles] = useState<VideoSubtitle[]>([]);
    const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Navigate to next episode
    const handleNextEpisode = useCallback(() => {
        if (!nextEpisode) return;
        router.push(`/watch/tv/${tmdbId}/${nextEpisode.season}/${nextEpisode.episode}`);
    }, [nextEpisode, tmdbId, router]);

    useEffect(() => {
        async function fetchStreamingUrl() {
            try {
                setLoading(true);
                setError(null);

                // Construir query params
                const params = new URLSearchParams({
                    tmdbId: tmdbId.toString(),
                    mediaType,
                });

                if (season) params.append('season', season.toString());
                if (episode) params.append('episode', episode.toString());

                // Solicitar URL do backend
                const response = await fetch(`/api/streaming/get-url?${params.toString()}`);
                const data: StreamingResponse = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || `HTTP ${response.status}`);
                }

                if (!data.url) {
                    throw new Error(t('urlNotReturned'));
                }

                setVideoUrl(data.url);
                setQualities(data.qualities || []);
                setDefaultQuality(data.defaultQuality || 'auto');
                setSubtitles(data.subtitles || []);
                setAudioTracks(data.audioTracks || []);
                setDebugInfo(data);

            } catch (err: any) {
                console.error('❌', t('errorLoadingVideo'), err);
                setError(err.message || t('errorLoadingVideo'));
                setVideoUrl(null);
            } finally {
                setLoading(false);
            }
        }

        fetchStreamingUrl();
    }, [tmdbId, mediaType, season, episode]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center" role="status" aria-live="polite" style={{ background: GRADIENTS.player }}>
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" aria-hidden="true" />
                    <p className="text-white text-lg font-medium">{t('preparing')}</p>
                    <p className="text-gray-400 text-sm mt-2">
                        {t('validating')}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !videoUrl) {
        return (
            <div className="w-full h-screen flex items-center justify-center" role="alert" style={{ background: GRADIENTS.player }}>
                <div className="text-center max-w-lg px-4">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-white/[0.06] shadow-lg shadow-black/20" style={{ background: GRADIENTS.surface }}>
                        <AlertCircle className="w-10 h-10 text-primary" aria-hidden="true" />
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-2">
                        {t('loadError')}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {error || t('urlError')}
                    </p>

                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-left p-4 rounded-xl mb-4 text-sm border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                            <summary className="text-gray-400 cursor-pointer mb-2">
                                {t('debugInfo')}
                            </summary>
                            <pre className="text-gray-300 text-xs overflow-auto">
                                {JSON.stringify({
                                    tmdbId,
                                    mediaType,
                                    season,
                                    episode,
                                    error,
                                    ...(debugInfo && { response: debugInfo }),
                                }, null, 2)}
                            </pre>
                        </details>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {tc('tryAgain')}
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3 text-white font-medium rounded-xl border border-white/[0.08] hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ background: GRADIENTS.playerControlsAlt }}
                        >
                            {tc('back')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <VideoPlayer
            url={videoUrl}
            title={title}
            autoPlay={true}
            tmdbId={tmdbId}
            mediaType={mediaType}
            season={season}
            episode={episode}
            qualities={qualities}
            defaultQuality={defaultQuality}
            subtitles={subtitles}
            audioTracks={audioTracks}
            nextEpisode={nextEpisode}
            autoplayNext={autoplayNext}
            onNextEpisode={handleNextEpisode}
        />
    );
}

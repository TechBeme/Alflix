'use client';

import { useEffect, useState } from 'react';
import VideoPlayer from './VideoPlayer';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface WatchPageClientProps {
    url: string;
    title: string;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
}

/**
 * Componente client-side que gerencia o carregamento do progresso
 * e renderiza o VideoPlayer com o tempo inicial correto
 */
export default function WatchPageClient({
    url,
    title,
    tmdbId,
    mediaType,
}: WatchPageClientProps) {
    const tc = useTranslations('common');
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Buscar progresso do usuário
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch('/api/watch-history');
                if (response.ok) {
                    const data = await response.json();
                    const history = data.history.find(
                        (item: any) => item.tmdbId === tmdbId && item.mediaType === mediaType
                    );

                    if (history?.progress) {
                        setProgressPercentage(history.progress);
                    }
                }
            } catch (error) {
                console.error(tc('errorFetchingWatchProgress'), error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, [tmdbId, mediaType]);

    if (loading) {
        return (
            <div className="aspect-video bg-black flex items-center justify-center" role="status" aria-live="polite">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin" aria-hidden="true" />
            </div>
        );
    }

    // Não podemos calcular startTime aqui porque não sabemos a duração ainda
    // O VideoPlayer vai ter que lidar com isso internamente
    return (
        <VideoPlayer
            url={url}
            title={title}
            autoPlay={false}
            startTime={0} // Será sobrescrito internamente quando soubermos a duração
            tmdbId={tmdbId}
            mediaType={mediaType}
            className="w-full"
        />
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, Clock, Calendar, Star, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Episode } from '@/lib/tmdb';
import { getBackdropUrl, getPosterUrl } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import FavoriteButton from '@/components/FavoriteButton';
import EpisodeCard from '@/components/EpisodeCard';
import SeasonSelector from '@/components/SeasonSelector';
import dynamic from 'next/dynamic';
import MediaRow from '@/components/MediaRow';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';
import type { Session } from '@/lib/auth-client';

// Dynamic imports: seções abaixo do fold (cast, trailers)
const CastSection = dynamic(() => import('@/components/CastSection'));
const TrailerSection = dynamic(() => import('@/components/TrailerSection'));

interface MediaDetailsClientProps {
    media: any;
    mediaType: string;
    mediaId: string;
    initialSession?: Session | null;
    initialFavorited?: boolean;
    /** Map of "season-episode" → progress percentage for watched episodes */
    episodeProgress?: Record<string, number>;
}

export default function MediaDetailsClient({ media, mediaType, mediaId, initialSession, initialFavorited = false, episodeProgress = {} }: MediaDetailsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('mediaDetails');
    const tc = useTranslations('common');
    const tm = useTranslations('media');
    const [selectedSeason, setSelectedSeason] = useState(1);

    // Todas as temporadas já vêm do servidor (SSR)
    const allSeasons = media.allSeasons || {};
    const [episodes, setEpisodes] = useState<Episode[]>(allSeasons[1] || []);
    const toastShownRef = useRef(false);

    const isTVShow = mediaType === 'tv';
    const parsedMediaId = parseInt(mediaId);

    // Detectar erro de streaming e mostrar toast (apenas uma vez)
    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'no_streaming_link' && !toastShownRef.current) {
            toastShownRef.current = true;
            toast.error(t('linkNotAvailable'), {
                description: t('noStreamingDescription')
            });
            // Limpar o parâmetro da URL sem causar loop
            const timer = setTimeout(() => {
                router.replace(`/media/${mediaType}/${mediaId}`, { scroll: false });
            }, 100);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Executar apenas uma vez no mount

    // Atualiza episódios quando troca de temporada (dados já vêm do servidor - SSR)
    useEffect(() => {
        if (mediaType === 'tv' && selectedSeason && allSeasons[selectedSeason]) {
            setEpisodes(allSeasons[selectedSeason]);
        }
    }, [selectedSeason, allSeasons, mediaType]);

    const handlePlayClick = () => {
        // Redirecionar para a página de watch que vai buscar a homepage e redirecionar
        router.push(`/watch/${mediaType}/${parsedMediaId}`);
    };



    const getTitle = () => {
        return media.title || media.name || '';
    };

    const getReleaseYear = () => {
        const date = media.release_date || media.first_air_date;
        return date ? new Date(date).getFullYear() : '';
    };

    const formatRuntime = (minutes: number | undefined) => {
        if (!minutes) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    };

    const translateStatus = (status: string | undefined) => {
        if (!status) return '';

        const translations: Record<string, string> = {
            'Released': t('statusReleased'),
            'Post Production': t('statusPostProduction'),
            'In Production': t('statusInProduction'),
            'Planned': t('statusPlanned'),
            'Rumored': t('statusRumored'),
            'Canceled': t('statusCanceled'),
            'Returning Series': t('statusReturningSeries'),
            'Ended': t('statusEnded'),
            'Pilot': t('statusPilot'),
        };

        return translations[status] || status;
    };

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <Navbar initialSession={initialSession} />

            {/* Hero Section with Backdrop */}
            <div className="relative h-[70vh] md:h-[80vh]">
                {/* Backdrop Image */}
                <div className="absolute inset-0">
                    <OptimizedImage
                        src={getBackdropUrl(media.backdrop_path)}
                        alt={getTitle() || 'Media backdrop'}
                        fill
                        sizeContext="heroBackdrop"
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    aria-label={tc('back')}
                    className="absolute top-20 left-4 md:left-8 z-20 flex items-center gap-2 text-white hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                    <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                    <span className="hidden md:inline">{tc('back')}</span>
                </button>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-8 pb-8 md:pb-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Poster */}
                            <div className="hidden md:block flex-shrink-0">
                                <div className="relative w-48 lg:w-56 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                                    <OptimizedImage
                                        src={getPosterUrl(media.poster_path)}
                                        alt={getTitle() || 'Media poster'}
                                        fill
                                        sizes="(max-width: 1024px) 192px, 224px"
                                        className="object-cover"
                                    />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-end">
                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                                    {getTitle()}
                                </h1>

                                {/* Tagline */}
                                {media.tagline && (
                                    <p className="text-lg text-gray-300 italic mb-4">
                                        &quot;{media.tagline}&quot;
                                    </p>
                                )}

                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-4 text-sm md:text-base mb-6">
                                    {/* Rating */}
                                    <div className="flex items-center gap-1">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                                        <span className="font-semibold text-white">
                                            {media.vote_average.toFixed(1)}
                                        </span>
                                    </div>

                                    {/* Year */}
                                    <div className="flex items-center gap-1 text-gray-300">
                                        <Calendar className="w-4 h-4" aria-hidden="true" />
                                        <span>{getReleaseYear()}</span>
                                    </div>

                                    {/* Runtime or Episodes */}
                                    {media.runtime && (
                                        <div className="flex items-center gap-1 text-gray-300">
                                            <Clock className="w-4 h-4" aria-hidden="true" />
                                            <span>{formatRuntime(media.runtime)}</span>
                                        </div>
                                    )}

                                    {isTVShow && media.number_of_seasons && (
                                        <span className="text-gray-300">
                                            {t('seasonsCount', { count: media.number_of_seasons })} • {t('episodesCount', { count: media.number_of_episodes })}
                                        </span>
                                    )}

                                    {/* Status */}
                                    {media.status && (
                                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                                            {translateStatus(media.status)}
                                        </span>
                                    )}
                                </div>

                                {/* Genres */}
                                {media.genres && media.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {media.genres.map((genre: any) => (
                                            <span
                                                key={genre.id}
                                                className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={handlePlayClick}
                                        className="bg-white hover:bg-gray-200 text-black px-8 py-6 text-lg font-semibold flex items-center gap-2"
                                    >
                                        <Play className="w-5 h-5" fill="black" aria-hidden="true" />
                                        {tc('watch')}
                                    </Button>

                                    <FavoriteButton
                                        tmdbId={parsedMediaId}
                                        mediaType={mediaType as 'movie' | 'tv'}
                                        size="lg"
                                        initialFavorited={initialFavorited}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
                {/* Overview */}
                {media.overview && (
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-4">{tm('synopsis')}</h2>
                        <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                            {media.overview}
                        </p>
                    </section>
                )}

                {/* Episodes Section (TV Shows only) */}
                {isTVShow && media.seasons && media.seasons.length > 0 && (
                    <section className="mb-12">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-white">{tm('episodesSection')}</h2>
                            <SeasonSelector
                                seasons={media.seasons}
                                currentSeason={selectedSeason}
                                onSeasonChange={setSelectedSeason}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {episodes.map((episode) => (
                                <EpisodeCard
                                    key={episode.id}
                                    episode={episode}
                                    tvId={parsedMediaId}
                                    progress={episodeProgress[`${episode.season_number}-${episode.episode_number}`]}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Cast Section */}
                {media.credits && media.credits.cast && media.credits.cast.length > 0 && (
                    <CastSection cast={media.credits.cast} maxItems={10} />
                )}

                {/* Trailers Section */}
                {media.videos && media.videos.results && media.videos.results.length > 0 && (
                    <TrailerSection videos={media.videos.results} />
                )}

                {/* Recommendations Section */}
                {media.recommendations && media.recommendations.results && media.recommendations.results.length > 0 && (
                    <section className="mb-12">
                        <MediaRow
                            title={t('recommendations')}
                            items={media.recommendations.results}
                            mediaType={mediaType as 'movie' | 'tv'}
                        />
                    </section>
                )}
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}

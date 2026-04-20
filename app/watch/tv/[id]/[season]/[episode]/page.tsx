import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import dynamic from 'next/dynamic';
import { auth } from '@/lib/auth';
import { ChevronLeft } from 'lucide-react';
import { GRADIENTS } from '@/lib/theme';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Metadata } from 'next';
import { SITE_NAME_FULL, TMDB_API_URL, TMDB_API_KEY } from '@/lib/config';
import { getTranslations } from 'next-intl/server';
import { getUserLanguage } from '@/lib/language-server';

// Dynamic import: StreamingVideoPlayer (heavy component chain)
const StreamingVideoPlayer = dynamic(
    () => import('@/components/StreamingVideoPlayer'),
    {
        loading: () => (
            <div className="w-full h-screen flex items-center justify-center bg-black">
                <LoadingSpinner />
            </div>
        ),
    }
);

interface PageProps {
    params: Promise<{
        id: string;
        season: string;
        episode: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id, season, episode } = await params;
    const t = await getTranslations('common');
    const tm = await getTranslations('metadata');
    try {
        const headersList = await headers();
        const acceptLanguage = headersList.get('accept-language');
        const session = await auth.api.getSession({ headers: headersList });
        const language = await getUserLanguage(session?.user?.id, acceptLanguage);

        // Buscar série e episódio em paralelo
        const [seriesRes, episodeRes] = await Promise.all([
            fetch(
                `${TMDB_API_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
                { next: { revalidate: 86400 } }
            ),
            fetch(
                `${TMDB_API_URL}/tv/${id}/season/${season}/episode/${episode}?api_key=${TMDB_API_KEY}&language=${language}`,
                { next: { revalidate: 86400 } }
            ),
        ]);

        if (!seriesRes.ok) {
            return {
                title: t('watch'),
                robots: { index: false, follow: false }
            };
        }

        const seriesData = await seriesRes.json();
        const seriesName = seriesData.name || t('noTitle');

        let episodeTitle = `T${season}E${episode}`;
        if (episodeRes.ok) {
            const episodeData = await episodeRes.json();
            episodeTitle = episodeData.name
                ? `${seriesName} - T${season}E${episode}: ${episodeData.name}`
                : `${seriesName} - T${season}E${episode}`;
        }

        return {
            title: tm('watchingTitle', { title: episodeTitle }),
            description: tm('watchDescription', { title: episodeTitle, siteName: SITE_NAME_FULL }),
            robots: { index: false, follow: false },
        };
    } catch {
        return {
            title: t('watch'),
            robots: { index: false, follow: false }
        };
    }
}

export default async function WatchTVEpisodePage({ params }: PageProps) {
    const { id, season: seasonParam, episode: episodeParam } = await params;

    // Parse e validar season/episode
    const seasonNumber = parseInt(seasonParam);
    const episodeNumber = parseInt(episodeParam);

    if (isNaN(seasonNumber) || seasonNumber < 1 || isNaN(episodeNumber) || episodeNumber < 1) {
        redirect(`/media/tv/${id}`);
    }

    // i18n
    const tc = await getTranslations('common');
    const te = await getTranslations('errors');
    const ts = await getTranslations('season');

    // 1. Verificar autenticação
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
        redirect(`/login?redirect=${encodeURIComponent(`/watch/tv/${id}/${seasonNumber}/${episodeNumber}`)}`);
    }

    // 2. Buscar em paralelo: user+preferences, série, episódio
    const { prisma } = await import('@/lib/prisma');
    const { hasActiveAccess } = await import('@/lib/trial');

    // Detectar idioma do usuário
    const acceptLanguage = headersList.get('accept-language');
    const language = await getUserLanguage(session.user.id, acceptLanguage);

    const [user, seriesResponse, episodeResponse] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: { plan: true, preferences: true },
        }),
        fetch(
            `${TMDB_API_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 3600 } }
        ),
        fetch(
            `${TMDB_API_URL}/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 3600 } }
        ),
    ]);

    if (!user || !hasActiveAccess(user)) {
        redirect('/settings?section=plan&message=subscription_required');
    }

    if (!seriesResponse.ok) {
        console.error(te('seriesNotFound'));
        redirect(`/media/tv/${id}`);
    }

    if (!episodeResponse.ok) {
        console.error(te('episodeNotFound'));
        redirect(`/media/tv/${id}`);
    }

    const seriesData = await seriesResponse.json();
    const episodeData = await episodeResponse.json();
    const seriesName = seriesData.name || tc('noTitle');
    const episodeTitle = episodeData.name
        ? `${seriesName} - T${seasonNumber}E${episodeNumber}: ${episodeData.name}`
        : `${seriesName} - ${ts('seasonNumber', { number: seasonNumber })} ${te('episodeNumber', { number: episodeNumber })}`;

    // 3. Autoplay preference (default: true)
    const autoplayNext = user.preferences?.autoplayNext ?? true;

    // 4. Computar próximo episódio
    // seriesData.seasons contém { season_number, episode_count } para cada temporada
    interface NextEpInfo {
        season: number;
        episode: number;
        title: string;
        thumbnail?: string | null;
        seriesTitle?: string;
    }
    let nextEpisode: NextEpInfo | undefined;

    const seasons: Array<{ season_number: number; episode_count: number }> = (seriesData.seasons || [])
        .filter((s: { season_number: number }) => s.season_number > 0); // Ignora "Specials" (season 0)

    const currentSeason = seasons.find(s => s.season_number === seasonNumber);

    if (currentSeason) {
        if (episodeNumber < currentSeason.episode_count) {
            // Próximo episódio na mesma temporada
            const nextEpNumber = episodeNumber + 1;

            // Buscar dados do próximo episódio (título, thumbnail)
            try {
                const nextEpRes = await fetch(
                    `${TMDB_API_URL}/tv/${id}/season/${seasonNumber}/episode/${nextEpNumber}?api_key=${TMDB_API_KEY}&language=${language}`,
                    { next: { revalidate: 3600 } }
                );
                if (nextEpRes.ok) {
                    const nextEpData = await nextEpRes.json();
                    nextEpisode = {
                        season: seasonNumber,
                        episode: nextEpNumber,
                        title: nextEpData.name || te('episodeNumber', { number: nextEpNumber }),
                        thumbnail: nextEpData.still_path,
                        seriesTitle: seriesName,
                    };
                }
            } catch {
                // Se falhar, ainda assim mostrar sem thumbnail
                nextEpisode = {
                    season: seasonNumber,
                    episode: nextEpNumber,
                    title: te('episodeNumber', { number: nextEpNumber }),
                    seriesTitle: seriesName,
                };
            }
        } else {
            // Último episódio da temporada - tentar próxima temporada
            const nextSeason = seasons.find(s => s.season_number === seasonNumber + 1);
            if (nextSeason && nextSeason.episode_count > 0) {
                try {
                    const nextEpRes = await fetch(
                        `${TMDB_API_URL}/tv/${id}/season/${seasonNumber + 1}/episode/1?api_key=${TMDB_API_KEY}&language=${language}`,
                        { next: { revalidate: 3600 } }
                    );
                    if (nextEpRes.ok) {
                        const nextEpData = await nextEpRes.json();
                        nextEpisode = {
                            season: seasonNumber + 1,
                            episode: 1,
                            title: nextEpData.name || te('episodeNumber', { number: 1 }),
                            thumbnail: nextEpData.still_path,
                            seriesTitle: seriesName,
                        };
                    }
                } catch {
                    nextEpisode = {
                        season: seasonNumber + 1,
                        episode: 1,
                        title: te('episodeNumber', { number: 1 }),
                        seriesTitle: seriesName,
                    };
                }
            }
            // Se não há próxima temporada, nextEpisode fica undefined (último episódio da série)
        }
    }

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageWatch }}>
            {/* Botão de voltar */}
            <div className="absolute top-5 left-5 z-50">
                <Link
                    href={`/media/tv/${id}`}
                    aria-label={tc('back')}
                    className="flex items-center gap-2 text-white hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                    <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                    <span className="hidden md:inline">{tc('back')}</span>
                </Link>
            </div>

            {/* Streaming Video Player - busca URL via API */}
            <div className="w-full h-screen">
                <StreamingVideoPlayer
                    tmdbId={parseInt(id)}
                    mediaType="tv"
                    title={episodeTitle}
                    season={seasonNumber}
                    episode={episodeNumber}
                    nextEpisode={nextEpisode}
                    autoplayNext={autoplayNext}
                />
            </div>
        </div>
    );
}

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
import { resolveResumeEpisode } from '@/lib/resume-episode';
import { getTranslations } from 'next-intl/server';
import { getUserLanguage } from '@/lib/language-server';

// Dynamic import: StreamingVideoPlayer (208 linhas + VideoPlayer 773 linhas + react-player)
// Code-splitting: componente pesado carregado sob demanda
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
        type: string;
        id: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { type, id } = await params;
    const t = await getTranslations('common');
    const tm = await getTranslations('metadata');
    try {
        const headersList = await headers();
        const acceptLanguage = headersList.get('accept-language');
        const session = await auth.api.getSession({ headers: headersList });
        const language = await getUserLanguage(session?.user?.id, acceptLanguage);

        const res = await fetch(
            `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return { title: t('watch'), robots: { index: false, follow: false } };
        const data = await res.json();
        const title = data.title || data.name || t('noTitle');
        return {
            title: tm('watchingTitle', { title }),
            description: tm('watchDescription', { title, siteName: SITE_NAME_FULL }),
            robots: { index: false, follow: false },
        };
    } catch {
        return { title: t('watch'), robots: { index: false, follow: false } };
    }
}

export default async function WatchPage({ params }: PageProps) {
    const { type, id } = await params;

    if (type !== 'movie' && type !== 'tv') {
        redirect('/');
    }

    // i18n
    const tc = await getTranslations('common');
    const te = await getTranslations('episode');

    // 1. Auth
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
        redirect(`/login?redirect=${encodeURIComponent(`/watch/${type}/${id}`)}`);
    }

    const { prisma } = await import('@/lib/prisma');
    const { hasActiveAccess } = await import('@/lib/trial');
    const tmdbId = parseInt(id);

    if (isNaN(tmdbId) || tmdbId <= 0) {
        redirect('/');
    }

    // Detectar idioma do usuário
    const acceptLanguage = headersList.get('accept-language');
    const language = await getUserLanguage(session.user.id, acceptLanguage);

    // ====== MOVIE: 1 DB + 1 TMDB (parallel) ======
    if (type === 'movie') {
        const [user, tmdbResponse] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                include: { plan: true },
            }),
            fetch(
                `${TMDB_API_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
                { next: { revalidate: 3600 } }
            ),
        ]);

        if (!user || !hasActiveAccess(user)) {
            redirect('/settings?section=plan&message=subscription_required');
        }

        if (!tmdbResponse.ok) {
            redirect(`/media/movie/${id}`);
        }

        const data = await tmdbResponse.json();
        const title = data.title || data.name || tc('noTitle');

        return (
            <div className="min-h-screen" style={{ background: GRADIENTS.pageWatch }}>
                <div className="absolute top-5 left-5 z-50">
                    <Link
                        href={`/media/movie/${id}`}
                        aria-label={tc('back')}
                        className="flex items-center gap-2 text-white hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                        <ChevronLeft className="w-6 h-6" aria-hidden="true" />
                        <span className="hidden md:inline">{tc('back')}</span>
                    </Link>
                </div>
                <div className="w-full h-screen">
                    <StreamingVideoPlayer
                        tmdbId={tmdbId}
                        mediaType="movie"
                        title={title}
                    />
                </div>
            </div>
        );
    }

    // ====== TV: 1 DB user + 1 DB watchHistory + 1 TMDB series (parallel) ======
    const [user, watchHistory, seriesResponse] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: { plan: true, preferences: true },
        }),
        prisma.watchHistory.findMany({
            where: { userId: session.user.id, tmdbId, mediaType: 'tv' },
            orderBy: { lastWatchedAt: 'desc' },
        }),
        fetch(
            `${TMDB_API_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 3600 } }
        ),
    ]);

    if (!user || !hasActiveAccess(user)) {
        redirect('/settings?section=plan&message=subscription_required');
    }

    if (!seriesResponse.ok) {
        redirect(`/media/tv/${id}`);
    }

    const seriesData = await seriesResponse.json();
    const seriesName = seriesData.name || tc('noTitle');

    const seasons: Array<{ season_number: number; episode_count: number }> =
        (seriesData.seasons || []).filter(
            (s: { season_number: number }) => s.season_number > 0
        );

    // Compute resume episode using pre-loaded data (0 extra queries)
    const resumePoint = resolveResumeEpisode(watchHistory, seasons);

    // Autoplay preference
    const autoplayNext = user.preferences?.autoplayNext ?? true;

    // Fetch episode details + next episode details in parallel
    interface NextEpInfo {
        season: number;
        episode: number;
        title: string;
        thumbnail?: string | null;
        seriesTitle?: string;
    }
    let nextEpisode: NextEpInfo | undefined;

    const currentSeason = seasons.find(s => s.season_number === resumePoint.season);

    // Determine next episode coordinates
    let nextEpSeason: number | null = null;
    let nextEpNumber: number | null = null;

    if (currentSeason) {
        if (resumePoint.episode < currentSeason.episode_count) {
            nextEpSeason = resumePoint.season;
            nextEpNumber = resumePoint.episode + 1;
        } else {
            const nextS = seasons.find(s => s.season_number === resumePoint.season + 1);
            if (nextS && nextS.episode_count > 0) {
                nextEpSeason = nextS.season_number;
                nextEpNumber = 1;
            }
        }
    }

    // Fetch current + next episode TMDB details in parallel (1-2 TMDB fetches)
    const episodeFetches: Promise<Response>[] = [
        fetch(
            `${TMDB_API_URL}/tv/${id}/season/${resumePoint.season}/episode/${resumePoint.episode}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 3600 } }
        ),
    ];

    if (nextEpSeason !== null && nextEpNumber !== null) {
        episodeFetches.push(
            fetch(
                `${TMDB_API_URL}/tv/${id}/season/${nextEpSeason}/episode/${nextEpNumber}?api_key=${TMDB_API_KEY}&language=${language}`,
                { next: { revalidate: 3600 } }
            )
        );
    }

    const episodeResponses = await Promise.all(episodeFetches);

    // Parse current episode
    let episodeTitle = `${seriesName} - T${resumePoint.season}E${resumePoint.episode}`;
    if (episodeResponses[0].ok) {
        const epData = await episodeResponses[0].json();
        if (epData.name) {
            episodeTitle = `${seriesName} - T${resumePoint.season}E${resumePoint.episode}: ${epData.name}`;
        }
    }

    // Parse next episode
    if (nextEpSeason !== null && nextEpNumber !== null && episodeResponses[1]?.ok) {
        try {
            const nextEpData = await episodeResponses[1].json();
            nextEpisode = {
                season: nextEpSeason,
                episode: nextEpNumber,
                title: nextEpData.name || te('episodeNumber', { number: nextEpNumber }),
                thumbnail: nextEpData.still_path,
                seriesTitle: seriesName,
            };
        } catch {
            nextEpisode = {
                season: nextEpSeason,
                episode: nextEpNumber,
                title: te('episodeNumber', { number: nextEpNumber }),
                seriesTitle: seriesName,
            };
        }
    } else if (nextEpSeason !== null && nextEpNumber !== null) {
        nextEpisode = {
            season: nextEpSeason,
            episode: nextEpNumber,
            title: te('episodeNumber', { number: nextEpNumber }),
            seriesTitle: seriesName,
        };
    }

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageWatch }}>
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
            <div className="w-full h-screen">
                <StreamingVideoPlayer
                    tmdbId={tmdbId}
                    mediaType="tv"
                    title={episodeTitle}
                    season={resumePoint.season}
                    episode={resumePoint.episode}
                    nextEpisode={nextEpisode}
                    autoplayNext={autoplayNext}
                />
            </div>
        </div>
    );
}

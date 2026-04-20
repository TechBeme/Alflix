import { headers } from 'next/headers';
import { MediaDetails, Episode } from '@/lib/tmdb';
import NavbarWrapper from '@/components/NavbarWrapper';
import JsonLd from '@/components/JsonLd';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import MediaDetailsClient from './MediaDetailsClient';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import {
    createMediaMetadata,
    generateMovieJsonLd,
    generateTVSeriesJsonLd,
    generateBreadcrumbJsonLd,
    type MediaSeoTranslations,
} from '@/lib/seo';
import { getUserLanguage } from '@/lib/language-server';
import { localeToOpenGraph } from '@/lib/language';

import { TMDB_API_URL, TMDB_API_KEY } from '@/lib/config';

interface PageProps {
    params: Promise<{
        type: string;
        id: string;
    }>;
}

// ─── Fetch SEO data (lightweight, cached) ───────────────────────────────────

async function getMediaSeoData(type: string, id: string, language: string) {
    try {
        const res = await fetch(
            `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=${language}`,
            { next: { revalidate: 86400 } } // 24h cache for SEO data
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
            id: data.id,
            title: data.title,
            name: data.name,
            overview: data.overview,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            vote_average: data.vote_average,
            vote_count: data.vote_count,
            release_date: data.release_date,
            first_air_date: data.first_air_date,
            genres: data.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
            runtime: data.runtime,
            number_of_seasons: data.number_of_seasons,
            tagline: data.tagline,
            status: data.status,
        };
    } catch {
        return null;
    }
}

// ─── generateMetadata (SEO dinâmico por filme/série) ────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { type, id } = await params;
    const te = await getTranslations('errors');
    if (type !== 'movie' && type !== 'tv') {
        return { title: te('notFound') };
    }

    // Detectar idioma do usuário
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    const session = await auth.api.getSession({ headers: headersList });
    const language = await getUserLanguage(session?.user?.id, acceptLanguage);
    const ogLocale = localeToOpenGraph(language);

    const media = await getMediaSeoData(type, id, language);
    if (!media) {
        return { title: te('contentNotFound') };
    }

    const ts = await getTranslations('mediaSeo');
    const seoTranslations: MediaSeoTranslations = {
        noTitle: ts('noTitle'),
        watchOnline: ts('watchOnline'),
        movie: ts('movie'),
        tvShow: ts('tvShow'),
        watchMediaOnline: (v) => ts('watchMediaOnline', v),
        watchTypeOnline: (v) => ts('watchTypeOnline', v),
        genres: (v) => ts('genres', v),
        seasons: (v) => ts('seasons', v),
        poster: (v) => ts('poster', v),
        watchTitle: (v) => ts('watchTitle', v),
        titleOnline: (v) => ts('titleOnline', v),
        titleStreaming: (v) => ts('titleStreaming', v),
        titleYear: (v) => ts('titleYear', v),
        watchOnlineKeyword: ts('watchOnlineKeyword'),
    };
    return createMediaMetadata(media, type as 'movie' | 'tv', ogLocale, seoTranslations);
}

// Busca os detalhes da mídia no servidor
async function getMediaDetails(type: string, id: string, language: string) {
    try {
        // Request para detalhes + credits + videos + recommendations
        const detailsRes = await fetch(
            `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=${language}&append_to_response=credits,videos,recommendations`,
            { next: { revalidate: 3600 } }
        );

        if (!detailsRes.ok) {
            return null;
        }

        const data = await detailsRes.json();

        // Se for série, buscar TODAS as temporadas em paralelo (SSR completo)
        let seasonsResults: Response[] = [];
        if (type === 'tv') {
            const totalSeasons = data.number_of_seasons || 0;

            if (totalSeasons > 0) {
                // Buscar todas as temporadas em paralelo
                const seasonPromises = [];
                for (let seasonNum = 1; seasonNum <= totalSeasons; seasonNum++) {
                    seasonPromises.push(
                        fetch(
                            `${TMDB_API_URL}/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=${language}`,
                            { next: { revalidate: 3600 } }
                        )
                    );
                }
                seasonsResults = await Promise.all(seasonPromises);
            }
        }

        // Otimizar resposta
        const optimizedData: any = {
            id: data.id,
            overview: data.overview,
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            vote_average: data.vote_average,
            genres: data.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
            status: data.status,
            tagline: data.tagline,
        };

        if (type === 'movie') {
            optimizedData.title = data.title;
            optimizedData.release_date = data.release_date;
            optimizedData.runtime = data.runtime;
        } else {
            optimizedData.name = data.name;
            optimizedData.first_air_date = data.first_air_date;
            optimizedData.number_of_seasons = data.number_of_seasons;
            optimizedData.number_of_episodes = data.number_of_episodes;

            // Lista de temporadas para o SeasonSelector
            optimizedData.seasons = data.seasons?.map((s: any) => ({
                id: s.id,
                season_number: s.season_number,
                name: s.name,
                episode_count: s.episode_count,
                air_date: s.air_date
            })) || [];

            // Processar TODAS as temporadas que foram buscadas (SSR completo)
            optimizedData.allSeasons = {};
            for (let i = 0; i < seasonsResults.length; i++) {
                const seasonRes = seasonsResults[i];
                if (seasonRes && seasonRes.ok) {
                    const seasonData = await seasonRes.json();
                    const seasonNum = i + 1;
                    optimizedData.allSeasons[seasonNum] = seasonData.episodes?.map((ep: any) => ({
                        id: ep.id,
                        name: ep.name,
                        overview: ep.overview,
                        episode_number: ep.episode_number,
                        season_number: ep.season_number,
                        still_path: ep.still_path,
                        runtime: ep.runtime
                    })) || [];
                }
            }
        }

        // Cast (top 10)
        if (data.credits?.cast) {
            optimizedData.credits = {
                cast: data.credits.cast.slice(0, 10).map((person: any) => ({
                    id: person.id,
                    name: person.name,
                    character: person.character,
                    profile_path: person.profile_path
                }))
            };
        }

        // Vídeos (apenas trailers)
        if (data.videos?.results) {
            optimizedData.videos = {
                results: data.videos.results
                    .filter((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
                    .slice(0, 3)
                    .map((v: any) => ({
                        id: v.id,
                        key: v.key,
                        name: v.name,
                        type: v.type
                    }))
            };
        }

        // Recommendations (top 10)
        if (data.recommendations?.results && data.recommendations.results.length > 0) {
            optimizedData.recommendations = {
                results: data.recommendations.results
                    .slice(0, 10)
                    .map((item: any) => ({
                        id: item.id,
                        title: item.title,
                        name: item.name,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        vote_average: item.vote_average,
                        media_type: type, // Recomendações do mesmo tipo da mídia atual
                        release_date: item.release_date,
                        first_air_date: item.first_air_date
                    }))
            };
        }

        return optimizedData;
    } catch (error) {
        console.error('Error fetching media details:', error);
        return null;
    }
}

export default async function MediaDetailsPage({ params }: PageProps) {
    const { type, id } = await params;

    // Valida o tipo
    if (type !== 'movie' && type !== 'tv') {
        notFound();
    }

    // Busca sessão e detecta idioma do usuário
    const headersList = await headers();
    const tc = await getTranslations('common');
    const acceptLanguage = headersList.get('accept-language');
    const session = await auth.api.getSession({ headers: headersList });
    const language = await getUserLanguage(session?.user?.id, acceptLanguage);

    // Busca dados da mídia com idioma do usuário
    const media = await getMediaDetails(type, id, language);

    if (!media) {
        notFound();
    }

    // Verificar se o item está na watchlist do usuário + buscar progresso de episódios
    let isInWatchlist = false;
    let episodeProgress: Record<string, number> = {};

    if (session?.user?.id) {
        const { prisma } = await import('@/lib/prisma');

        // Buscar watchlist e progresso de episódios em paralelo (1 chamada cada)
        const [watchlistItem, watchHistory] = await Promise.all([
            prisma.watchlist.findFirst({
                where: {
                    userId: session.user.id,
                    tmdbId: parseInt(id),
                    mediaType: type,
                },
            }),
            type === 'tv'
                ? prisma.watchHistory.findMany({
                    where: {
                        userId: session.user.id,
                        tmdbId: parseInt(id),
                        mediaType: 'tv',
                    },
                    select: {
                        seasonNumber: true,
                        episodeNumber: true,
                        progress: true,
                    },
                })
                : Promise.resolve([]),
        ]);

        isInWatchlist = !!watchlistItem;

        // Converter para mapa: "season-episode" → progress
        for (const item of watchHistory) {
            episodeProgress[`${item.seasonNumber}-${item.episodeNumber}`] = item.progress;
        }
    }

    const isTVShow = type === 'tv';

    // JSON-LD structured data para Google rich results
    const ts = await getTranslations('mediaSeo');
    const tm = await getTranslations('metadata');
    const noTitle = ts('noTitle');
    const jsonLd = isTVShow
        ? generateTVSeriesJsonLd(media, noTitle)
        : generateMovieJsonLd(media, noTitle);

    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: isTVShow ? tc('tvShows') : tc('movies'), path: isTVShow ? '/tv' : '/movies' },
        { name: media.title || media.name || tc('details') },
    ], tm('breadcrumbHome'));

    return (
        <>
            <JsonLd id="media-schema" data={jsonLd} />
            <JsonLd id="media-breadcrumb" data={breadcrumbJsonLd} />
            <MediaDetailsClient media={media} mediaType={type} mediaId={id} initialSession={session} initialFavorited={isInWatchlist} episodeProgress={episodeProgress} />
        </>
    );
}

import { prisma } from '@/lib/prisma';
import { TMDB_API_URL, TMDB_API_KEY, SITE_LANGUAGE } from '@/lib/config';
import { COMPLETION_THRESHOLD, MINIMUM_PROGRESS_THRESHOLD } from '@/lib/watch-constants';

/**
 * Re-export the shared constants for convenience in server-side code.
 */
export { COMPLETION_THRESHOLD, MINIMUM_PROGRESS_THRESHOLD } from '@/lib/watch-constants';

/**
 * Result of computing the resume point for a TV series.
 */
export interface ResumeEpisodeResult {
    /** Season number to resume from */
    season: number;
    /** Episode number to resume from */
    episode: number;
    /** Progress percentage of this episode (0 = unwatched, > 0 = in progress) */
    progress: number;
}

/**
 * Minimal shape required from watch history records for resume computation.
 */
interface WatchHistoryRecord {
    seasonNumber: number;
    episodeNumber: number;
    progress: number;
    lastWatchedAt: Date;
}

/**
 * Minimal shape required from TMDB series data (seasons array).
 */
interface TMDBSeasonInfo {
    season_number: number;
    episode_count: number;
}

/**
 * Pure computation: resolves the resume episode from pre-loaded data.
 * No DB or API calls — all data must be provided.
 *
 * @param episodes - Pre-loaded watch history records for this series
 * @param seasons - TMDB season data (filtered, season_number > 0). Pass null to skip boundary checks.
 */
export function resolveResumeEpisode(
    episodes: WatchHistoryRecord[],
    seasons: TMDBSeasonInfo[] | null,
): ResumeEpisodeResult {
    // No history → start from S1E1
    if (episodes.length === 0) {
        return { season: 1, episode: 1, progress: 0 };
    }

    // 1. Check for in-progress episodes (MINIMUM_PROGRESS_THRESHOLD < progress < threshold)
    const inProgressEpisodes = episodes
        .filter(ep => ep.progress >= MINIMUM_PROGRESS_THRESHOLD && ep.progress < COMPLETION_THRESHOLD)
        .sort((a, b) =>
            new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
        );

    if (inProgressEpisodes.length > 0) {
        const current = inProgressEpisodes[0];
        return {
            season: current.seasonNumber,
            episode: current.episodeNumber,
            progress: current.progress,
        };
    }

    // 2. All watched episodes are completed — find the furthest completed
    const completedEpisodes = episodes
        .filter(ep => ep.progress >= COMPLETION_THRESHOLD)
        .sort((a, b) => {
            if (a.seasonNumber !== b.seasonNumber) return b.seasonNumber - a.seasonNumber;
            return b.episodeNumber - a.episodeNumber;
        });

    if (completedEpisodes.length === 0) {
        return { season: 1, episode: 1, progress: 0 };
    }

    const furthestCompleted = completedEpisodes[0];

    // Without TMDB season data, return next episode (best effort)
    if (!seasons || seasons.length === 0) {
        return {
            season: furthestCompleted.seasonNumber,
            episode: furthestCompleted.episodeNumber + 1,
            progress: 0,
        };
    }

    // 3. Iterate forward from furthestCompleted to find next unwatched episode
    let nextSeason = furthestCompleted.seasonNumber;
    let nextEpisode = furthestCompleted.episodeNumber + 1;

    for (let i = 0; i < 200; i++) {
        const seasonInfo = seasons.find(s => s.season_number === nextSeason);

        if (!seasonInfo) {
            return { season: 1, episode: 1, progress: 0 };
        }

        if (nextEpisode > seasonInfo.episode_count) {
            const nextS = seasons.find(s => s.season_number === nextSeason + 1);
            if (nextS && nextS.episode_count > 0) {
                nextSeason = nextS.season_number;
                nextEpisode = 1;
            } else {
                return { season: 1, episode: 1, progress: 0 };
            }
            continue;
        }

        const existingEp = episodes.find(
            ep => ep.seasonNumber === nextSeason && ep.episodeNumber === nextEpisode
        );

        if (!existingEp || existingEp.progress < COMPLETION_THRESHOLD) {
            return {
                season: nextSeason,
                episode: nextEpisode,
                progress: existingEp?.progress || 0,
            };
        }

        nextEpisode++;
    }

    return { season: 1, episode: 1, progress: 0 };
}

/**
 * Convenience wrapper: fetches watch history + TMDB data, then resolves.
 * Use this when you don't already have the data loaded.
 *
 * Costs: 1 DB query + 1 TMDB fetch (conditional).
 */
export async function computeResumeEpisode(
    userId: string,
    tmdbId: number,
    language = SITE_LANGUAGE
): Promise<ResumeEpisodeResult> {
    const episodes = await prisma.watchHistory.findMany({
        where: { userId, tmdbId, mediaType: 'tv' },
        orderBy: { lastWatchedAt: 'desc' },
    });

    // Early exit: no need for TMDB data if there's an in-progress episode or no history
    const hasInProgress = episodes.some(
        ep => ep.progress >= MINIMUM_PROGRESS_THRESHOLD && ep.progress < COMPLETION_THRESHOLD
    );
    if (episodes.length === 0 || hasInProgress) {
        return resolveResumeEpisode(episodes, null);
    }

    // Need TMDB data to resolve season boundaries
    const seriesRes = await fetch(
        `${TMDB_API_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}`
    );

    if (!seriesRes.ok) {
        return resolveResumeEpisode(episodes, null);
    }

    const seriesData = await seriesRes.json();
    const seasons: TMDBSeasonInfo[] = (seriesData.seasons || [])
        .filter((s: { season_number: number }) => s.season_number > 0);

    return resolveResumeEpisode(episodes, seasons);
}

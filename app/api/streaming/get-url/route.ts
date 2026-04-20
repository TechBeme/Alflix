import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APP_URL, STREAMING_API_URL, STREAMING_API_TOKEN } from '@/lib/config';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * Streaming proxy endpoint that validates authentication and forwards requests to external backend.
 * 
 * This endpoint doesn't know where videos come from - it only validates auth/plans and proxies
 * requests to STREAMING_API_URL configured in environment variables.
 * 
 * @see /docs/STREAMING_API_IMPLEMENTATION.md for backend implementation guide
 */

// Schema de validação para query parameters
const streamingQuerySchema = z.object({
    tmdbId: z.coerce.number().int().positive('api.validation.positiveInteger'),
    mediaType: z.enum(['movie', 'tv'], {
        message: 'api.validation.mediaTypeMovieOrTv'
    }),
    season: z.coerce.number().int().positive().optional(),
    episode: z.coerce.number().int().positive().optional(),
}).refine(
    (data) => {
        // Se mediaType é 'tv', season e episode são opcionais mas recomendados
        // Se mediaType é 'movie', season e episode não devem existir
        if (data.mediaType === 'movie' && (data.season || data.episode)) {
            return false;
        }
        return true;
    },
    {
        message: 'api.validation.movieNoSeasonEpisode',
        path: ['mediaType'],
    }
);

export async function GET(request: NextRequest) {
    try {
        // 1. Validar query params com Zod
        const { searchParams } = request.nextUrl;
        const paramsObject = Object.fromEntries(searchParams.entries());

        const validationResult = streamingQuerySchema.safeParse(paramsObject);

        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            return NextResponse.json(
                {
                    success: false,
                    error: firstError.message
                },
                { status: 400 }
            );
        }

        const { tmdbId, mediaType, season, episode } = validationResult.data;
        // 2. Validar autenticação
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user?.id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.authRequired'
                },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`streaming:url:${session.user.id}`, {
            limit: 30,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { success: false, error: 'api.errors.rateLimitShort' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // 3. Validar acesso e buscar plano em paralelo
        const { hasStreamingAccess, getUserPlanInfo } = await import('@/lib/access');
        const [hasAccess, planInfo] = await Promise.all([
            hasStreamingAccess(session.user.id),
            getUserPlanInfo(session.user.id),
        ]);

        if (!hasAccess) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.subscriptionRequired'
                },
                { status: 403 }
            );
        }

        if (!planInfo) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.planNotFound'
                },
                { status: 500 }
            );
        }

        let streamingApiUrl = STREAMING_API_URL;

        // Fallback to example backend in development mode
        if (!streamingApiUrl || streamingApiUrl.trim() === '') {
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️  [Streaming] STREAMING_API_URL não configurada - usando backend de exemplo');
                streamingApiUrl = `${APP_URL}/api/streaming/example`;
            } else {
                console.error('❌ [Streaming] ERRO: STREAMING_API_URL não configurada em produção!');
                console.error('Configure STREAMING_API_URL no arquivo .env ou nas variáveis de ambiente.');
                return NextResponse.json(
                    {
                        success: false,
                        error: 'api.streaming.serverNotConfigured'
                    },
                    { status: 500 }
                );
            }
        }

        const payload = {
            tmdbId,
            mediaType,
            userId: session.user.id,
            userEmail: session.user.email || 'anonymous',
            userName: session.user.name || 'User',
            userPlan: planInfo.planName,
            maxScreens: planInfo.maxScreens,
            ...(season && { season }),
            ...(episode && { episode }),
        };
        const apiToken = STREAMING_API_TOKEN;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
        }

        const response = await fetch(streamingApiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('❌ External API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to get video: ${response.statusText}`
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (!data.url) {
            console.error('❌ External API did not return URL:', data);
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.urlNotAvailable'
                },
                { status: 500 }
            );
        }

        // Track viewing history for analytics
        // Determinar season/episode baseado em mediaType
        const seasonNumber = mediaType === 'tv' ? (season || 1) : 0;
        const episodeNumber = mediaType === 'tv' ? (episode || 1) : 0;

        await prisma.watchHistory.upsert({
            where: {
                userId_tmdbId_mediaType_seasonNumber_episodeNumber: {
                    userId: session.user.id,
                    tmdbId,
                    mediaType,
                    seasonNumber,
                    episodeNumber,
                },
            },
            update: {
                lastWatchedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                tmdbId,
                mediaType,
                seasonNumber,
                episodeNumber,
                progress: 0,
            },
        }).catch((error: any) => {
            console.error('Failed to track watch history:', error.message);
        });

        return NextResponse.json({
            success: true,
            url: data.url,
            ...(data.qualities && { qualities: data.qualities }),
            ...(data.defaultQuality && { defaultQuality: data.defaultQuality }),
            ...(data.subtitles && { subtitles: data.subtitles }),
            ...(data.audioTracks && { audioTracks: data.audioTracks }),
            ...(data.expiresAt && { expiresAt: data.expiresAt }),
            ...(data.quality && { quality: data.quality }),
        });

    } catch (error: any) {
        console.error('❌ Streaming proxy error:', error);

        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.timeout'
                },
                { status: 504 }
            );
        }

        if (error.cause?.code === 'ECONNREFUSED') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'api.streaming.serverUnavailable'
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'api.errors.internalError'
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { z } from 'zod';
import { SUPPORTED_LANGUAGES, parseAcceptLanguage } from '@/lib/language';

// Schema de validação para preferências
const preferencesSchema = z.object({
    language: z.enum(SUPPORTED_LANGUAGES as unknown as [string, ...string[]]).optional(),
    autoplayNext: z.boolean().optional(),
    autoplayTrailer: z.boolean().optional(),
    subtitleEnabled: z.boolean().optional(),
    subtitleLang: z.string().min(2).max(10).optional(),
    subtitleSize: z.enum(['small', 'medium', 'large', 'xlarge']).optional(),
    subtitleColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (#RRGGBB)').optional(),
    subtitleBg: z.string().optional(),
    subtitleFont: z.enum(['default', 'serif', 'mono', 'casual']).optional(),
    emailNewReleases: z.boolean().optional(),
    emailRecommendations: z.boolean().optional(),
    emailAccountAlerts: z.boolean().optional(),
    emailMarketing: z.boolean().optional(),
    pushNewReleases: z.boolean().optional(),
    pushRecommendations: z.boolean().optional(),
    pushAccountAlerts: z.boolean().optional(),
}).strict();

/**
 * API para gerenciar preferências do usuário
 * - GET: Buscar preferências
 * - PUT: Atualizar preferências
 */

// GET - Buscar preferências
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`prefs:get:${session.user.id}`, {
            limit: 30,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitExceeded' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: session.user.id },
        });

        // Detectar idioma do browser para defaults
        const headersList = await headers();
        const acceptLanguage = headersList.get('accept-language');
        const defaultLanguage = parseAcceptLanguage(acceptLanguage);

        // Retorna preferências ou defaults
        return NextResponse.json({
            preferences: preferences ?? {
                language: defaultLanguage,
                autoplayNext: true,
                autoplayTrailer: true,
                subtitleEnabled: false,
                subtitleLang: defaultLanguage,
                subtitleSize: 'medium',
                subtitleColor: '#FFFFFF',
                subtitleBg: 'transparent',
                subtitleFont: 'default',
                emailNewReleases: true,
                emailRecommendations: true,
                emailAccountAlerts: true,
                emailMarketing: false,
                pushNewReleases: true,
                pushRecommendations: false,
                pushAccountAlerts: true,
            },
        });
    } catch (error) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json(
            { error: 'api.settings.preferencesError' },
            { status: 500 }
        );
    }
}

// PUT - Atualizar preferências
export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        const rateLimitResult = rateLimit(`preferences:put:${session.user.id}`, {
            limit: 30,
            interval: 60,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitShort' },
                { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Validar e parsear body
        const body = await request.json();

        const validation = preferencesSchema.safeParse(body);
        if (!validation.success) {
            const errorMessage = validation.error.issues[0]?.message || 'api.errors.badRequest';
            return NextResponse.json(
                { error: errorMessage },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        const data = validation.data;

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: 'api.settings.noValidFields' },
                { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // Upsert para criar ou atualizar
        await prisma.userPreferences.upsert({
            where: { userId: session.user.id },
            update: data,
            create: {
                userId: session.user.id,
                ...data,
            },
        });

        // Retorna apenas sucesso - frontend já tem os dados
        return new NextResponse(null, {
            status: 204,
            headers: getRateLimitHeaders(rateLimitResult)
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        return NextResponse.json(
            { error: 'api.settings.updatePreferencesError' },
            { status: 500 }
        );
    }
}

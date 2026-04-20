import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

/**
 * API para buscar e cachear geolocalização da sessão atual
 * 
 * Segurança:
 * - Autenticação obrigatória via Better Auth cookies
 * - Usa sessionId da sessão autenticada (NUNCA do frontend)
 * - Valida que a sessão pertence ao usuário logado
 * - Rate limiting (30 req/hora)
 * - Usa ipAddress da sessão armazenado no banco (NUNCA do frontend)
 * 
 * Usa ipapi.co (gratuito, 1000 req/dia sem key).
 * 
 * Retorna: { city, country, countryCode, cached }
 * 
 * @route POST /api/sessions/geolocate
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Autenticação obrigatória
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: 'api.errors.unauthenticated' },
                { status: 401 }
            );
        }

        // 2. Rate limiting
        const rateLimitResult = rateLimit(`geolocate:${session.user.id}`, {
            limit: 30,
            interval: 3600, // 1 hora
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'api.errors.rateLimitRetry' },
                {
                    status: 429,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // 3. Buscar dados da sessão atual do banco
        const currentSession = await prisma.session.findUnique({
            where: { id: session.session.id },
            select: {
                id: true,
                userId: true,
                ipAddress: true,
                geoCity: true,
                geoCountry: true,
                geoCountryCode: true,
            },
        }) as {
            id: string;
            userId: string;
            ipAddress: string | null;
            geoCity?: string | null;
            geoCountry?: string | null;
            geoCountryCode?: string | null;
        } | null;

        if (!currentSession) {
            return NextResponse.json(
                { error: 'api.sessions.notFound' },
                { status: 404 }
            );
        }

        // 4. Validar ownership (segurança adicional)
        if (currentSession.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'api.errors.forbidden' },
                { status: 403 }
            );
        }

        const ipAddress = currentSession.ipAddress;

        // 5. Se já tem geodata, retornar cache
        if (currentSession.geoCity && currentSession.geoCountry) {
            return NextResponse.json(
                {
                    city: currentSession.geoCity,
                    country: currentSession.geoCountry,
                    countryCode: currentSession.geoCountryCode,
                    cached: true,
                },
                { headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // 6. IPs localhost/privados não fazem lookup
        if (
            !ipAddress ||
            ipAddress.startsWith('127.') ||
            ipAddress.startsWith('192.168.') ||
            ipAddress.startsWith('10.') ||
            ipAddress === '::1' ||
            ipAddress.match(/^0+:0+:0+:0+:0+:0+:0+:0+$/)
        ) {
            // Salvar como local
            await prisma.session.update({
                where: { id: currentSession.id },
                data: {
                    geoCity: 'Local',
                    geoCountry: 'Local',
                    geoCountryCode: null,
                } as any,
            });

            return NextResponse.json(
                {
                    city: 'Local',
                    country: 'Local',
                    countryCode: null,
                    cached: false,
                },
                { headers: getRateLimitHeaders(rateLimitResult) }
            );
        }

        // 7. Buscar geolocalização via API externa
        try {
            const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
                headers: { 'User-Agent': 'ALLFLIX/1.0' },
            });

            if (!geoResponse.ok) {
                throw new Error('api.sessions.processError');
            }

            const geoData = await geoResponse.json();

            const city = geoData.city || 'api.sessions.unknown';
            const country = geoData.country_name || 'api.sessions.unknown';
            const countryCode = geoData.country_code || null;

            // Salvar no banco para cache
            await prisma.session.update({
                where: { id: currentSession.id },
                data: {
                    geoCity: city,
                    geoCountry: country,
                    geoCountryCode: countryCode,
                } as any,
            });

            return NextResponse.json(
                {
                    city,
                    country,
                    countryCode,
                    cached: false,
                },
                { headers: getRateLimitHeaders(rateLimitResult) }
            );
        } catch (geoError) {
            // Falha no lookup - salvar como desconhecido
            await prisma.session.update({
                where: { id: currentSession.id },
                data: {
                    geoCity: 'api.sessions.unknown',
                    geoCountry: 'api.sessions.unknown',
                    geoCountryCode: null,
                } as any,
            });

            return NextResponse.json(
                {
                    city: 'api.sessions.unknown',
                    country: 'api.sessions.unknown',
                    countryCode: null,
                    cached: false,
                },
                { headers: getRateLimitHeaders(rateLimitResult) }
            );
        }
    } catch (error) {
        console.error('Erro ao buscar geolocalização:', error);
        return NextResponse.json(
            { error: 'api.sessions.processError' },
            { status: 500 }
        );
    }
}

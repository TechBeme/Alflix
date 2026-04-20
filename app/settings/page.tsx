import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createMetadata } from '@/lib/seo';
import SettingsPageClient from './SettingsPageClient';
import { getTranslations, getLocale } from 'next-intl/server';
import { parseAcceptLanguage, localeToOpenGraph } from '@/lib/language';

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('settings');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('description'),
        path: '/settings',
        keywords: tm('keywordsSettings').split(', '),
        noIndex: true,
        locale: ogLocale,
    });
}

/**
 * Settings Page - Server Component
 * 
 * ✅ OTIMIZADO: 1 única query Prisma traz todos os dados necessários:
 * - Plano e trial do usuário
 * - Preferências (legendas, notificações, idioma)
 * - Sessões ativas (dispositivos conectados)
 * - Família (se owner) com membros e convites
 * - Membership (se member) com dados do owner
 * 
 * Redireciona para login se não autenticado.
 */
export default async function SettingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/login?redirect=/settings');
    }

    // ✅ OTIMIZAÇÃO: 1 ÚNICA QUERY traz absolutamente tudo
    // User com plano, preferências, sessões, família (owner) e membership (member)
    const userData = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            plan: true,
            preferences: true,
            sessions: {
                orderBy: { createdAt: 'desc' },
            },
            ownedFamily: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatarIcon: true,
                                    avatarColor: true,
                                }
                            }
                        },
                        orderBy: { joinedAt: 'asc' },
                    },
                    invites: {
                        where: { status: 'pending', expiresAt: { gt: new Date() } },
                        orderBy: { createdAt: 'desc' },
                    },
                },
            },
            familyMember: {
                include: {
                    family: {
                        include: {
                            owner: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatarIcon: true,
                                    avatarColor: true,
                                }
                            },
                        },
                    },
                },
            },
        },
    });

    if (!userData) {
        redirect('/login?redirect=/settings');
    }

    // Extrai dados relacionados da query única
    const preferences = userData.preferences;
    const family = userData.ownedFamily;
    const familyMembership = userData.familyMember[0] ?? null;
    const sessions = userData.sessions;

    // Detectar idioma do browser para defaults
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    const defaultLanguage = parseAcceptLanguage(acceptLanguage);

    // Criar preferências default se não existir
    const userPreferences = preferences ?? {
        id: '',
        userId: session.user.id,
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
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    return (
        <SettingsPageClient
            initialSession={{
                ...session,
                user: {
                    ...session.user,
                    name: userData.name ?? session.user.name,
                    avatarIcon: userData.avatarIcon,
                    avatarColor: userData.avatarColor,
                },
            } as typeof session}
            initialPreferences={userPreferences}
            userPlan={userData.plan}
            trialEndsAt={userData.trialEndsAt?.toISOString() ?? null}
            family={family}
            familyMembership={familyMembership}
            maxScreens={userData.maxScreens}
            initialSessions={sessions}
        />
    );
}

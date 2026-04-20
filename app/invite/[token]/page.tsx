import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SITE_NAME_FULL } from '@/lib/config';
import { createMetadata } from '@/lib/seo';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { Users, XCircle, ArrowRight } from 'lucide-react';
import InviteAcceptButton from './InviteAcceptButton';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('invite');
    return createMetadata({
        title: t('title'),
        description: t('metaDescription', { siteName: SITE_NAME_FULL }),
        path: '/invite',
        noIndex: true,
        locale: ogLocale,
    });
}

interface InvitePageProps {
    params: Promise<{ token: string }>;
}

/**
 * Invite Accept Page - Server Component
 * 
 * Valida o token do convite e mostra informações da família.
 * Se o usuário não estiver logado, redireciona para login.
 */
export default async function InvitePage({ params }: InvitePageProps) {
    const { token } = await params;

    const t = await getTranslations('invite');

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect(`/login?redirect=/invite/${token}`);
    }

    // Buscar convite
    const invite = await prisma.familyInvite.findUnique({
        where: { token },
        include: {
            family: {
                include: {
                    owner: {
                        select: { name: true, email: true },
                    },
                    members: true,
                },
            },
        },
    });

    // Validar email se o convite especificou um email
    if (invite && invite.email) {
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true },
        });

        if (currentUser?.email?.toLowerCase() !== invite.email.toLowerCase()) {
            // Não mostrar detalhes da família para usuário com email incorreto
            return (
                <div className="min-h-screen flex items-center justify-center p-4" style={{ background: GRADIENTS.pageContent }}>
                    <div
                        className="w-full max-w-md rounded-2xl p-8 border border-white/[0.06] shadow-2xl shadow-black/40"
                        style={{ background: GRADIENTS.surface }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-red-500/10">
                                <XCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">{t('notAvailable')}</h1>
                            <p className="text-gray-400 mb-6">{t('wrongEmail')}</p>

                            <Link
                                href="/settings"
                                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                {t('goToSettings')}
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Validações
    const isExpired = invite ? new Date(invite.expiresAt) < new Date() : false;
    const isUsed = invite?.status !== 'pending';
    const isSelf = invite?.family.ownerId === session.user.id;
    const isAlreadyMember = invite?.family.members.some(m => m.userId === session.user.id);
    const slotsAvailable = invite ? (invite.family.maxMembers - invite.family.members.length - 1) > 0 : false;

    const isValid = invite && !isExpired && !isUsed && !isSelf && !isAlreadyMember && slotsAvailable;

    let errorMessage = '';
    if (!invite) {
        errorMessage = t('notFound');
    } else if (isExpired) {
        errorMessage = t('expired');
    } else if (isUsed) {
        errorMessage = t('alreadyUsed');
    } else if (isSelf) {
        errorMessage = t('cannotAcceptOwn');
    } else if (isAlreadyMember) {
        errorMessage = t('alreadyMember');
    } else if (!slotsAvailable) {
        errorMessage = t('familyFull');
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: GRADIENTS.pageContent }}>
            <div
                className="w-full max-w-md rounded-2xl p-8 border border-white/[0.06] shadow-2xl shadow-black/40"
                style={{ background: GRADIENTS.surface }}
            >
                {isValid ? (
                    <>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${COLORS.primary}20` }}>
                                <Users className="w-8 h-8" style={{ color: COLORS.primary }} aria-hidden="true" />
                            </div>

                            <h1 className="text-2xl font-bold text-white mb-2">{t('familyInvite')}</h1>
                            <p className="text-gray-400 mb-6">
                                <span className="text-white font-medium">{invite.family.owner.name || invite.family.owner.email}</span>
                                {' '}{t('invitedBy', { siteName: SITE_NAME_FULL })}
                            </p>

                            <div className="w-full bg-white/[0.03] rounded-xl p-4 mb-6 border border-white/[0.06]">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-400">{t('members')}</span>
                                    <span className="text-sm text-white font-medium">
                                        {invite.family.members.length + 1} / {invite.family.maxMembers}
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${((invite.family.members.length + 1) / invite.family.maxMembers) * 100}%`,
                                            backgroundColor: COLORS.primary,
                                        }}
                                    />
                                </div>
                            </div>

                            <InviteAcceptButton token={token} />

                            <p className="text-xs text-gray-500 mt-4">
                                {t('disclaimer')}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-red-500/10">
                            <XCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">{t('invalid')}</h1>
                        <p className="text-gray-400 mb-6">{errorMessage}</p>

                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            {t('goToSettings')}
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

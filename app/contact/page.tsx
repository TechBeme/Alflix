import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import ContactPageClient from './ContactPageClient';
import { SITE_NAME_FULL } from '@/lib/config';
import { createMetadata } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('contact');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('description', { siteName: SITE_NAME_FULL }),
        path: '/contact',
        keywords: tm('keywordsContact').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

/**
 * Contact Page - Server Component wrapper
 * 
 * Busca a sessão no servidor e passa para o componente client.
 * Isso evita o flash de "Entrar/Assinar" na Navbar.
 */
export default async function ContactPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return <ContactPageClient initialSession={session} />;
}


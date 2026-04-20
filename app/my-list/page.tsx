import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import { auth } from '@/lib/auth';
import { GRADIENTS } from '@/lib/theme';
import { createMetadata } from '@/lib/seo';
import MyListClient from './MyListClient';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

/**
 * My List Page - Híbrida (Auth server-side + dados em CSR)
 * 
 * Arquitetura:
 * 1. Server Component valida autenticação e protege rota
 * 2. Client Component busca dados via API (CSR)
 * 3. TanStack Query gerencia cache, paginação e refetch
 * 
 * Motivo:
 * - Evita snapshot stale de dados da watchlist em navegação client-side
 * - Garante dados atualizados ao retornar para a rota
 */

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('myList');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('description'),
        path: '/my-list',
        keywords: tm('keywordsMyList').split(', '),
        locale: ogLocale,
        noIndex: true,
    });
}

export default async function MyListPage() {
    // Obter headers UMA VEZ e reusar
    const headersList = await headers();

    // Verificar autenticação no servidor (SSR)
    const session = await auth.api.getSession({ headers: headersList });

    if (!session) {
        redirect('/login?redirect=/my-list');
    }

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <NavbarWrapper />

            {/* Client Component com dados via API (CSR) */}
            <MyListClient userId={session.user.id} />

            <Footer />
        </div>
    );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { createMetadata } from '@/lib/seo';
import { getCachedGenres } from '@/lib/genres-cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserLanguage } from '@/lib/language-server';
import SearchPageClient from './SearchPageClient';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

/**
 * Search Page - Hybrid Rendering
 * 
 * ARQUITETURA OTIMIZADA:
 * ================================
 * 
 * SSR (Server-Side):
 * - Gêneros (cache 24h, muda raramente)
 * - Autenticação via cookies (automático no middleware)
 * 
 * CSR (Client-Side):
 * - Busca de conteúdo (1 requisição: /api/search)
 * - Scroll infinito
 * - Filtros dinâmicos
 * 
 * PERFORMANCE:
 * - Gêneros: SSR com cache agressivo (24h)
 * - Watchlist: incluída na resposta do /api/search
 * - Total: 1 requisição por busca (vs 4 anterior)
 * 
 * SEO Otimizado:
 * - Metadados estáticos no Server Component
 * - Schema.org JSON-LD
 * - OpenGraph completo
 * - Twitter Cards
 * - Canonical URLs
 * 
 * Segurança:
 * - Autenticação via cookies (Better Auth)
 * - Validações no cliente E no servidor
 * - Rate limiting na API
 * - Sanitização de inputs
 */

// Metadados dinâmicos para SEO com i18n
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('search');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('description'),
        path: '/search',
        keywords: tm('keywordsSearch').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

/**
 * Server Component - Busca dados SSR e delega para client
 */
export default async function SearchPage() {
    // Buscar sessão do usuário para obter preferências de idioma
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    // Detectar idioma: banco → header → padrão
    const acceptLanguage = headersList.get('accept-language');
    const userLanguage = await getUserLanguage(session?.user?.id, acceptLanguage);

    // Buscar gêneros no servidor (cache 24h) com idioma detectado
    const genres = await getCachedGenres(userLanguage);

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <SearchPageClient genresData={genres} />
        </Suspense>
    );
}
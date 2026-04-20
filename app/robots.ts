import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * Robots.txt dinâmico para SEO otimizado.
 *
 * - Permite indexação de todas as páginas públicas
 * - Bloqueia páginas privadas (settings, my-list, watch, login)
 * - Inclui referência ao sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
    const siteUrl = SITE_URL;

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/settings',
                    '/my-list',
                    '/watch/',
                    '/login',
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}

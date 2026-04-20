import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COLORS, GRADIENTS } from '@/lib/theme';
import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { getTranslations } from 'next-intl/server';

import { SITE_NAME_FULL } from '@/lib/config';

export async function generateMetadata() {
    const t = await getTranslations('notFound');
    return {
        title: t('title'),
        description: t('description'),
        robots: { index: false, follow: true },
    };
}

/**
 * Not Found Page - 404 error page (SSR)
 * 
 * This page is shown when a user navigates to a route that doesn't exist.
 * 
 * Features:
 * - Server-side rendering for better SEO
 * - User-friendly 404 message
 * - Navigation options
 * - Consistent with site design
 * - SSR session check with NavbarWrapper
 * 
 * Used in: Automatically by Next.js for 404 errors
 */
export default async function NotFound() {
    const t = await getTranslations('notFound');
    const tc = await getTranslations('common');

    return (
        <div className="min-h-screen flex flex-col" style={{ background: GRADIENTS.pageLanding }}>
            <NavbarWrapper />

            <div className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="max-w-2xl w-full text-center">
                    {/* 404 Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${COLORS.primary}20` }}
                        >
                            <FileQuestion
                                className="w-10 h-10"
                                style={{ color: COLORS.primary }}
                                aria-hidden="true"
                            />
                        </div>
                    </div>

                    {/* 404 Number */}
                    <h1
                        className="text-8xl md:text-9xl font-bold mb-4"
                        style={{
                            background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryLight})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        404
                    </h1>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {t('title')}
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-gray-400 mb-8">
                        {t('descriptionFull')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/">
                            <Button
                                size="lg"
                                className="gap-2 w-full sm:w-auto"
                            >
                                <Home className="w-5 h-5" aria-hidden="true" />
                                {t('goHome')}
                            </Button>
                        </Link>

                        <BackButton />
                    </div>

                    {/* Quick Links */}
                    <div className="mt-12 pt-8 border-t border-white/[0.06]">
                        <p className="text-sm text-gray-500 mb-4">
                            {t('popularPages')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/catalog"
                                className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {t('catalog')}
                            </Link>
                            <Link
                                href="/movies"
                                className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {tc('movies')}
                            </Link>
                            <Link
                                href="/tv"
                                className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {tc('tvShows')}
                            </Link>
                            <Link
                                href="/about"
                                className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {t('aboutUs')}
                            </Link>
                            <Link
                                href="/contact"
                                className="text-gray-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                            >
                                {t('contact')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

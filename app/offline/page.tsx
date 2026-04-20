'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { SITE_NAME_FULL } from '@/lib/config';
import { useTranslations } from 'next-intl';

/**
 * Offline Fallback Page
 *
 * Displayed when the user has no internet connection and the requested
 * page isn't available in the Service Worker cache.
 *
 * Features:
 * - Clean, branded offline experience
 * - Retry button to reload when connection is restored
 * - Go home button as primary action
 * - Consistent with site design system
 */
export default function OfflinePage() {
    const t = useTranslations('pwa');

    return (
        <div className="min-h-screen flex flex-col" style={{ background: GRADIENTS.pageLanding }}>
            <main className="flex-1 flex items-center justify-center px-4 py-20" role="main" aria-label={t('offlineTitle')}>
                <div className="max-w-lg w-full text-center">
                    {/* Offline Icon */}
                    <div className="flex justify-center mb-6" aria-hidden="true">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
                            style={{ backgroundColor: `${COLORS.primary}15` }}
                        >
                            <WifiOff
                                className="w-12 h-12"
                                style={{ color: COLORS.primary }}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <h1
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{
                            background: `linear-gradient(to right, ${COLORS.text.white}, ${COLORS.text.gray300})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        {t('offlineTitle')}
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                        {t('offlineDescription')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label={t('actions')}>
                        <Button
                            size="lg"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                            aria-label={t('retry')}
                        >
                            <RefreshCw className="w-5 h-5" aria-hidden="true" />
                            {t('retry')}
                        </Button>

                        <Link href="/">
                            <Button
                                size="lg"
                                variant="outline"
                                className="gap-2 w-full"
                                aria-label={t('goHome')}
                            >
                                <Home className="w-5 h-5" aria-hidden="true" />
                                {t('goHome')}
                            </Button>
                        </Link>
                    </div>

                    {/* Tips */}
                    <div
                        className="mt-12 p-6 rounded-xl border"
                        style={{
                            background: GRADIENTS.surface,
                            borderColor: COLORS.border.light,
                        }}
                    >
                        <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                            {t('offlineTips')}
                        </h2>
                        <ul className="text-sm text-gray-400 space-y-2 text-left" role="list">
                            <li className="flex items-start gap-2">
                                <span style={{ color: COLORS.primary }} aria-hidden="true">•</span>
                                {t('offlineTip1')}
                            </li>
                            <li className="flex items-start gap-2">
                                <span style={{ color: COLORS.primary }} aria-hidden="true">•</span>
                                {t('offlineTip2')}
                            </li>
                            <li className="flex items-start gap-2">
                                <span style={{ color: COLORS.primary }} aria-hidden="true">•</span>
                                {t('offlineTip3')}
                            </li>
                        </ul>
                    </div>

                    {/* Branding */}
                    <p className="mt-8 text-sm text-gray-600">
                        {SITE_NAME_FULL}
                    </p>
                </div>
            </main>
        </div>
    );
}

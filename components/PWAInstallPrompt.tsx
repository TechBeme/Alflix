/**
 * PWA Install Prompt Component
 *
 * Displays a non-intrusive banner prompting users to install the app.
 * Uses the `beforeinstallprompt` event to trigger the native install flow.
 *
 * Features:
 * - Dismissable with 30-day snooze (localStorage)
 * - Responsive design (mobile/desktop)
 * - Animated entrance/exit with framer-motion
 * - Follows the site's dark theme design system
 * - Accessible with ARIA labels and keyboard support
 * - iOS-specific instructions (iOS doesn't support beforeinstallprompt)
 *
 * @example
 * <PWAInstallPrompt />
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

/** localStorage key for tracking dismissal */
const DISMISS_KEY = 'pwa-install-dismissed';
/** Snooze duration: 30 days in milliseconds */
const SNOOZE_DURATION = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const t = useTranslations('pwa');

    useEffect(() => {
        // Check if already running as PWA
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone);

        setIsStandalone(!!standalone);
        if (standalone) return;

        // Check dismissal snooze
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            if (Date.now() - dismissedAt < SNOOZE_DURATION) return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // On iOS, show manual instructions after a delay
        if (ios) {
            const timeout = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timeout);
        }

        // Standard browsers: listen for beforeinstallprompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay (don't interrupt page load)
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
        } catch (error) {
            console.error('PWA install error:', error);
        } finally {
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    // Don't render if already installed or nothing to show
    if (isStandalone || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:max-w-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('installTitle')}
                >
                    <div
                        className="rounded-xl border p-4 shadow-2xl backdrop-blur-sm"
                        style={{
                            background: GRADIENTS.modal,
                            borderColor: COLORS.border.lighter,
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 rounded-full transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
                            aria-label={t('dismiss')}
                        >
                            <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
                        </button>

                        {/* Content */}
                        <div className="flex items-start gap-3 pr-6">
                            {/* Icon */}
                            <div
                                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${COLORS.primary}20` }}
                                aria-hidden="true"
                            >
                                <Download
                                    className="w-6 h-6"
                                    style={{ color: COLORS.primary }}
                                />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-white mb-1">
                                    {t('installTitle')}
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    {t('installDescription')}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex gap-2">
                            {isIOS ? (
                                /* iOS instructions */
                                <div className="flex-1 text-xs text-gray-400" role="list" aria-label={t('installationSteps')}>
                                    <div className="flex items-center gap-1.5 mb-1" role="listitem">
                                        <Share className="w-3.5 h-3.5" style={{ color: COLORS.primary }} aria-hidden="true" />
                                        <span>{t('iosStep1')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" role="listitem">
                                        <Plus className="w-3.5 h-3.5" style={{ color: COLORS.primary }} aria-hidden="true" />
                                        <span>{t('iosStep2')}</span>
                                    </div>
                                </div>
                            ) : (
                                /* Standard install button */
                                <Button
                                    size="sm"
                                    onClick={handleInstall}
                                    className="flex-1 gap-1.5 text-xs"
                                >
                                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                    {t('installButton')}
                                </Button>
                            )}

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="text-xs text-gray-400"
                            >
                                {t('notNow')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * PWA Update Notification
 *
 * Displays a toast-like notification when a new version of the
 * Service Worker is detected and waiting to be activated.
 *
 * Prompts the user to reload the page to get the latest version.
 *
 * @example
 * <PWAUpdateNotification onUpdate={() => sw.skipWaiting()} />
 */
'use client';

import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

export interface PWAUpdateNotificationProps {
    onUpdate: () => void;
}

export function PWAUpdateNotification({ onUpdate }: PWAUpdateNotificationProps) {
    const t = useTranslations('pwa');

    return (
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-4 left-4 right-4 z-[60] md:left-auto md:right-6 md:top-20 md:max-w-sm"
            role="alert"
            aria-live="polite"
        >
            <div
                className="rounded-xl border p-4 shadow-2xl backdrop-blur-sm"
                style={{
                    background: GRADIENTS.modal,
                    borderColor: COLORS.border.lighter,
                }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.primary}20` }}
                        aria-hidden="true"
                    >
                        <RefreshCw
                            className="w-5 h-5"
                            style={{ color: COLORS.primary }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                            {t('updateAvailable')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {t('updateDescription')}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={onUpdate}
                        className="flex-shrink-0 text-xs gap-1"
                        aria-label={t('updateButton')}
                    >
                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                        {t('updateButton')}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

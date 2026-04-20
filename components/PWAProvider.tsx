/**
 * PWA Provider Component
 *
 * Root-level provider that initializes Service Worker registration,
 * tracks online/offline status, and renders the install prompt
 * and update notifications.
 *
 * This component should be placed inside the RootLayout to ensure
 * PWA functionality is available across all pages.
 *
 * @example
 * <PWAProvider />
 */
'use client';

import dynamic from 'next/dynamic';
import { useServiceWorker } from '@/hooks/useServiceWorker';

// Dynamic imports — PWA components are not critical for initial render
const PWAInstallPrompt = dynamic(() => import('./PWAInstallPrompt'), {
    ssr: false,
});

const PWAUpdateNotification = dynamic(
    () => import('./PWAUpdateNotification').then((mod) => mod.PWAUpdateNotification),
    { ssr: false }
);

export default function PWAProvider() {
    const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

    return (
        <>
            <PWAInstallPrompt />
            {isUpdateAvailable && (
                <PWAUpdateNotification onUpdate={updateServiceWorker} />
            )}
        </>
    );
}

/**
 * Service Worker Registration Hook
 *
 * Handles automatic registration, updates, and lifecycle management
 * of the PWA Service Worker with production-grade error handling.
 *
 * Features:
 * - Registers SW only in production (skips in dev)
 * - Detects updates and notifies the user
 * - Handles SW lifecycle events (install, activate, waiting)
 * - Provides online/offline status tracking
 * - Cleanup on unmount
 *
 * @example
 * function App() {
 *   const { isOnline, isUpdateAvailable, updateServiceWorker } = useServiceWorker();
 *   // ...
 * }
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerState {
    /** Whether the SW is registered and active */
    isRegistered: boolean;
    /** Whether the app is online */
    isOnline: boolean;
    /** Whether a new SW version is waiting to activate */
    isUpdateAvailable: boolean;
    /** SW registration instance */
    registration: ServiceWorkerRegistration | null;
    /** Trigger the waiting SW to activate (reload needed) */
    updateServiceWorker: () => void;
}

/** Interval between update checks: 1 hour */
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

export function useServiceWorker(): ServiceWorkerState {
    const [isRegistered, setIsRegistered] = useState(false);
    const [isOnline, setIsOnline] = useState(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Track online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Register Service Worker
    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !('serviceWorker' in navigator) ||
            process.env.NODE_ENV === 'development'
        ) {
            return;
        }

        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none',
                });

                setRegistration(reg);
                setIsRegistered(true);

                // Check if there's already a waiting SW
                if (reg.waiting) {
                    setIsUpdateAvailable(true);
                }

                // Listen for new SW installing
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New SW installed but waiting — update available
                            setIsUpdateAvailable(true);
                        }
                    });
                });

                // Periodic update checks
                intervalRef.current = setInterval(() => {
                    reg.update().catch((err) => {
                        console.warn('[SW] Update check failed:', err);
                    });
                }, UPDATE_CHECK_INTERVAL);

            } catch (error) {
                console.error('[SW] Registration failed:', error);
            }
        };

        // Handle controller change (new SW activated after skipWaiting)
        let refreshing = false;
        const handleControllerChange = () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        registerSW();

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Trigger SW update
    const updateServiceWorker = useCallback(() => {
        if (!registration?.waiting) return;

        // Tell the waiting SW to skip waiting and take over
        registration.waiting.postMessage('SKIP_WAITING');
    }, [registration]);

    return {
        isRegistered,
        isOnline,
        isUpdateAvailable,
        registration,
        updateServiceWorker,
    };
}

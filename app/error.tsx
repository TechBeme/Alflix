'use client';

import { useEffect } from 'react';
import { GRADIENTS } from '@/lib/theme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/lib/theme';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTranslations } from 'next-intl';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Error Boundary - Global error handler for Next.js App Router
 * 
 * This component catches runtime errors in the application and displays
 * a user-friendly error page with recovery options.
 * 
 * Features:
 * - Automatic error logging to console (can be extended to external services)
 * - User-friendly error message
 * - Recovery options: Reset (try again) or Go Home
 * - Displays error digest for debugging in production
 * 
 * Used in: All pages (Next.js App Router convention)
 */
export default function Error({ error, reset }: ErrorProps) {
    const router = useRouter();
    const contactPrefetch = usePrefetch('/contact', 300);
    const t = useTranslations('error');
    const te = useTranslations('errors');
    const tc = useTranslations('common');

    useEffect(() => {
        // Log error to console (in production, send to error tracking service)
        console.error('Application Error:', error);

        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        // if (process.env.NODE_ENV === 'production') {
        //     errorTrackingService.captureException(error, {
        //         digest: error.digest,
        //         context: 'error-boundary'
        //     });
        // }
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: GRADIENTS.pageLanding }}>
            <div className="max-w-2xl w-full text-center" role="alert">
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${COLORS.primary}20` }}
                    >
                        <AlertTriangle
                            className="w-10 h-10"
                            style={{ color: COLORS.primary }}
                            aria-hidden="true"
                        />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    {t('somethingWentWrong')}
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-400 mb-8">
                    {t('unexpectedError')}
                </p>

                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-8 p-4 bg-gray-900 rounded-lg text-left overflow-auto max-h-48">
                        <p className="text-sm font-mono text-red-400 mb-2">
                            <strong>{te('errorLabel')}:</strong> {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-sm font-mono text-gray-400">
                                <strong>{te('digestLabel')}:</strong> {error.digest}
                            </p>
                        )}
                        {error.stack && (
                            <pre className="text-xs text-gray-500 mt-2 overflow-auto">
                                {error.stack}
                            </pre>
                        )}
                    </div>
                )}

                {/* Error Digest in Production */}
                {process.env.NODE_ENV === 'production' && error.digest && (
                    <p className="text-sm text-gray-500 mb-8">
                        {t('errorCode')}: <code className="font-mono">{error.digest}</code>
                    </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        onClick={reset}
                        size="lg"
                        className="gap-2"
                    >
                        <RefreshCw className="w-5 h-5" aria-hidden="true" />
                        {t('tryAgain')}
                    </Button>

                    <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                    >
                        <Home className="w-5 h-5" aria-hidden="true" />
                        {t('goHome')}
                    </Button>
                </div>

                {/* Help Text */}
                <p className="text-sm text-gray-500 mt-8">
                    {t('contactSupport')}{' '}
                    <Link
                        href="/contact"
                        prefetch={false}
                        onMouseEnter={contactPrefetch.handleMouseEnter}
                        onMouseLeave={contactPrefetch.handleMouseLeave}
                        className="underline hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                        {tc('support')}
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}

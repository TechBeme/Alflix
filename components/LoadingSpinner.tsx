import { Loader2 } from 'lucide-react';
import { COLORS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

/**
 * LoadingSpinner - Standardized loading state component
 * Used across the application for consistent loading states
 */
export default function LoadingSpinner({
    size = 'md',
    text,
    fullScreen = false,
    className = '',
}: LoadingSpinnerProps) {
    const tc = useTranslations('common');
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    };

    const content = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`} role="status" aria-live="polite">
            <Loader2
                className={`${sizeClasses[size]} animate-spin`}
                style={{ color: COLORS.primary }}
                aria-hidden="true"
            />
            {(text !== undefined ? text : tc('loading')) && (
                <p className={`text-white ${textSizeClasses[size]}`}>
                    {text !== undefined ? text : tc('loading')}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                {content}
            </div>
        );
    }

    return content;
}

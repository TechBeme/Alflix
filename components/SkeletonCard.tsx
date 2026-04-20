import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
    /**
     * Variant of the skeleton card
     * - 'poster': Vertical card like movie/series posters
     * - 'landscape': Horizontal card like continue watching
     * - 'hero': Large hero-style card
     */
    variant?: 'poster' | 'landscape' | 'hero';
    /**
     * Show additional details like title and description
     */
    showDetails?: boolean;
    /**
     * Custom className for additional styling
     */
    className?: string;
}

/**
 * SkeletonCard - Skeleton loading state for media cards
 * 
 * @example
 * ```tsx
 * // Poster card (movies/series)
 * <SkeletonCard variant="poster" showDetails />
 * 
 * // Landscape card (continue watching)
 * <SkeletonCard variant="landscape" showDetails />
 * 
 * // Hero card
 * <SkeletonCard variant="hero" showDetails />
 * ```
 * 
 * Used in: MediaRow, ContinueWatchingRow, HomePage
 */
export default function SkeletonCard({
    variant = 'poster',
    showDetails = false,
    className = '',
}: SkeletonCardProps) {
    if (variant === 'poster') {
        return (
            <div className={`flex-shrink-0 w-40 md:w-48 ${className}`}>
                {/* Poster Image */}
                <Skeleton className="h-60 md:h-72 w-full rounded-md" />

                {/* Details */}
                {showDetails && (
                    <div className="mt-2 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'landscape') {
        return (
            <div className={`flex-shrink-0 w-80 md:w-96 ${className}`}>
                <div className="relative">
                    {/* Landscape Image */}
                    <Skeleton className="h-48 w-full rounded-lg" />

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-lg">
                        <Skeleton className="h-full w-2/3 rounded-b-lg" />
                    </div>
                </div>

                {/* Details */}
                {showDetails && (
                    <div className="mt-3 space-y-2">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'hero') {
        return (
            <div className={`relative w-full h-[500px] md:h-[700px] ${className}`}>
                {/* Hero Image */}
                <Skeleton className="absolute inset-0 rounded-lg" />

                {/* Content Overlay */}
                {showDetails && (
                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-4">
                        <Skeleton className="h-12 w-3/4 md:w-1/2" />
                        <Skeleton className="h-6 w-full md:w-2/3" />
                        <Skeleton className="h-6 w-5/6 md:w-1/2" />
                        <div className="flex gap-4 mt-6">
                            <Skeleton className="h-12 w-32" />
                            <Skeleton className="h-12 w-32" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

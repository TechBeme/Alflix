import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonHeroProps {
    /**
     * Show detailed content (title, description, buttons)
     */
    showDetails?: boolean;
    /**
     * Custom className for additional styling
     */
    className?: string;
}

/**
 * SkeletonHero - Skeleton loading state for hero sections
 * 
 * @example
 * ```tsx
 * // Hero with details
 * <SkeletonHero showDetails />
 * 
 * // Simple hero
 * <SkeletonHero />
 * ```
 * 
 * Used in: HomePage (main hero), Watch page
 */
export default function SkeletonHero({
    showDetails = true,
    className = '',
}: SkeletonHeroProps) {
    return (
        <div className={`relative w-full h-[500px] md:h-[700px] overflow-hidden ${className}`}>
            {/* Background Image Skeleton */}
            <Skeleton className="absolute inset-0" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            {/* Content */}
            {showDetails && (
                <div className="absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-12 md:pb-20 space-y-4">
                    <div className="max-w-3xl space-y-4">
                        {/* Logo/Title */}
                        <Skeleton className="h-16 md:h-24 w-3/4 md:w-1/2" />

                        {/* Description */}
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-4/6" />
                        </div>

                        {/* Metadata (Rating, Year, Duration) */}
                        <div className="flex gap-4 items-center">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-6 w-12" />
                            <Skeleton className="h-6 w-20" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <Skeleton className="h-12 w-40" />
                            <Skeleton className="h-12 w-40" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

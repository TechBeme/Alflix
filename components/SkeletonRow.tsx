import SkeletonCard from './SkeletonCard';

interface SkeletonRowProps {
    /**
     * Title for the skeleton row
     */
    title?: string;
    /**
     * Number of skeleton cards to show
     */
    count?: number;
    /**
     * Variant of skeleton cards
     * - 'poster': Vertical cards (movies/series)
     * - 'landscape': Horizontal cards (continue watching)
     */
    variant?: 'poster' | 'landscape';
    /**
     * Custom className for additional styling
     */
    className?: string;
}

/**
 * SkeletonRow - Skeleton loading state for media rows
 * 
 * @example
 * ```tsx
 * // Poster row (movies/series)
 * <SkeletonRow title="Carregando..." count={6} variant="poster" />
 * 
 * // Landscape row (continue watching)
 * <SkeletonRow title="Continue Assistindo" count={4} variant="landscape" />
 * ```
 * 
 * Used in: HomePage, MediaRow component
 */
export default function SkeletonRow({
    title,
    count = 6,
    variant = 'poster',
    className = '',
}: SkeletonRowProps) {
    return (
        <div className={`mb-8 ${className}`}>
            {/* Title */}
            {title && (
                <h2 className="text-white text-2xl font-semibold mb-4 px-4 md:px-12">
                    {title}
                </h2>
            )}

            {/* Skeleton Cards Container */}
            <div className="flex space-x-2 md:space-x-4 overflow-x-hidden px-4 md:px-12 pb-4">
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonCard key={index} variant={variant} />
                ))}
            </div>
        </div>
    );
}

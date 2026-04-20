import { cn } from "@/lib/utils"

/**
 * Skeleton - Base skeleton component for loading states
 * Provides animated placeholder for content that's loading
 */
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/10", className)}
            role="status"
            aria-busy="true"
            {...props}
        />
    )
}

export { Skeleton }

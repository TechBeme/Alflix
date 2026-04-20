import AnimatedGrid from './AnimatedGrid';
import { GRADIENTS } from '@/lib/theme';

interface AnimatedBackgroundProps {
    variant?: 'default' | 'hero' | 'minimal';
    withGrid?: boolean;
    className?: string;
}

/**
 * AnimatedBackground - Reusable animated background component
 * Used in: login page, landing page, various hero sections
 */
export default function AnimatedBackground({
    variant = 'default',
    withGrid = true,
    className = '',
}: AnimatedBackgroundProps) {
    const variants = {
        default: (
            <>
                <div className="absolute inset-0" style={{ background: GRADIENTS.backgroundSubtle }} />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: GRADIENTS.radialRed }}
                />
            </>
        ),
        hero: (
            <>
                <div className="absolute inset-0" style={{ background: GRADIENTS.backgroundSubtle }} />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: GRADIENTS.radialRed }}
                />
            </>
        ),
        minimal: (
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
        ),
    };

    return (
        <div className={`absolute inset-0 ${className}`} aria-hidden="true">
            {variants[variant]}
            {withGrid && <AnimatedGrid />}
        </div>
    );
}

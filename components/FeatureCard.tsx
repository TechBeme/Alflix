import { LucideIcon } from 'lucide-react';
import { GRADIENTS } from '@/lib/theme';
import ScrollReveal from './ScrollReveal';
import { COLORS } from '@/lib/theme';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * FeatureCard - Reusable card with icon, title and description
 * Used in: landing page (Features Section), about page (Nossos Valores)
 */
export default function FeatureCard({
    icon: Icon,
    title,
    description,
    delay = 0,
    size = 'md',
    className = '',
}: FeatureCardProps) {
    const sizeClasses = {
        sm: {
            container: 'p-4',
            icon: 'w-10 h-10',
            iconWrapper: 'w-10 h-10 mb-3',
            iconSize: 'w-5 h-5',
            title: 'text-lg',
            description: 'text-xs',
        },
        md: {
            container: 'p-6',
            icon: 'w-12 h-12',
            iconWrapper: 'w-12 h-12 mb-4',
            iconSize: 'w-6 h-6',
            title: 'text-xl',
            description: 'text-sm',
        },
        lg: {
            container: 'p-8',
            icon: 'w-16 h-16',
            iconWrapper: 'w-16 h-16 mb-4',
            iconSize: 'w-8 h-8',
            title: 'text-2xl',
            description: 'text-base',
        },
    };

    const classes = sizeClasses[size];

    return (
        <ScrollReveal delay={delay}>
            <div
                className={`rounded-2xl ${classes.container} border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 ${className}`}
                style={{ background: GRADIENTS.surface }}
            >
                <div
                    className={`${classes.iconWrapper} rounded-lg flex items-center justify-center`}
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Icon className={`${classes.iconSize} text-white`} aria-hidden="true" />
                </div>
                <h3 className={`${classes.title} font-bold text-white mb-3`}>
                    {title}
                </h3>
                <p className={`text-gray-400 ${classes.description} leading-relaxed`}>
                    {description}
                </p>
            </div>
        </ScrollReveal>
    );
}

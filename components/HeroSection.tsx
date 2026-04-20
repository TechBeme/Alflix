import ScrollReveal from './ScrollReveal';
import { COLORS } from '@/lib/theme';

interface HeroSectionProps {
    title: string;
    subtitle?: string;
    highlightedWord?: string;
    description?: string;
    className?: string;
}

/**
 * HeroSection - Reusable hero component for institutional pages
 * Used in: about, contact, privacy, terms, cookies pages
 */
export default function HeroSection({
    title,
    subtitle,
    highlightedWord,
    description,
    className = '',
}: HeroSectionProps) {
    // Split title if highlighted word is provided
    const renderTitle = () => {
        if (!highlightedWord || !title.includes(highlightedWord)) {
            return (
                <span className="text-white">
                    {title}
                </span>
            );
        }

        const parts = title.split(highlightedWord);
        return (
            <>
                <span className="text-white">
                    {parts[0]}
                </span>
                <span style={{ color: COLORS.primary }}>
                    {highlightedWord}
                </span>
                {parts[1] && (
                    <span className="text-white">
                        {parts[1]}
                    </span>
                )}
            </>
        );
    };

    return (
        <section className={`pt-32 pb-20 px-4 relative overflow-hidden ${className}`}>
            <div className="relative z-10 max-w-7xl mx-auto text-center">
                <ScrollReveal>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        {renderTitle()}
                    </h1>
                    {description && (
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            {description}
                        </p>
                    )}
                    {subtitle && !description && (
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </ScrollReveal>
            </div>
        </section>
    );
}

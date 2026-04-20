import { COLORS } from '@/lib/theme';

interface Stat {
    value: string;
    label: string;
}

interface StatsSectionProps {
    stats: Stat[];
    className?: string;
    columns?: 2 | 3 | 4;
}

/**
 * StatsSection - Display statistics/metrics in a grid
 * Used in: landing page, about page
 */
export default function StatsSection({
    stats,
    className = '',
    columns = 3,
}: StatsSectionProps) {
    const gridClasses = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    return (
        <div className={`grid ${gridClasses[columns]} gap-8 ${className}`}>
            {stats.map((stat, index) => (
                <div key={index} className="text-center">
                    <div
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2"
                        style={{ color: COLORS.primary }}
                    >
                        {stat.value}
                    </div>
                    <div className="text-sm text-gray-400">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

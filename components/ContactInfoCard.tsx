import { LucideIcon } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { COLORS, GRADIENTS } from '@/lib/theme';

interface ContactInfoCardProps {
    icon: LucideIcon;
    title: string;
    value: string;
    delay?: number;
    className?: string;
}

/**
 * ContactInfoCard - Card for displaying contact information
 * Used in: contact page
 */
export default function ContactInfoCard({
    icon: Icon,
    title,
    value,
    delay = 0,
    className = '',
}: ContactInfoCardProps) {
    return (
        <ScrollReveal delay={delay}>
            <div
                className={`text-center p-6 rounded-2xl border border-white/[0.06] hover:border-primary transition-all w-64 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 ${className}`}
                style={{ background: GRADIENTS.surface }}
            >
                <div
                    className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{value}</p>
            </div>
        </ScrollReveal>
    );
}

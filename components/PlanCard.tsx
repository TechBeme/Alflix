'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useTranslations } from 'next-intl';

interface PlanCardProps {
    name: string;
    price: string;
    screens: number;
    popular?: boolean;
    delay?: number;
    features?: string[];
    onSelect?: () => void;
    ctaText?: string;
    ctaLink?: string;
    disabled?: boolean;
    loading?: boolean;
    noAnimation?: boolean;
    compact?: boolean;
}

/**
 * PlanCard - Individual pricing plan card
 * Extracted from PricingSection for better reusability and testing
 */
export default function PlanCard({
    name,
    price,
    screens,
    popular = false,
    delay = 0,
    features,
    onSelect,
    ctaText,
    ctaLink = '/login',
    disabled = false,
    loading = false,
    noAnimation = false,
    compact = false,
}: PlanCardProps) {
    const t = useTranslations('plans');
    const tc = useTranslations('common');
    const linkPrefetch = usePrefetch(ctaLink);

    const displayCtaText = ctaText || t('tryFree');

    const defaultFeatures = [
        tc('screens', { count: screens }),
        t('quality4kHdr'),
        t('noAds'),
        t('unlimitedDownload'),
        t('cancelAnytime'),
    ];

    const displayFeatures = features || defaultFeatures;

    const cardContent = (
        <div
            className={`relative backdrop-blur-sm rounded-3xl ${compact ? 'p-4 sm:p-5' : 'p-8'} hover:scale-105 transition-all ${popular
                ? 'shadow-[0_0_50px_rgba(208,33,42,0.4)] border-2 border-primary'
                : 'border border-white/[0.06] hover:border-primary shadow-xl shadow-black/30'
                }`}
            style={{
                background: GRADIENTS.surface,
                transform: popular ? 'scale(1.05)' : 'scale(1)',
            }}
        >
            {popular && (
                <div className={`absolute ${compact ? '-top-3' : '-top-4'} left-1/2 transform -translate-x-1/2`}>
                    <span
                        className={`text-white ${compact ? 'px-3 py-1 text-[10px]' : 'px-6 py-2 text-sm'} rounded-full font-bold shadow-lg`}
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {t('mostPopular')}
                    </span>
                </div>
            )}

            <div className={`text-center ${compact ? 'mb-4' : 'mb-8'}`}>
                <h3 className={`font-bold text-white ${compact ? 'text-lg mb-1' : 'text-2xl mb-3'}`}>{name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-base'}`}>{tc('currency')}</span>
                    <span className={`font-bold text-white ${compact ? 'text-2xl sm:text-3xl' : 'text-5xl'}`}>{price}</span>
                    <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-base'}`}>{tc('perMonth')}</span>
                </div>
            </div>

            <ul className={`${compact ? 'space-y-2 mb-4' : 'space-y-3 sm:space-y-4 mb-6 sm:mb-8'}`}>
                {displayFeatures.map((feature, index) => (
                    <li key={index} className={`flex items-center text-gray-300 ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
                        <Check
                            className={`${compact ? 'w-3.5 h-3.5 mr-2' : 'w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3'} flex-shrink-0`}
                            style={{ color: COLORS.primary }}
                            aria-hidden="true"
                        />
                        {feature}
                    </li>
                ))}
            </ul>

            {onSelect ? (
                <Button
                    onClick={onSelect}
                    disabled={disabled}
                    className={`w-full transition-all border-0 ${compact ? 'text-sm py-2' : ''} ${disabled
                        ? 'bg-white/[0.06] text-gray-500 cursor-not-allowed hover:scale-100 opacity-50'
                        : popular
                            ? 'hover:opacity-90 hover:scale-105'
                            : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                        }`}
                    style={popular && !disabled ? { backgroundColor: COLORS.primary } : {}}
                    size={compact ? 'sm' : 'lg'}
                >
                    {loading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    )}
                    {displayCtaText}
                </Button>
            ) : (
                <Link
                    href={ctaLink}
                    prefetch={false}
                    onMouseEnter={linkPrefetch.handleMouseEnter}
                    onMouseLeave={linkPrefetch.handleMouseLeave}
                >
                    <Button
                        className={`w-full transition-all hover:scale-105 border-0 ${popular ? 'hover:opacity-90' : 'bg-white/10 hover:bg-white/20'
                            }`}
                        style={popular ? { backgroundColor: COLORS.primary } : {}}
                        size={compact ? 'sm' : 'lg'}
                    >
                        {displayCtaText}
                    </Button>
                </Link>
            )}
        </div>
    );

    if (noAnimation) {
        return cardContent;
    }

    return (
        <ScrollReveal delay={delay}>
            {cardContent}
        </ScrollReveal>
    );
}

'use client';

import ScrollReveal from '@/components/ScrollReveal';
import PlanCard from '@/components/PlanCard';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

export default function PricingSection() {
    const t = useTranslations('plans');
    return (
        <section id="pricing" className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden w-full" style={{ background: GRADIENTS.sectionPricing }}>
            <div className="max-w-7xl mx-auto w-full">
                <ScrollReveal>
                    <div className="text-center mb-12 sm:mb-16 md:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 px-2">
                            <span style={{ background: GRADIENTS.whiteToGrayAlt, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {t('title')}
                            </span>
                            {' '}
                            <span style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {t('titleHighlight')}
                            </span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-gray-400 px-4">
                            {t('subtitle')}
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                    <PlanCard
                        name={t('individual')}
                        price={t('individualPrice')}
                        screens={1}
                        popular={false}
                        delay={0.1}
                    />
                    <PlanCard
                        name={t('duo')}
                        price={t('duoPrice')}
                        screens={2}
                        popular={true}
                        delay={0.2}
                    />
                    <PlanCard
                        name={t('family')}
                        price={t('familyPrice')}
                        screens={4}
                        popular={false}
                        delay={0.3}
                    />
                </div>
            </div>
        </section>
    );
}

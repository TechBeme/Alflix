import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import HeroSection from '@/components/HeroSection';
import JsonLd from '@/components/JsonLd';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { SITE_NAME_FULL, CONTACT_EMAIL } from '@/lib/config';
import { createMetadata, generateBreadcrumbJsonLd } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('terms');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('metaDescription', { siteName: SITE_NAME_FULL }),
        path: '/terms',
        keywords: tm('keywordsTerms').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

export default async function TermsPage() {
    const t = await getTranslations('terms');
    const tm = await getTranslations('metadata');
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: t('breadcrumb') },
    ], tm('breadcrumbHome'));

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <JsonLd id="terms-breadcrumb" data={breadcrumbJsonLd} />
            <NavbarWrapper />

            {/* Hero Section */}
            <div className="pt-24">
                <HeroSection
                    title={t('title')}
                    highlightedWord={t('highlightedWord')}
                    description={t('lastUpdated')}
                />

                {/* Terms Content */}
                <section className="py-20 px-4" style={{ background: GRADIENTS.sectionInstitutional }}>
                    <div className="max-w-4xl mx-auto">
                        <ScrollReveal>
                            <div className="prose prose-invert prose-lg max-w-none">
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section1Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section1Text', { siteName: SITE_NAME_FULL })}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section2Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section2Text', { siteName: SITE_NAME_FULL })}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Item1')}</li>
                                            <li>{t('section2Item2')}</li>
                                            <li>{t('section2Item3')}</li>
                                            <li>{t('section2Item4')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section3Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section3Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section3Item1')}</li>
                                            <li>{t('section3Item2')}</li>
                                            <li>{t('section3Item3')}</li>
                                            <li>{t('section3Item4')}</li>
                                            <li>{t('section3Item5')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section4Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section4Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section4Item1')}</li>
                                            <li>{t('section4Item2')}</li>
                                            <li>{t('section4Item3')}</li>
                                            <li>{t('section4Item4')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section5Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section5Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section5Item1')}</li>
                                            <li>{t('section5Item2')}</li>
                                            <li>{t('section5Item3')}</li>
                                            <li>{t('section5Item4')}</li>
                                            <li>{t('section5Item5')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section6Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section6Text', { siteName: SITE_NAME_FULL })}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section7Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section7Text', { siteName: SITE_NAME_FULL })}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section8Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section8Text')}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section9Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section9Text')}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section10Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section10Text')}
                                        </p>
                                        <p className="text-gray-300 mt-4">
                                            {t('emailLabel')} <span style={{ color: COLORS.primary }}>{CONTACT_EMAIL}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}

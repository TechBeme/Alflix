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
    const t = await getTranslations('privacy');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('metaDescription', { siteName: SITE_NAME_FULL }),
        path: '/privacy',
        keywords: tm('keywordsPrivacy').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

export default async function PrivacyPage() {
    const t = await getTranslations('privacy');
    const tm = await getTranslations('metadata');
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: t('breadcrumb') },
    ], tm('breadcrumbHome'));

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <JsonLd id="privacy-breadcrumb" data={breadcrumbJsonLd} />
            <NavbarWrapper />

            {/* Hero Section */}
            <div className="pt-24">
                <HeroSection
                    title={t('title')}
                    highlightedWord={t('highlightedWord')}
                    description={t('lastUpdated')}
                />

                {/* Privacy Content */}
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
                                            {t('section2Text')}
                                        </p>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub1')}</h3>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub1Item1')}</li>
                                            <li>{t('section2Sub1Item2')}</li>
                                            <li>{t('section2Sub1Item3')}</li>
                                            <li>{t('section2Sub1Item4')}</li>
                                        </ul>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub2')}</h3>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub2Item1')}</li>
                                            <li>{t('section2Sub2Item2')}</li>
                                            <li>{t('section2Sub2Item3')}</li>
                                            <li>{t('section2Sub2Item4')}</li>
                                            <li>{t('section2Sub2Item5')}</li>
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
                                            <li>{t('section3Item6')}</li>
                                            <li>{t('section3Item7')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section4Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section4Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li><strong className="text-white">{t('section4Item1')}</strong> {t('section4Item1Desc')}</li>
                                            <li><strong className="text-white">{t('section4Item2')}</strong> {t('section4Item2Desc')}</li>
                                            <li><strong className="text-white">{t('section4Item3')}</strong> {t('section4Item3Desc')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section5Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section5Text')}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section6Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section6Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section6Item1')}</li>
                                            <li>{t('section6Item2')}</li>
                                            <li>{t('section6Item3')}</li>
                                            <li>{t('section6Item4')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section7Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section7Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section7Item1')}</li>
                                            <li>{t('section7Item2')}</li>
                                            <li>{t('section7Item3')}</li>
                                            <li>{t('section7Item4')}</li>
                                            <li>{t('section7Item5')}</li>
                                            <li>{t('section7Item6')}</li>
                                        </ul>
                                        <p className="text-gray-300 leading-relaxed mt-4">
                                            {t('section7Footer', { email: CONTACT_EMAIL })}
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
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section11Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section11Text')}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section12Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section12Text')}
                                        </p>
                                        <div className="mt-4 text-gray-300 space-y-2">
                                            <p>{t('emailLabel')} <span style={{ color: COLORS.primary }}>{CONTACT_EMAIL}</span></p>
                                        </div>
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

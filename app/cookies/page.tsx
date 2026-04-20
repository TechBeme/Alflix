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
    const t = await getTranslations('cookies');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('metaDescription', { siteName: SITE_NAME_FULL }),
        path: '/cookies',
        keywords: tm('keywordsCookies').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

export default async function CookiesPage() {
    const t = await getTranslations('cookies');
    const tm = await getTranslations('metadata');
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: t('breadcrumb') },
    ], tm('breadcrumbHome'));

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <JsonLd id="cookies-breadcrumb" data={breadcrumbJsonLd} />
            <NavbarWrapper />

            {/* Hero Section */}
            <div className="pt-24">
                <HeroSection
                    title={t('title')}
                    highlightedWord={t('highlightedWord')}
                    description={t('lastUpdated')}
                />

                {/* Cookies Content */}
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

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub1')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section2Sub1Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub1Item1')}</li>
                                            <li>{t('section2Sub1Item2')}</li>
                                            <li>{t('section2Sub1Item3')}</li>
                                            <li>{t('section2Sub1Item4')}</li>
                                        </ul>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub2')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section2Sub2Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub2Item1')}</li>
                                            <li>{t('section2Sub2Item2')}</li>
                                            <li>{t('section2Sub2Item3')}</li>
                                            <li>{t('section2Sub2Item4')}</li>
                                        </ul>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub3')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section2Sub3Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub3Item1')}</li>
                                            <li>{t('section2Sub3Item2')}</li>
                                            <li>{t('section2Sub3Item3')}</li>
                                            <li>{t('section2Sub3Item4')}</li>
                                        </ul>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section2Sub4')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section2Sub4Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section2Sub4Item1')}</li>
                                            <li>{t('section2Sub4Item2')}</li>
                                            <li>{t('section2Sub4Item3')}</li>
                                            <li>{t('section2Sub4Item4')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section3Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section3Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li><strong>{t('section3Item1')}</strong> {t('section3Item1Desc')}</li>
                                            <li><strong>{t('section3Item2')}</strong> {t('section3Item2Desc')}</li>
                                            <li><strong>{t('section3Item3')}</strong> {t('section3Item3Desc')}</li>
                                            <li><strong>{t('section3Item4')}</strong> {t('section3Item4Desc')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section4Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section4Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li><strong>{t('section4Item1')}</strong> {t('section4Item1Desc')}</li>
                                            <li><strong>{t('section4Item2')}</strong> {t('section4Item2Desc')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section5Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section5Text')}
                                        </p>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section5Sub1')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section5Sub1Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section5Sub1Item1')}</li>
                                            <li>{t('section5Sub1Item2')}</li>
                                            <li>{t('section5Sub1Item3')}</li>
                                            <li>{t('section5Sub1Item4')}</li>
                                        </ul>

                                        <h3 className="text-2xl font-semibold text-white mb-3 mt-6">{t('section5Sub2')}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section5Sub2Text')}
                                        </p>
                                        <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                                            <li>{t('section5Sub2Item1')}</li>
                                            <li>{t('section5Sub2Item2')}</li>
                                            <li>{t('section5Sub2Item3')}</li>
                                            <li>{t('section5Sub2Item4')}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section6Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section6Text')}
                                        </p>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-4">{t('section7Title')}</h2>
                                        <p className="text-gray-300 leading-relaxed mb-4">
                                            {t('section7Text')} <a href="/privacy" className="text-primary hover:text-primary-light transition-colors">{t('section7Link')}</a>.
                                        </p>
                                        <p className="text-gray-300 leading-relaxed">
                                            {t('section7Contact')} <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary-light transition-colors">{CONTACT_EMAIL}</a>.
                                        </p>
                                    </div>

                                    <div className="mt-12 p-6 rounded-xl border border-white/[0.06] shadow-lg shadow-black/20" style={{ background: GRADIENTS.surface }}>
                                        <p className="text-gray-300 leading-relaxed">
                                            <strong className="text-white">{t('consent')}</strong> {t('consentText')}
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

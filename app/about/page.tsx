import NavbarWrapper from '@/components/NavbarWrapper';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import StatsSection from '@/components/StatsSection';
import JsonLd from '@/components/JsonLd';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { Code2, Database, Shield, Sparkles, Globe, Mail, Briefcase, Github } from 'lucide-react';
import { SITE_NAME, SITE_NAME_FULL, CONTACT_EMAIL } from '@/lib/config';
import { createMetadata, generateBreadcrumbJsonLd } from '@/lib/seo';
import { getTranslations, getLocale } from 'next-intl/server';
import { localeToOpenGraph } from '@/lib/language';

export async function generateMetadata() {
    const locale = await getLocale();
    const ogLocale = localeToOpenGraph(locale);
    const t = await getTranslations('about');
    const tm = await getTranslations('metadata');
    return createMetadata({
        title: t('title'),
        description: t('metaDescription', { siteName: SITE_NAME_FULL }),
        path: '/about',
        keywords: tm('keywordsAbout').split(', '),
        locale: ogLocale,
        baseKeywords: tm('keywordsHome').split(', '),
    });
}

export default async function AboutPage() {
    const t = await getTranslations('about');
    const tm = await getTranslations('metadata');
    const breadcrumbJsonLd = generateBreadcrumbJsonLd([
        { name: t('title') },
    ], tm('breadcrumbHome'));

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageLanding }}>
            <JsonLd id="about-breadcrumb" data={breadcrumbJsonLd} />
            <NavbarWrapper />

            {/* Hero Section */}
            <div className="pt-24">
                <HeroSection
                    title={t('heroTitle', { siteName: SITE_NAME_FULL })}
                    highlightedWord={SITE_NAME}
                    description={t('heroDescription')}
                />

                {/* Sobre o Projeto */}
                <section className="py-20 px-4" style={{ background: GRADIENTS.sectionPricing }}>
                    <div className="max-w-7xl mx-auto">
                        <ScrollReveal>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">
                                {t('ourStory')}
                            </h2>
                            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                                <p>
                                    {t('storyParagraph1', { siteName: SITE_NAME_FULL })}
                                </p>
                                <p>
                                    {t('storyParagraph2', { siteName: SITE_NAME_FULL })}
                                </p>
                                <p>
                                    {t('storyParagraph3')}
                                </p>
                            </div>
                        </ScrollReveal>
                    </div>
                </section>

                {/* Stack Tecnológica */}
                <section className="py-20 px-4" style={{ background: GRADIENTS.sectionInstitutional }}>
                    <div className="max-w-7xl mx-auto">
                        <ScrollReveal>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center">
                                {t('ourValues')}
                            </h2>
                        </ScrollReveal>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <FeatureCard
                                icon={Code2}
                                title={t('valueInnovation')}
                                description={t('valueInnovationDesc')}
                                delay={0.1}
                                size="lg"
                            />
                            <FeatureCard
                                icon={Database}
                                title={t('valueCommunity')}
                                description={t('valueCommunityDesc')}
                                delay={0.2}
                                size="lg"
                            />
                            <FeatureCard
                                icon={Shield}
                                title={t('valueSecurity')}
                                description={t('valueSecurityDesc')}
                                delay={0.3}
                                size="lg"
                            />
                            <FeatureCard
                                icon={Sparkles}
                                title={t('valueQuality')}
                                description={t('valueQualityDesc')}
                                delay={0.4}
                                size="lg"
                            />
                        </div>
                    </div>
                </section>

                {/* Sobre o Desenvolvedor */}
                <section className="py-20 px-4" style={{ background: GRADIENTS.sectionPricing }}>
                    <div className="max-w-7xl mx-auto">
                        <ScrollReveal>
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                                    {t('passionateTeam')}
                                </h2>
                                <p className="text-xl md:text-2xl font-bold mb-2" style={{ color: COLORS.primary }}>
                                    {t('developerName')}
                                </p>
                                <p className="text-lg text-gray-400 mb-6">
                                    {t('developerTitle')}
                                </p>
                                <p className="text-gray-300 max-w-3xl mx-auto">
                                    {t('teamDesc')}
                                </p>
                            </div>

                            {/* Competências */}
                            <div className="mt-16">
                                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                                    💼 {t('expertise')}
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">💻</span>
                                        <p className="text-gray-300">{t('expertiseFullStack')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">🎨</span>
                                        <p className="text-gray-300">{t('expertiseUI')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">🗄️</span>
                                        <p className="text-gray-300">{t('expertiseDatabase')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">🔒</span>
                                        <p className="text-gray-300">{t('expertiseAuth')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">🤖</span>
                                        <p className="text-gray-300">{t('expertiseAI')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06]" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">🚀</span>
                                        <p className="text-gray-300">{t('expertisePerformance')}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-white/[0.06] md:col-span-2" style={{ background: GRADIENTS.surface }}>
                                        <span className="text-2xl">📱</span>
                                        <p className="text-gray-300">{t('expertiseResponsive')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Idiomas */}
                            <div className="mt-12 text-center">
                                <h3 className="text-2xl font-bold text-white mb-6">
                                    🌍 {t('languages')}
                                </h3>
                                <div className="flex justify-center gap-8 text-lg">
                                    <span className="text-gray-300">🇺🇸 {t('languageEnglish')}</span>
                                    <span className="text-gray-300">🇧🇷 {t('languagePortuguese')}</span>
                                    <span className="text-gray-300">🇪🇸 {t('languageSpanish')}</span>
                                </div>
                            </div>

                            {/* Contato */}
                            <div className="mt-16 p-8 rounded-xl border border-white/[0.06] shadow-lg shadow-black/20 max-w-3xl mx-auto" style={{ background: GRADIENTS.surface }}>
                                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                                    📬 {t('contactDeveloper')}
                                </h3>
                                <div className="space-y-4">
                                    <a
                                        href={`mailto:${CONTACT_EMAIL}`}
                                        className="flex items-center justify-center gap-3 p-4 rounded-lg border border-white/[0.06] hover:border-primary/50 transition-colors"
                                        style={{ background: GRADIENTS.surface }}
                                    >
                                        <Mail className="w-5 h-5" style={{ color: COLORS.primary }} />
                                        <span className="text-gray-300">{t('email')}: {CONTACT_EMAIL}</span>
                                    </a>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <a
                                            href="https://github.com/TechBeme"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 p-4 rounded-lg border border-white/[0.06] hover:border-primary/50 transition-colors"
                                            style={{ background: GRADIENTS.surface }}
                                        >
                                            <Github className="w-5 h-5" style={{ color: COLORS.primary }} />
                                            <span className="text-gray-300">{t('github')}</span>
                                        </a>
                                        <a
                                            href="https://www.fiverr.com/tech_be"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 p-4 rounded-lg border border-white/[0.06] hover:border-primary/50 transition-colors"
                                            style={{ background: GRADIENTS.surface }}
                                        >
                                            <Briefcase className="w-5 h-5" style={{ color: COLORS.primary }} />
                                            <span className="text-gray-300">{t('fiverr')}</span>
                                        </a>
                                        <a
                                            href="https://www.upwork.com/freelancers/~01f0abcf70bbd95376"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 p-4 rounded-lg border border-white/[0.06] hover:border-primary/50 transition-colors"
                                            style={{ background: GRADIENTS.surface }}
                                        >
                                            <Globe className="w-5 h-5" style={{ color: COLORS.primary }} />
                                            <span className="text-gray-300">{t('upwork')}</span>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <StatsSection
                                stats={[
                                    { value: '30+', label: t('contributors') },
                                    { value: '100%', label: t('supportStat') },
                                    { value: '20+', label: t('users') },
                                ]}
                                className="mt-12 max-w-2xl mx-auto"
                            />
                        </ScrollReveal>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}

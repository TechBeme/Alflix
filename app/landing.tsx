'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tv, Sparkles, Shield, Monitor } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';
import ScrollReveal from '@/components/ScrollReveal';
import HorizontalScrollGallery from '@/components/HorizontalScrollGallery';
import PricingSection from '@/components/PricingSection';
import ScrollToButton from '@/components/ScrollToButton';
import StatsSection from '@/components/StatsSection';
import FAQItem from '@/components/FAQItem';
import { Movie, TVShow } from '@/lib/tmdb';
import type { Session } from '@/lib/auth-client';
import { usePrefetch } from '@/hooks/usePrefetch';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { SITE_NAME_FULL } from '@/lib/config';

interface TMDBResponse {
  results: (Movie | TVShow)[];
}

interface LandingPageProps {
  trending: TMDBResponse;
  trendingMovies: TMDBResponse;
  trendingTV: TMDBResponse;
  initialSession?: Session | null;
}

/**
 * Landing Page - Otimizada para SSR e SEO
 * 
 * Recebe dados do servidor (Server Component) via props
 * Componentes interativos marcados como 'use client'
 * 
 * Performance:
 * - Dados vêm pré-carregados do servidor (cache de 6h)
 * - Zero requests ao TMDB no cliente
 * - Primeiro render instantâneo
 * - SEO 100% otimizado
 * - Apenas 3 seções mais relevantes
 */
export default function LandingPage({ trending, trendingMovies, trendingTV, initialSession }: LandingPageProps) {
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const tm = useTranslations('media');
  const tfaq = useTranslations('faq');
  const catalogPrefetch = usePrefetch('/catalog');

  return (
    <div className="min-h-screen" style={{ background: GRADIENTS.pageLanding }}>
      <Suspense>
        <Navbar initialSession={initialSession} />
      </Suspense>

      {/* Hero Section with Animated Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden w-full max-w-full">
        {/* Animated gradient background */}
        <AnimatedBackground variant="hero" withGrid={true} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          >
            <Sparkles className="w-4 h-4 text-white/70" aria-hidden="true" />
            <span className="text-sm text-white/80 font-medium">{t('badge')}</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-4 sm:mb-6 text-white px-2"
          >
            {t('heroTitleLine1')}
            <br />
            <span style={{ color: COLORS.primary }}>
              {t('heroTitleLine2')}
            </span>
            <br />
            {t('heroTitleLine3')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4"
          >
            {t.rich('heroDescription', {
              highlight: (chunks) => <span className="font-semibold" style={{ color: COLORS.primary }}>{chunks}</span>
            })}
          </motion.p>

          {/* Streaming Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="mb-8 sm:mb-12 w-full px-2"
          >
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 max-w-2xl mx-auto">
              {[
                { name: 'Netflix', logo: '/providers/netflix.jpg' },
                { name: 'Amazon Prime', logo: '/providers/amazon-prime-video.jpg' },
                { name: 'Disney Plus', logo: '/providers/disney-plus.jpg' },
                { name: 'HBO Max', logo: '/providers/hbo-max.jpg' },
                { name: 'Apple TV', logo: '/providers/apple-tv.jpg' },
                { name: 'Paramount+', logo: '/providers/paramount-plus.jpg' },
              ].map((provider) => (
                <div
                  key={provider.name}
                  className="transition-all duration-300 hover:scale-110"
                >
                  <Image
                    src={provider.logo}
                    alt={provider.name}
                    width={48}
                    height={48}
                    className="rounded-xl sm:rounded-2xl ring-2 ring-white/20 hover:ring-[${COLORS.primary}] transition-all duration-300 bg-black w-12 h-12 sm:w-14 sm:h-14"
                  />
                </div>
              ))}
              <div className="text-gray-400 text-xs sm:text-sm font-semibold">{tc('andMore')}</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-4"
          >
            <ScrollToButton targetId="pricing" variant="primary">
              {t('watchNow')}
            </ScrollToButton>
            <Link
              href="/catalog"
              prefetch={false}
              onMouseEnter={catalogPrefetch.handleMouseEnter}
              onMouseLeave={catalogPrefetch.handleMouseLeave}
              className="w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 transition-all hover:scale-105 w-full sm:w-auto">
                {t('exploreCatalog')}
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
            className="text-gray-400 text-sm sm:text-base mt-6 sm:mt-8 px-4"
          >
            {t.rich('priceNote', {
              price: (chunks) => <span className="font-bold" style={{ color: COLORS.primary }}>{chunks}</span>
            })}
          </motion.p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* Horizontal Scroll Gallery - Estrutura intercalada */}
      {trending && trendingMovies && trendingTV && (
        <HorizontalScrollGallery
          sections={[
            {
              title: tm('trendingThisWeek'),
              items: trending.results.slice(0, 20),
              direction: "left-to-right"
            },
            {
              title: tm('trendingMovies'),
              items: trendingMovies.results.slice(0, 20),
              direction: "right-to-left"
            },
            {
              title: tm('trendingTV'),
              items: trendingTV.results.slice(0, 20),
              direction: "left-to-right"
            }
          ]}
        />
      )}

      {/* Features Section with Cards */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden w-full" style={{ background: GRADIENTS.sectionFeatures }}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-300">
                {t('whyChoose')}
                <br />
                <span style={{ color: COLORS.primary }}>
                  {SITE_NAME_FULL}?
                </span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
                {t('bestExperience')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 - Todos os Streamings */}
            <ScrollReveal delay={0.1}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <Tv className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featureAllStreaming')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featureAllStreamingDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 2 - Multi-dispositivos */}
            <ScrollReveal delay={0.2}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <Monitor className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featureMultiDevice')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featureMultiDeviceDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 3 - Download ilimitado */}
            <ScrollReveal delay={0.3}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featureUnlimitedDownload')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featureUnlimitedDownloadDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 4 - Perfis Múltiplos */}
            <ScrollReveal delay={0.4}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featureMultiProfile')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featureMultiProfileDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 5 - Qualidade Premium */}
            <ScrollReveal delay={0.5}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featurePremiumQuality')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featurePremiumQualityDesc')}
                </p>
              </div>
            </ScrollReveal>

            {/* Feature 6 - Sem Anúncios */}
            <ScrollReveal delay={0.6}>
              <div className="rounded-2xl p-6 border border-white/[0.06] hover:border-primary transition-all h-full flex flex-col shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30" style={{ background: GRADIENTS.surface }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: COLORS.primary }}>
                  <Shield className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t('featureNoAds')}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {t('featureNoAdsDesc')}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden w-full" style={{ background: GRADIENTS.sectionFAQ }}>
        <div className="max-w-4xl mx-auto w-full">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-8 sm:mb-12 md:mb-16 px-2">
              {t('faqTitle')}
            </h2>
          </ScrollReveal>

          <div className="space-y-6">
            <FAQItem
              question={tfaq('howItWorks', { siteName: SITE_NAME_FULL })}
              answer={tfaq('howItWorksAnswer', { siteName: SITE_NAME_FULL })}
              delay={0.1}
              defaultOpen={true}
            />

            <FAQItem
              question={tfaq('canCancel')}
              answer={tfaq('canCancelAnswer')}
              delay={0.2}
              defaultOpen={true}
            />

            <FAQItem
              question={tfaq('whichDevices')}
              answer={tfaq('whichDevicesAnswer')}
              delay={0.3}
              defaultOpen={true}
            />

            <FAQItem
              question={tfaq('freeTrial')}
              answer={tfaq('freeTrialAnswer')}
              delay={0.4}
              defaultOpen={true}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden w-full" style={{ background: GRADIENTS.sectionCTA }}>
        <div className="max-w-5xl mx-auto text-center w-full">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
              {t('readyToStart')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              {t('joinThousands')}
            </p>
            <ScrollToButton targetId="pricing" variant="secondary">
              {t('watchNow')}
            </ScrollToButton>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

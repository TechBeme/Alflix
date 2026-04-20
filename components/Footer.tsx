'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { usePrefetch } from '@/hooks/usePrefetch';
import { GRADIENTS } from '@/lib/theme';
import { SITE_NAME, SITE_NAME_SUFFIX, SITE_NAME_FULL } from '@/lib/config';

export default function Footer() {
    const t = useTranslations('footer');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const catalogPrefetch = usePrefetch('/catalog', 300);
    const homePrefetch = usePrefetch('/', 300);
    const aboutPrefetch = usePrefetch('/about', 300);
    const contactPrefetch = usePrefetch('/contact', 300);
    const termsPrefetch = usePrefetch('/terms', 300);
    const privacyPrefetch = usePrefetch('/privacy', 300);
    const cookiesPrefetch = usePrefetch('/cookies', 300);

    return (
        <footer role="contentinfo" className="relative py-8 sm:py-12 px-4 overflow-hidden w-full" style={{ background: GRADIENTS.footer }}>
            {/* Top divider */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.06), transparent)' }} />

            <div className="max-w-7xl mx-auto w-full">
                {/* Logo and description */}
                <div className="mb-6 sm:mb-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                        <Image
                            src="/logo.png"
                            alt={tA11y('logoAlt', { siteName: SITE_NAME_FULL })}
                            width={28}
                            height={28}
                            className="w-7 h-7 sm:w-8 sm:h-8"
                        />
                        <span className="text-xl sm:text-2xl font-bold">
                            <span style={{ color: '#d0212a' }}>{SITE_NAME}</span>
                            {SITE_NAME_SUFFIX && (
                                <span className="text-white">{SITE_NAME_SUFFIX}</span>
                            )}
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto">
                        {t('description')}
                    </p>
                </div>

                {/* Navigation links */}
                <nav className="mb-6 sm:mb-8" aria-label={t('footerNavigation') || 'Footer navigation'}>
                    <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-6 text-gray-400 text-xs sm:text-sm">
                        <li>
                            <Link
                                href="/catalog"
                                prefetch={false}
                                onMouseEnter={catalogPrefetch.handleMouseEnter}
                                onMouseLeave={catalogPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('catalog')}
                            </Link>
                        </li>
                        <li className="text-gray-600">•</li>
                        <li>
                            <Link
                                href="/about"
                                prefetch={false}
                                onMouseEnter={aboutPrefetch.handleMouseEnter}
                                onMouseLeave={aboutPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('about')}
                            </Link>
                        </li>
                        <li className="text-gray-600">•</li>
                        <li>
                            <Link
                                href="/contact"
                                prefetch={false}
                                onMouseEnter={contactPrefetch.handleMouseEnter}
                                onMouseLeave={contactPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('contact')}
                            </Link>
                        </li>
                        {/* Line break on mobile */}
                        <li className="basis-full sm:basis-auto h-0 sm:h-auto"></li>
                        <li className="hidden sm:block text-gray-600">•</li>
                        <li>
                            <Link
                                href="/terms"
                                prefetch={false}
                                onMouseEnter={termsPrefetch.handleMouseEnter}
                                onMouseLeave={termsPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('terms')}
                            </Link>
                        </li>
                        <li className="text-gray-600">•</li>
                        <li>
                            <Link
                                href="/cookies"
                                prefetch={false}
                                onMouseEnter={cookiesPrefetch.handleMouseEnter}
                                onMouseLeave={cookiesPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('cookies')}
                            </Link>
                        </li>
                        {/* Line break on mobile */}
                        <li className="basis-full sm:basis-auto h-0 sm:h-auto"></li>
                        <li className="hidden sm:block text-gray-600">•</li>
                        <li>
                            <Link
                                href="/privacy"
                                prefetch={false}
                                onMouseEnter={privacyPrefetch.handleMouseEnter}
                                onMouseLeave={privacyPrefetch.handleMouseLeave}
                                className="transition-colors hover-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('privacy')}
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* Copyright */}
                <div className="text-center text-white/40 text-xs sm:text-sm pt-6 sm:pt-8 relative">
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)' }} />
                    © {new Date().getFullYear()} {SITE_NAME_FULL}. {tc('allRightsReserved')}
                </div>
            </div>
        </footer>
    );
}

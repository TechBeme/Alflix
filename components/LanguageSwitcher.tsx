'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRADIENTS } from '@/lib/theme';
import { localeToTMDB } from '@/lib/language';
import type { Locale } from '@/i18n/routing';

/**
 * LanguageSwitcher - Unified language selector for the application.
 *
 * Controls BOTH:
 * 1. UI locale (next-intl via NEXT_LOCALE cookie)
 * 2. Content language (TMDB via UserPreferences.language in DB)
 *
 * For authenticated users: sets cookie + updates DB preference.
 * For unauthenticated users: sets cookie only.
 *
 * Design: Modal with search, flags, and grouped languages.
 */

const localeFlags: Record<Locale, string> = {
    'pt-BR': '🇧🇷',
    en: '🇺🇸',
    es: '🇪🇸',
    ar: '🇸🇦',
    de: '🇩🇪',
    fr: '🇫🇷',
    hi: '🇮🇳',
    it: '🇮🇹',
    ja: '🇯🇵',
    ko: '🇰🇷',
    ru: '🇷🇺',
    zh: '🇨🇳',
};

const localeLabels: Record<Locale, string> = {
    'pt-BR': 'Português (Brasil)',
    en: 'English',
    es: 'Español',
    ar: 'العربية',
    de: 'Deutsch',
    fr: 'Français',
    hi: 'हिन्दी',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    ru: 'Русский',
    zh: '中文',
};

interface LanguageSwitcherProps {
    /** Variant: 'icon' for navbar compact, 'full' for settings page, 'menu' for mobile menu */
    variant?: 'icon' | 'full' | 'menu';
    className?: string;
    /** User object from auth session. When present, language change also persists to DB. */
    user?: { id: string } | null;
}

const ALL_LOCALES: Locale[] = ['pt-BR', 'en', 'es', 'ar', 'de', 'fr', 'hi', 'it', 'ja', 'ko', 'ru', 'zh'];

export default function LanguageSwitcher({
    variant = 'icon',
    className,
    user,
}: LanguageSwitcherProps) {
    const locale = useLocale() as Locale;
    const t = useTranslations('language');
    const tc = useTranslations('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click (for menu and icon variants)
    useEffect(() => {
        if (!isModalOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModalOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isModalOpen]);

    // Focus search input when modal opens
    useEffect(() => {
        if (isModalOpen && searchInputRef.current && variant !== 'menu') {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isModalOpen, variant]);

    // Close on Escape
    useEffect(() => {
        if (!isModalOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setIsModalOpen(false); setSearch(''); }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isModalOpen]);

    const handleLocaleChange = useCallback((newLocale: Locale) => {
        if (newLocale === locale) {
            setIsModalOpen(false);
            setSearch('');
            return;
        }

        // Close modal immediately for instant feedback
        setIsModalOpen(false);
        setSearch('');

        // 1. Set cookie for UI locale (synchronous, instant)
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

        // 2. If authenticated, fire-and-forget DB update (non-blocking)
        if (user?.id) {
            const tmdbCode = localeToTMDB(newLocale);
            fetch('/api/settings/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: tmdbCode }),
                keepalive: true,
            }).catch((error) => {
                console.error('[LanguageSwitcher]', tc('failedToUpdateLanguagePreference'), error);
            });
        }

        // 3. Hard reload to guarantee new locale is applied
        // router.refresh/push are unreliable for same-URL locale changes,
        // so we do a real navigation that forces the server to re-read the cookie
        window.location.reload();
    }, [locale, user, tc]);

    // Filtered locales based on search
    const filteredLocales = ALL_LOCALES.filter((l) => {
        if (!search) return true;
        const term = search.toLowerCase();
        const label = localeLabels[l].toLowerCase();
        return label.includes(term) || l.toLowerCase().includes(term);
    });

    // --- Dropdown content (shared between icon & full variants) ---
    const renderDropdown = () => (
        <div
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden z-50"
            style={{ background: GRADIENTS.dropdown }}
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
        >
            {/* Search */}
            <div className="p-3 border-b border-white/[0.06]">
                <div className="relative">
                    <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchPlaceholder')}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>

            {/* Language list */}
            <div className="p-1.5 max-h-[280px] overflow-y-auto">
                {filteredLocales.length === 0 && (
                    <div className="px-3 py-6 text-center text-gray-500 text-sm">
                        {t('noResults')}
                    </div>
                )}

                {filteredLocales.length > 0 && (
                    <div className="space-y-0.5">
                        {filteredLocales.map((l) => (
                            <button
                                key={l}
                                onClick={() => handleLocaleChange(l)}
                                className={cn(
                                    'w-full px-3 py-2.5 flex items-center gap-3 rounded-xl transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                    l === locale
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                                )}
                            >
                                <span className="text-xl">{localeFlags[l]}</span>
                                <div className="flex-1 text-left">
                                    <span className="font-medium">{localeLabels[l]}</span>
                                </div>
                                {l === locale && <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    // --- Full variant (settings page) ---
    if (variant === 'full') {
        return (
            <div className={cn('space-y-2', className)}>
                <label className="text-sm font-medium text-gray-400">
                    {t('title')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {ALL_LOCALES.map((l) => (
                        <button
                            key={l}
                            onClick={() => handleLocaleChange(l)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                l === locale
                                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                                    : 'bg-white/[0.06] text-gray-300 border border-white/[0.08] hover:border-primary hover:text-white'
                            )}
                        >
                            <span className="text-lg">{localeFlags[l]}</span>
                            <span>{localeLabels[l]}</span>
                            {l === locale && <Check className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- Menu variant (for mobile menu) - button that expands a list ---
    if (variant === 'menu') {
        return (
            <div ref={dropdownRef} className={cn('w-full', className)}>
                <button
                    onClick={() => setIsModalOpen(!isModalOpen)}
                    className={cn(
                        'w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        'bg-white/[0.04] hover:bg-white/[0.06]'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Globe aria-hidden="true" className="w-[18px] h-[18px] text-white/40" />
                        <span className="font-medium text-[15px] text-white/70">{t('title')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white/50">
                            {localeFlags[locale]} {localeLabels[locale]}
                        </span>
                        <svg
                            aria-hidden="true"
                            className={cn('w-4 h-4 text-white/30 transition-transform duration-200', isModalOpen && 'rotate-180')}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>

                {isModalOpen && (
                    <div className="mt-1 rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {ALL_LOCALES.map((l) => (
                            <button
                                key={l}
                                onClick={() => handleLocaleChange(l)}
                                className={cn(
                                    'w-full px-4 py-3 flex items-center gap-3 transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                    l === locale
                                        ? 'text-primary bg-white/[0.04]'
                                        : 'text-gray-300 hover:bg-white/[0.04] hover:text-white'
                                )}
                            >
                                <span className="text-lg">{localeFlags[l]}</span>
                                <span className="flex-1 text-left font-medium">{localeLabels[l]}</span>
                                {l === locale && <Check className="w-4 h-4" aria-hidden="true" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- Icon variant (for Navbar) - opens dropdown below button ---
    return (
        <div ref={dropdownRef} className={cn('relative', className)}>
            <button
                onClick={() => { setIsModalOpen(!isModalOpen); setSearch(''); }}
                className={cn(
                    'flex items-center gap-1.5 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                )}
                aria-label={t('title')}
                title={t('title')}
            >
                <Globe aria-hidden="true" className="w-5 h-5" />
                <span className="text-xs font-medium hidden sm:inline">
                    {localeFlags[locale]}
                </span>
            </button>

            {isModalOpen && renderDropdown()}
        </div>
    );
}

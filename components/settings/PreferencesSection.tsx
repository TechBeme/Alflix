'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Play, Type, ChevronDown, Check, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { COLORS, GRADIENTS } from '@/lib/theme';
import SubtitlePreview from '@/components/settings/SubtitlePreview';
import { toast } from 'sonner';
import type { UserPreferencesData } from '@/app/settings/SettingsPageClient';
import { SUPPORTED_LANGUAGES, REGIONAL_VARIANT_NAMES, getLanguageName } from '@/lib/language';

interface PreferencesSectionProps {
    preferences: UserPreferencesData;
    onUpdate: (updated: Partial<UserPreferencesData>) => void;
}

/**
 * Agrupa idiomas por categoria (variantes regionais populares + todos os outros)
 */
const LANGUAGE_GROUPS = {
    popular: Object.keys(REGIONAL_VARIANT_NAMES),
    all: SUPPORTED_LANGUAGES.filter(lang => !REGIONAL_VARIANT_NAMES[lang as keyof typeof REGIONAL_VARIANT_NAMES])
};

/**
 * LanguageDropdown - Custom dropdown estilizado para seleção de idioma
 * Design: SeasonSelector (botão + ChevronDown rotate-180) + FilterBar (dropdown posicionamento)
 */
function LanguageDropdown({
    value,
    onChange,
    label,
    compact = false,
}: {
    value: string;
    onChange: (code: string) => void;
    label?: string;
    compact?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const t = useTranslations('settingsPreferences');

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus no input de busca ao abrir
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Filtrar idiomas pelo search
    const filterLanguages = (codes: string[]) => {
        if (!search) return codes;
        const term = search.toLowerCase();
        return codes.filter(code => {
            const name = getLanguageName(code).toLowerCase();
            return name.includes(term) || code.toLowerCase().includes(term);
        });
    };

    const filteredPopular = filterLanguages(LANGUAGE_GROUPS.popular);
    const filteredAll = filterLanguages(LANGUAGE_GROUPS.all as unknown as string[]);
    const hasResults = filteredPopular.length > 0 || filteredAll.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="block text-sm text-gray-400 mb-2">{label}</label>
            )}

            {/* Botão */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (isOpen) setSearch('');
                }}
                className={`flex items-center justify-between gap-2 border border-white/[0.06] rounded-xl hover:border-primary/50 transition-all shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? 'px-3 py-2 max-w-[200px]' : 'px-4 py-2.5 max-w-[260px]'
                    }`}
                style={{ background: GRADIENTS.input }}
            >
                <span className={`font-medium text-white truncate ${compact ? 'text-sm' : 'text-sm'}`}>
                    {getLanguageName(value)}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown - seguindo o padrão do FilterBar/VideoPlayerControls */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => { setIsOpen(false); setSearch(''); }}
                    />

                    {/* Panel */}
                    <div
                        className="absolute top-full left-0 mt-2 w-64 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
                        style={{ background: GRADIENTS.dropdown }}
                    >
                        {/* Search */}
                        <div className="p-2 border-b border-white/[0.06]">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('searchLanguage')}
                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="max-h-[280px] overflow-y-auto overscroll-contain">
                            {!hasResults && (
                                <div className="px-3 py-6 text-center text-gray-500 text-sm">
                                    {t('noLanguageFound')}
                                </div>
                            )}

                            {/* Populares */}
                            {filteredPopular.length > 0 && (
                                <>
                                    <div className="px-3 pt-2 pb-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                            {t('popular')}
                                        </p>
                                    </div>
                                    {filteredPopular.map((code) => (
                                        <button
                                            key={code}
                                            onClick={() => {
                                                onChange(code);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full px-3 py-2 flex items-center justify-between transition-all hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value === code
                                                ? 'bg-white/[0.06] text-primary'
                                                : 'text-gray-300 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-sm truncate">
                                                {getLanguageName(code)}
                                            </span>
                                            {value === code && <Check size={14} className="text-primary flex-shrink-0" aria-hidden="true" />}
                                        </button>
                                    ))}
                                </>
                            )}

                            {/* Todos */}
                            {filteredAll.length > 0 && (
                                <>
                                    <div className="px-3 pt-3 pb-1 border-t border-white/[0.04] mt-1">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                            {t('allLanguages')}
                                        </p>
                                    </div>
                                    {filteredAll.map((code) => (
                                        <button
                                            key={code}
                                            onClick={() => {
                                                onChange(code);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full px-3 py-2 flex items-center justify-between transition-all hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value === code
                                                ? 'bg-white/[0.06] text-primary'
                                                : 'text-gray-300 hover:text-white'
                                                }`}
                                        >
                                            <span className="text-sm truncate">
                                                {getLanguageName(code)}
                                            </span>
                                            {value === code && <Check size={14} className="text-primary flex-shrink-0" aria-hidden="true" />}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const SUBTITLE_SIZES = [
    { value: 'small', labelKey: 'sizeSmall' },
    { value: 'medium', labelKey: 'sizeMedium' },
    { value: 'large', labelKey: 'sizeLarge' },
    { value: 'xlarge', labelKey: 'sizeXLarge' },
];

const SUBTITLE_COLORS = [
    { value: '#FFFFFF', labelKey: 'colorWhite', className: 'bg-white' },
    { value: '#FFFF00', labelKey: 'colorYellow', className: 'bg-yellow-400' },
    { value: '#00FF00', labelKey: 'colorGreen', className: 'bg-green-400' },
    { value: '#00FFFF', labelKey: 'colorCyan', className: 'bg-cyan-400' },
];

const SUBTITLE_BGS = [
    { value: 'transparent', labelKey: 'bgTransparent' },
    { value: 'rgba(0,0,0,0.25)', labelKey: 'bgBlack25' },
    { value: 'rgba(0,0,0,0.5)', labelKey: 'bgBlack50' },
    { value: 'rgba(0,0,0,0.75)', labelKey: 'bgBlack75' },
];

const SUBTITLE_FONTS = [
    { value: 'default', labelKey: 'fontDefault' },
    { value: 'serif', labelKey: 'fontSerif' },
    { value: 'mono', labelKey: 'fontMono' },
    { value: 'casual', labelKey: 'fontCasual' },
];

/**
 * PreferencesSection - Seção de Preferências (idioma, autoplay, legendas)
 */
export default function PreferencesSection({ preferences, onUpdate }: PreferencesSectionProps) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const t = useTranslations('settingsPreferences');

    const savePreference = useCallback(async (updates: Partial<UserPreferencesData>, previousValues: Partial<UserPreferencesData>) => {
        try {
            const response = await fetch('/api/settings/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || t('saveError'));
            }
            // Status 204 = sucesso silencioso, sem retorno de dados
        } catch (error) {
            // Reverte a mudança em caso de erro
            onUpdate(previousValues);
            toast.error(error instanceof Error ? error.message : t('savePrefsError'));
        }
    }, [onUpdate]);

    const updatePreference = useCallback((key: string, value: unknown) => {
        const previousValue = preferences[key as keyof UserPreferencesData];

        // Atualiza localmente via onUpdate imediatamente para UI responsiva
        onUpdate({ [key]: value } as Partial<UserPreferencesData>);

        // Debounce para salvar no servidor
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            savePreference(
                { [key]: value } as Partial<UserPreferencesData>,
                { [key]: previousValue } as Partial<UserPreferencesData>
            );
        }, 500);
    }, [preferences, onUpdate, savePreference]);

    const handleResetSubtitles = useCallback(() => {
        const defaults = {
            subtitleEnabled: false,
            subtitleLang: preferences.language, // Usar idioma da interface como default
            subtitleSize: 'medium',
            subtitleColor: '#FFFFFF',
            subtitleBg: 'transparent',
            subtitleFont: 'default',
        };
        const previousValues = {
            subtitleEnabled: preferences.subtitleEnabled,
            subtitleLang: preferences.subtitleLang,
            subtitleSize: preferences.subtitleSize,
            subtitleColor: preferences.subtitleColor,
            subtitleBg: preferences.subtitleBg,
            subtitleFont: preferences.subtitleFont,
        };
        onUpdate(defaults);
        savePreference(defaults, previousValues);
    }, [preferences, onUpdate, savePreference]);

    return (
        <div className="space-y-6">
            {/* Autoplay */}
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <Play className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-white">{t('autoplay')}</h2>
                </div>

                <div className="space-y-1">
                    {/* Autoplay next */}
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-white font-medium mb-1">{t('nextEpisode')}</p>
                            <p className="text-sm text-gray-400">{t('nextEpisodeDesc')}</p>
                        </div>
                        <button
                            onClick={() => updatePreference('autoplayNext', !preferences.autoplayNext)}
                            role="switch"
                            aria-checked={preferences.autoplayNext}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.autoplayNext ? 'bg-primary' : 'bg-bg-muted'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${preferences.autoplayNext ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Autoplay trailer */}
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <p className="text-white font-medium mb-1">{t('trailers')}</p>
                            <p className="text-sm text-gray-400">{t('trailerDesc')}</p>
                        </div>
                        <button
                            onClick={() => updatePreference('autoplayTrailer', !preferences.autoplayTrailer)}
                            role="switch"
                            aria-checked={preferences.autoplayTrailer}
                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.autoplayTrailer ? 'bg-primary' : 'bg-bg-muted'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${preferences.autoplayTrailer ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Legendas */}
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <Type className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-white">{t('subtitlesTitle')}</h2>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between py-3 mb-4">
                    <div>
                        <p className="text-white font-medium">{t('enableSubtitles')}</p>
                        <p className="text-sm text-gray-400">{t('enableSubtitlesDesc')}</p>
                    </div>
                    <button
                        onClick={() => updatePreference('subtitleEnabled', !preferences.subtitleEnabled)}
                        role="switch"
                        aria-checked={preferences.subtitleEnabled}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.subtitleEnabled ? 'bg-primary' : 'bg-bg-muted'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${preferences.subtitleEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="space-y-5 pt-4 border-t border-white/[0.06]">
                    {/* Idioma das legendas */}
                    <LanguageDropdown
                        value={preferences.subtitleLang}
                        onChange={(code) => updatePreference('subtitleLang', code)}
                        label={t('subtitleLanguage')}
                        compact
                    />

                    {/* Tamanho */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('size')}</label>
                        <div className="flex flex-wrap gap-2">
                            {SUBTITLE_SIZES.map(size => (
                                <button
                                    key={size.value}
                                    onClick={() => updatePreference('subtitleSize', size.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.subtitleSize === size.value
                                        ? 'border-primary/50 bg-primary/10 text-white'
                                        : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {t(size.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cor */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('textColor')}</label>
                        <div className="flex gap-3">
                            {SUBTITLE_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    onClick={() => updatePreference('subtitleColor', color.value)}
                                    className={`w-9 h-9 rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.subtitleColor === color.value
                                        ? 'border-primary scale-110'
                                        : 'border-white/[0.12] hover:border-white/[0.25]'
                                        }`}
                                    title={t(color.labelKey)}
                                >
                                    <div className={`w-full h-full rounded-md ${color.className}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Background */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('background')}</label>
                        <select
                            value={preferences.subtitleBg}
                            onChange={(e) => updatePreference('subtitleBg', e.target.value)}
                            className="w-full sm:w-64 px-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                        >
                            {SUBTITLE_BGS.map(bg => (
                                <option key={bg.value} value={bg.value} className="bg-[#1a1a1a]">{t(bg.labelKey)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Fonte */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('fontLabel')}</label>
                        <div className="flex flex-wrap gap-2">
                            {SUBTITLE_FONTS.map(font => (
                                <button
                                    key={font.value}
                                    onClick={() => updatePreference('subtitleFont', font.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${preferences.subtitleFont === font.value
                                        ? 'border-primary/50 bg-primary/10 text-white'
                                        : 'border-white/[0.06] bg-white/[0.02] text-gray-400 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    {t(font.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <SubtitlePreview
                        color={preferences.subtitleColor}
                        bg={preferences.subtitleBg}
                        size={preferences.subtitleSize}
                        font={preferences.subtitleFont}
                    />

                    {/* Reset */}
                    <button
                        onClick={handleResetSubtitles}
                        className="text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {t('restoreDefault')}
                    </button>
                </div>
            </div>
        </div>
    );
}
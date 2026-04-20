'use client';

import { Season } from '@/lib/tmdb';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

interface SeasonSelectorProps {
    seasons: Season[];
    currentSeason: number;
    onSeasonChange: (seasonNumber: number) => void;
}

/**
 * SeasonSelector - Dropdown component for selecting TV show seasons
 * Displays season list with episode counts
 */
export default function SeasonSelector({
    seasons,
    currentSeason,
    onSeasonChange,
}: SeasonSelectorProps) {
    const t = useTranslations('season');
    const [isOpen, setIsOpen] = useState(false);

    // Filter out season 0 (specials) and sort
    const validSeasons = seasons
        .filter((s) => s.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number);

    const currentSeasonData = validSeasons.find((s) => s.season_number === currentSeason);

    if (validSeasons.length === 0) return null;

    return (
        <div className="relative">
            {/* Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 px-6 py-3 border border-white/[0.06] rounded-xl hover:border-primary transition-colors min-w-[250px] shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: GRADIENTS.input }}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <div className="text-left">
                    <div className="font-semibold text-white">
                        {currentSeasonData?.name || t('seasonNumber', { number: currentSeason })}
                    </div>
                    {currentSeasonData && (
                        <div className="text-xs text-gray-500">
                            {currentSeasonData.episode_count} {t('episodes')}
                        </div>
                    )}
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                    aria-hidden="true"
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop to close dropdown */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute top-full left-0 mt-2 w-full border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 z-50 max-h-[400px] overflow-y-auto" style={{ background: GRADIENTS.dropdown }} role="listbox">
                        {validSeasons.map((season) => (
                            <button
                                key={season.id}
                                onClick={() => {
                                    onSeasonChange(season.season_number);
                                    setIsOpen(false);
                                }}
                                role="option"
                                aria-selected={season.season_number === currentSeason}
                                className={`w-full px-6 py-4 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${season.season_number === currentSeason
                                    ? 'bg-white/[0.06] border-l-4 border-l-primary'
                                    : ''
                                    }`}
                            >
                                <div className="font-semibold text-white mb-1">
                                    {season.name}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {season.episode_count} {t('episodes')}
                                </div>
                                {season.air_date && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(season.air_date).getFullYear()}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

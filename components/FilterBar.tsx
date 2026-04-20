'use client';

import {
    X,
    ChevronDown,
    Star,
    Check,
    ArrowUpDown,
    Tag,
    Calendar,
    TrendingUp,
    ThumbsUp,
    Users,
    Clock,
    CalendarDays,
    SortAsc,
    SortDesc
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { GRADIENTS } from '@/lib/theme';

/**
 * Interface para os filtros ativos
 * Suporta múltiplos gêneros e múltiplos anos
 */
export interface ActiveFilters {
    genres?: string[];
    years?: string[];
    rating?: string;
    sortBy?: string;
}

export interface FilterBarProps {
    activeFilters: ActiveFilters;
    onFilterChange: (filters: ActiveFilters) => void;
    mediaType?: 'movie' | 'tv' | 'all';
    genres: Array<{ id: number; name: string; mediaTypes?: ('movie' | 'tv')[] }>;
}

interface Genre {
    id: number;
    name: string;
    mediaTypes?: ('movie' | 'tv')[];
}

/**
 * FilterBar Component
 * 
 * Design baseado em princípios de neurociência e UX:
 * - Agrupamento visual (Gestalt) para reduzir carga cognitiva
 * - Hierarquia clara: Filtros → Tags selecionadas
 * - Ordenação visualmente separada dos filtros
 */
export default function FilterBar({
    activeFilters,
    onFilterChange,
    mediaType = 'all',
    genres: initialGenres,
}: FilterBarProps) {
    const t = useTranslations('filter');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const [loadingGenres] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // Usar gêneros do SSR
    const genres = initialGenres;

    // Filtrar gêneros baseado no mediaType
    const filteredGenres = mediaType === 'all'
        ? genres // Mostrar todos quando filtro é 'all'
        : genres.filter(genre => {
            // Se não tem metadata de mediaTypes, assumir que está disponível (fallback)
            if (!genre.mediaTypes || genre.mediaTypes.length === 0) return true;
            // Mostrar apenas gêneros compatíveis com o tipo selecionado
            return genre.mediaTypes.includes(mediaType);
        });

    // Gêneros populares (IDs do TMDB) - apenas os que estão nos filteredGenres
    const popularGenreIds = [28, 35, 18, 27, 10749, 878, 53, 16];
    const availablePopularIds = popularGenreIds.filter(id =>
        filteredGenres.some(g => g.id === id)
    );

    // Anos dinâmicos
    const currentYear = new Date().getFullYear();
    const recentYears = Array.from({ length: 6 }, (_, i) => {
        const year = currentYear - i;
        return { label: year.toString(), value: year.toString() };
    });

    const decades = [
        { label: t('decade2010'), value: '2010-2019' },
        { label: t('decade2000'), value: '2000-2009' },
        { label: t('decade90'), value: '1990-1999' },
        { label: t('decade80'), value: '1980-1989' },
        { label: t('classics'), value: '1900-1979' },
    ];

    const ratingOptions = [
        { label: t('excellent'), value: '8', stars: 5, description: '8+' },
        { label: t('veryGood'), value: '7', stars: 4, description: '7+' },
        { label: t('good'), value: '6', stars: 3, description: '6+' },
        { label: t('regular'), value: '5', stars: 2, description: '5+' },
    ];

    // Opções de ordenação (por ordem de interesse/popularidade)
    const sortOptions = [
        { label: t('mostPopular'), value: 'popularity.desc', icon: TrendingUp },
        { label: t('bestRated'), value: 'vote_average.desc', icon: ThumbsUp },
        { label: t('mostVoted'), value: 'vote_count.desc', icon: Users },
        { label: t('newest'), value: mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc', icon: CalendarDays },
        { label: t('oldest'), value: mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc', icon: Clock },
        { label: t('aToZ'), value: mediaType === 'movie' ? 'title.asc' : 'name.asc', icon: SortAsc },
        { label: t('zToA'), value: mediaType === 'movie' ? 'title.desc' : 'name.desc', icon: SortDesc },
    ];

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // Verifica se clicou dentro de um dropdown ou botão de dropdown
            const clickedInsideDropdown = target.closest('[data-dropdown]');
            if (!clickedInsideDropdown) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Limpar gêneros incompatíveis quando mediaType mudar
    useEffect(() => {
        const currentGenres = activeFilters.genres || [];
        if (currentGenres.length === 0) return;

        // Filtrar apenas gêneros compatíveis com o mediaType atual
        const compatibleGenres = currentGenres.filter(genreId => {
            const genre = genres.find(g => g.id.toString() === genreId);
            if (!genre) return false;

            // Se é 'all', manter todos
            if (mediaType === 'all') return true;

            // Se não tem metadata, manter (fallback)
            if (!genre.mediaTypes || genre.mediaTypes.length === 0) return true;

            // Manter apenas se é compatível com o mediaType atual
            return genre.mediaTypes.includes(mediaType);
        });

        // Se a lista mudou, atualizar filtros
        if (compatibleGenres.length !== currentGenres.length) {
            onFilterChange({
                ...activeFilters,
                genres: compatibleGenres.length > 0 ? compatibleGenres : undefined
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mediaType, genres]); // Só rodar quando mediaType ou genres mudarem (não incluir activeFilters para evitar loop)

    // Toggle de gênero (múltipla seleção)
    const handleGenreToggle = (genreId: string) => {
        const current = activeFilters.genres || [];
        const newGenres = current.includes(genreId)
            ? current.filter(g => g !== genreId)
            : [...current, genreId];
        onFilterChange({ ...activeFilters, genres: newGenres.length > 0 ? newGenres : undefined });
    };

    // Toggle de ano (múltipla seleção)
    const handleYearToggle = (yearValue: string) => {
        const current = activeFilters.years || [];
        const newYears = current.includes(yearValue)
            ? current.filter(y => y !== yearValue)
            : [...current, yearValue];
        onFilterChange({ ...activeFilters, years: newYears.length > 0 ? newYears : undefined });
    };

    // Mudar filtro simples
    const handleFilterChange = (key: 'rating' | 'sortBy', value: string) => {
        const newFilters = { ...activeFilters };
        if (!value || value === activeFilters[key]) {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        onFilterChange(newFilters);
        setOpenDropdown(null);
    };

    // Limpar todos os filtros
    const clearAllFilters = () => {
        onFilterChange({ sortBy: activeFilters.sortBy }); // Mantém ordenação
    };

    // Contagem de filtros ativos (excluindo ordenação)
    const activeFilterCount =
        (activeFilters.genres?.length || 0) +
        (activeFilters.years?.length || 0) +
        (activeFilters.rating ? 1 : 0);

    const popularGenres = filteredGenres.filter(g => popularGenreIds.includes(g.id));
    const otherGenres = filteredGenres.filter(g => !popularGenreIds.includes(g.id));

    // Labels
    const getGenreLabel = () => {
        const count = activeFilters.genres?.length || 0;
        if (count === 0) return t('genre');
        if (count === 1) {
            const genre = filteredGenres.find(g => g.id.toString() === activeFilters.genres![0]);
            return genre?.name || t('genre');
        }
        return t('genresCount', { count });
    };

    const getYearLabel = () => {
        const count = activeFilters.years?.length || 0;
        if (count === 0) return t('year');
        if (count === 1) {
            const year = [...recentYears, ...decades].find(y => y.value === activeFilters.years![0]);
            return year?.label || activeFilters.years![0];
        }
        return t('periodsCount', { count });
    };

    const getRatingLabel = () => {
        if (!activeFilters.rating) return t('rating');
        const rating = ratingOptions.find(r => r.value === activeFilters.rating);
        return rating ? `${rating.description}` : t('rating');
    };

    const isGenreSelected = (id: string) => activeFilters.genres?.includes(id) || false;
    const isYearSelected = (value: string) => activeFilters.years?.includes(value) || false;

    // Componente de botão de filtro
    const FilterButton = ({
        label,
        isActive,
        onClick,
        dropdownKey,
        icon: Icon,
    }: {
        label: string;
        isActive: boolean;
        onClick: () => void;
        dropdownKey: string;
        icon: any;
    }) => (
        <button
            data-dropdown
            onClick={onClick}
            aria-expanded={openDropdown === dropdownKey}
            aria-haspopup="listbox"
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto justify-between sm:justify-start
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white border border-white/[0.06] hover:border-primary'
                }
            `}
            style={!isActive ? { background: GRADIENTS.filterButton } : {}}
        >
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{label}</span>
            </div>
            <ChevronDown
                size={14}
                className={`transition-transform ${openDropdown === dropdownKey ? 'rotate-180' : ''}`}
                aria-hidden="true"
            />
        </button>
    );

    return (
        <div className="space-y-3">
            {/* Linha 1: Filtros + Ordenação */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-3">
                {/* Filtros (esquerda) - Grid responsivo no mobile */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                    {/* Gênero */}
                    <div className="relative">
                        <FilterButton
                            label={getGenreLabel()}
                            isActive={(activeFilters.genres?.length || 0) > 0}
                            onClick={() => setOpenDropdown(openDropdown === 'genre' ? null : 'genre')}
                            dropdownKey="genre"
                            icon={Tag}
                        />

                        {openDropdown === 'genre' && (
                            <div data-dropdown role="listbox" className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl shadow-black/40 border border-white/[0.08] py-3 z-50 max-h-96 overflow-y-auto" style={{ background: GRADIENTS.dropdown }}>
                                {(activeFilters.genres?.length || 0) > 0 && (
                                    <div className="px-4 pb-3 mb-2 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 font-medium">
                                            {activeFilters.genres?.length} {(activeFilters.genres?.length || 0) > 1 ? tc('selectedPlural') : tc('selected')}
                                        </span>
                                        <button
                                            onClick={() => onFilterChange({ ...activeFilters, genres: undefined })}
                                            className="text-xs text-primary hover:text-white transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            {tc('clear')}
                                        </button>
                                    </div>
                                )}

                                <div className="px-4 pb-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2.5 font-semibold">{t('popular')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {loadingGenres ? (
                                            <span className="text-gray-400 text-sm">{tc('loading')}</span>
                                        ) : (
                                            popularGenres.map(genre => (
                                                <button
                                                    key={genre.id}
                                                    role="option"
                                                    aria-selected={isGenreSelected(genre.id.toString())}
                                                    onClick={() => handleGenreToggle(genre.id.toString())}
                                                    className={`
                                                        flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                        ${isGenreSelected(genre.id.toString())
                                                            ? 'bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-primary/50'
                                                            : 'text-gray-300 border border-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-sm hover:shadow-black/20'
                                                        }
                                                    `}
                                                    style={!isGenreSelected(genre.id.toString()) ? { background: GRADIENTS.filterDropdownItem } : {}}
                                                >
                                                    {isGenreSelected(genre.id.toString()) && <Check size={12} aria-hidden="true" />}
                                                    {genre.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {otherGenres.length > 0 && (
                                    <div className="px-4 pt-3 border-t border-white/10">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2.5 font-semibold">{t('allGenres')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {otherGenres.map(genre => (
                                                <button
                                                    key={genre.id}
                                                    role="option"
                                                    aria-selected={isGenreSelected(genre.id.toString())}
                                                    onClick={() => handleGenreToggle(genre.id.toString())}
                                                    className={`
                                                        flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                        ${isGenreSelected(genre.id.toString())
                                                            ? 'bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-primary/50'
                                                            : 'text-gray-400 border border-white/[0.06] hover:border-white/15 hover:text-white hover:shadow-sm hover:shadow-black/20'
                                                        }
                                                    `}
                                                    style={!isGenreSelected(genre.id.toString()) ? { background: GRADIENTS.filterDropdownItemAlt } : {}}
                                                >
                                                    {isGenreSelected(genre.id.toString()) && <Check size={12} aria-hidden="true" />}
                                                    {genre.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ano */}
                    <div className="relative">
                        <FilterButton
                            label={getYearLabel()}
                            isActive={(activeFilters.years?.length || 0) > 0}
                            onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                            dropdownKey="year"
                            icon={Calendar}
                        />

                        {openDropdown === 'year' && (
                            <div data-dropdown role="listbox" className="absolute top-full left-0 mt-2 w-full max-w-[calc(100vw-2rem)] sm:w-60 rounded-xl shadow-2xl shadow-black/40 border border-white/[0.08] py-3 z-50" style={{ background: GRADIENTS.dropdown }}>
                                {(activeFilters.years?.length || 0) > 0 && (
                                    <div className="px-4 pb-3 mb-2 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 font-medium">
                                            {activeFilters.years?.length} {(activeFilters.years?.length || 0) > 1 ? tc('selectedPlural') : tc('selected')}
                                        </span>
                                        <button
                                            onClick={() => onFilterChange({ ...activeFilters, years: undefined })}
                                            className="text-xs text-primary hover:text-white transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            {tc('clear')}
                                        </button>
                                    </div>
                                )}

                                <div className="px-4 pb-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2.5 font-semibold">{t('recent')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {recentYears.map(year => (
                                            <button
                                                key={year.value}
                                                onClick={() => handleYearToggle(year.value)}
                                                className={`
                                                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                    ${isYearSelected(year.value)
                                                        ? 'bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-primary/50'
                                                        : 'text-gray-300 border border-white/[0.08] hover:border-white/20 hover:text-white hover:shadow-sm hover:shadow-black/20'
                                                    }
                                                `}
                                                style={!isYearSelected(year.value) ? { background: GRADIENTS.filterDropdownItem } : {}}
                                            >
                                                {isYearSelected(year.value) && <Check size={12} aria-hidden="true" />}
                                                {year.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-4 pt-3 border-t border-white/10">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2.5 font-semibold">{t('decades')}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {decades.map(decade => (
                                            <button
                                                key={decade.value}
                                                onClick={() => handleYearToggle(decade.value)}
                                                className={`
                                                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                    ${isYearSelected(decade.value)
                                                        ? 'bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-primary/50'
                                                        : 'text-gray-400 border border-white/[0.06] hover:border-white/15 hover:text-white hover:shadow-sm hover:shadow-black/20'
                                                    }
                                                `}
                                                style={!isYearSelected(decade.value) ? { background: GRADIENTS.filterDropdownItemAlt } : {}}
                                            >
                                                {isYearSelected(decade.value) && <Check size={12} aria-hidden="true" />}
                                                {decade.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avaliação */}
                    <div className="relative">
                        <FilterButton
                            label={getRatingLabel()}
                            isActive={!!activeFilters.rating}
                            onClick={() => setOpenDropdown(openDropdown === 'rating' ? null : 'rating')}
                            dropdownKey="rating"
                            icon={Star}
                        />

                        {openDropdown === 'rating' && (
                            <div data-dropdown role="listbox" className="absolute top-full left-0 mt-2 w-max min-w-[240px] max-w-[calc(100vw-2rem)] sm:w-60 rounded-xl shadow-2xl shadow-black/40 border border-white/[0.08] py-2 z-50" style={{ background: GRADIENTS.dropdown }}>
                                {ratingOptions.map(rating => {
                                    const isActive = activeFilters.rating === rating.value;
                                    return (
                                        <button
                                            key={rating.value}
                                            onClick={() => handleFilterChange('rating', rating.value)}
                                            className={`
                                                w-full px-4 py-2.5 flex items-center gap-3 transition-all
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                                ${isActive
                                                    ? 'text-primary'
                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={`transition-colors ${i < rating.stars
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-700'
                                                            }`}
                                                        aria-hidden="true"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium">{rating.label}</span>
                                            <span className="text-xs ml-auto font-medium">
                                                {rating.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Ordenação (direita) - Sempre alinhada à direita */}
                <div className="relative">
                    <button
                        data-dropdown
                        onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                        aria-expanded={openDropdown === 'sort'}
                        aria-haspopup="menu"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ArrowUpDown size={16} aria-hidden="true" />
                        <span>
                            {sortOptions.find(s => s.value === (activeFilters.sortBy || 'popularity.desc'))?.label || t('sortBy')}
                        </span>
                        <ChevronDown
                            size={14}
                            className={`transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </button>

                    {openDropdown === 'sort' && (
                        <div data-dropdown role="menu" className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-max rounded-xl shadow-2xl shadow-black/40 border border-white/[0.08] py-2 z-50" style={{ background: GRADIENTS.dropdown }}>
                            {sortOptions.map(sort => {
                                const Icon = sort.icon;
                                const isActive = (activeFilters.sortBy || 'popularity.desc') === sort.value;
                                return (
                                    <button
                                        key={sort.value}
                                        onClick={() => handleFilterChange('sortBy', sort.value)}
                                        className={`
                                            w-full px-4 py-2.5 text-left text-sm transition-all flex items-center gap-3
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                                            ${isActive
                                                ? 'text-primary'
                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }
                                        `}
                                    >
                                        <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-500'} aria-hidden="true" />
                                        <span>{sort.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Linha 2: Tags de filtros selecionados (separada) */}
            {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs text-gray-500 mr-1">{t('activeFilters')}</span>

                    {/* Tags de gêneros */}
                    {activeFilters.genres?.map(genreId => {
                        const genre = genres.find(g => g.id.toString() === genreId);
                        return genre ? (
                            <span
                                key={genreId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                            >
                                {genre.name}
                                <button
                                    onClick={() => handleGenreToggle(genreId)}
                                    aria-label={tA11y('removeFilter', { name: genre.name })}
                                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <X size={12} aria-hidden="true" />
                                </button>
                            </span>
                        ) : null;
                    })}

                    {/* Tags de anos */}
                    {activeFilters.years?.map(yearValue => {
                        const yearOption = [...recentYears, ...decades].find(y => y.value === yearValue);
                        return (
                            <span
                                key={yearValue}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium"
                            >
                                {yearOption?.label || yearValue}
                                <button
                                    onClick={() => handleYearToggle(yearValue)}
                                    aria-label={tA11y('removeFilter', { name: yearOption?.label || yearValue })}
                                    className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <X size={12} aria-hidden="true" />
                                </button>
                            </span>
                        );
                    })}

                    {/* Tag de avaliação */}
                    {activeFilters.rating && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                            {ratingOptions.find(r => r.value === activeFilters.rating)?.label}
                            <button
                                onClick={() => handleFilterChange('rating', '')}
                                aria-label={tA11y('removeFilter', { name: ratingOptions.find(r => r.value === activeFilters.rating)?.label || '' })}
                                className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <X size={12} aria-hidden="true" />
                            </button>
                        </span>
                    )}

                    {/* Botão limpar tudo */}
                    {activeFilterCount > 1 && (
                        <button
                            onClick={clearAllFilters}
                            className="text-xs text-gray-500 hover:text-white transition-colors ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {tc('clearAll')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

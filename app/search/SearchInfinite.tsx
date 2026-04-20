'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchInfinite } from './useSearchInfinite';
import { GRADIENTS } from '@/lib/theme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaTypeFilter, { type MediaType } from '@/components/MediaTypeFilter';
import FilterBar, { type ActiveFilters } from '@/components/FilterBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import InfiniteGrid from '@/components/InfiniteGrid';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useTranslations } from 'next-intl';
import type { Session } from '@/lib/auth-client';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  media_type?: 'movie' | 'tv';
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  inWatchlist?: boolean; // Vem da API
}

interface SearchInfiniteProps {
  initialQuery: string;
  initialFilter: 'all' | 'movie' | 'tv';
  initialSession?: Session | null;
  initialResults: {
    results: SearchResult[];
    totalPages: number;
    totalResults: number;
    page: number;
  } | null;
  genresData: Array<{ id: number; name: string }>;
  initialAdvancedFilters?: ActiveFilters;
}

export default function SearchInfinite({
  initialQuery,
  initialFilter,
  initialSession,
  initialResults,
  genresData,
  initialAdvancedFilters = {},
}: SearchInfiniteProps) {
  const t = useTranslations('searchPage');
  const tm = useTranslations('metadata');
  // States separados: inputValue (imediato) e searchQuery (debounced)
  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filter, setFilter] = useState(initialFilter);
  const [advancedFilters, setAdvancedFilters] = useState<ActiveFilters>(initialAdvancedFilters);

  // Hook de scroll to top
  const [showScrollTop, scrollToTop] = useScrollToTop(500);

  // Atualizar estado quando initialQuery mudar (navegação de /search?q=a para /search?q=b)
  useEffect(() => {
    setInputValue(initialQuery);
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // Debounce para busca (500ms - mesmo delay do SearchModal)
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [inputValue]);

  // Extrair filtros individuais
  const genres = advancedFilters.genres?.join(',') || '';
  const years = advancedFilters.years?.join(',') || '';
  const rating = advancedFilters.rating || '';
  const sortBy = advancedFilters.sortBy || '';

  // Infinite Query Hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useSearchInfinite({
    query: searchQuery,
    filter,
    genres,
    years,
    rating,
    sortBy,
    initialResults,
    fallbackErrorMessage: tm('searchFailed'),
  });

  // Calcular total de resultados
  const allResults = data?.pages.flatMap((page) => page.results) ?? [];
  const totalResults = data?.pages[0]?.totalResults ?? 0;

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // A busca já é automática via debounce, mas permite submit manual
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setAdvancedFilters({});
  };

  const handleFilterChange = (newFilter: MediaType) => {
    setFilter(newFilter);
  };

  const handleAdvancedFiltersChange = (filters: ActiveFilters) => {
    setAdvancedFilters(filters);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: GRADIENTS.pageContent }}>
      {/* Navbar */}
      <Navbar initialSession={initialSession} />

      {/* Content */}
      <div className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {initialQuery ? t('searchTitle') : t('searchAction')}
              </h1>
              <p className="text-gray-400">
                {totalResults > 0 && searchQuery
                  ? t('resultsFor', { count: totalResults, query: searchQuery })
                  : totalResults > 0 && !searchQuery
                    ? t('resultsNoQuery', { count: totalResults })
                    : searchQuery
                      ? t('typeToSearch')
                      : t('useSearchBar')}
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSearch}
              className="mb-6"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('placeholder')}
                  className="w-full bg-bg-darker3 text-white text-lg pl-14 pr-14 py-4 rounded-xl border border-gray-800 focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label={t('clearSearch')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-white" aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.form>

            {/* Type Filters - Tabs com Underline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <MediaTypeFilter
                activeFilter={filter}
                onChange={handleFilterChange}
              />
            </motion.div>

            {/* Advanced Filters - Mostrar apenas quando NÃO há texto de busca */}
            {!searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FilterBar
                  activeFilters={advancedFilters}
                  onFilterChange={handleAdvancedFiltersChange}
                  mediaType={filter}
                  genres={genresData}
                />
              </motion.div>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : allResults.length > 0 ? (
            <InfiniteGrid
              items={allResults}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={!!hasNextPage}
              onLoadMore={fetchNextPage}
              mediaTypeFilter={filter}
              showMediaTypeIcon={true}
              endMessage={t('endMessage')}
              rootMargin="600px"
            />
          ) : searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="w-20 h-20 text-gray-700 mx-auto mb-6" aria-hidden="true" />
              <h2 className="text-2xl font-bold mb-2">{t('noResults')}</h2>
              <p className="text-gray-400 mb-6">
                {t('notFoundFor', { query: searchQuery })}
              </p>
              <button
                onClick={handleClearSearch}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('clearSearch')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="w-20 h-20 text-gray-700 mx-auto mb-6" aria-hidden="true" />
              <h2 className="text-2xl font-bold mb-2">{t('startSearch')}</h2>
              <p className="text-gray-400">
                {t('searchHint')}
              </p>
            </motion.div>
          )}

          {/* Scroll to Top Button */}
          {showScrollTop && <ScrollToTopButton onClick={scrollToTop} />}
        </div>
      </div>

      <Footer />
    </div>
  );
}

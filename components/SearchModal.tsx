'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Film, Tv, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getPosterUrl } from '@/lib/image-utils';
import { usePrefetch } from '@/hooks/usePrefetch';
import { GRADIENTS } from '@/lib/theme';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    media_type?: 'movie' | 'tv';
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const t = useTranslations('search');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const [query, setQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const prefetchTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const router = useRouter();

    // Prefetch para busca avançada
    const advancedSearchPrefetch = usePrefetch('/search', 200);

    // Necessário para o Portal funcionar com SSR
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Limpa todos os timeouts de prefetch ao fechar o modal
            prefetchTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            prefetchTimeoutsRef.current.clear();
        }

        return () => {
            document.body.style.overflow = 'unset';
            // Limpa timeouts ao desmontar
            prefetchTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            prefetchTimeoutsRef.current.clear();
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Buscar resultados quando o usuário digita
    useEffect(() => {
        const searchTimeout = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setShowResults(false);
                return;
            }

            setLoading(true);
            setShowResults(true);

            try {
                const response = await fetch(
                    `/api/quick-search?query=${encodeURIComponent(query)}`
                );

                if (!response.ok) {
                    throw new Error(t('failedToSearch'));
                }

                const data = await response.json();
                // Limitar a 4 resultados para o preview do modal
                const previewResults = (data.results || []).slice(0, 4);

                setResults(previewResults);
            } catch (error) {
                console.error(t('errorSearching'), error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 500); // Debounce de 500ms

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const handleResultClick = (result: SearchResult) => {
        const type = result.media_type === 'tv' ? 'tv' : 'movie';
        router.push(`/media/${type}/${result.id}`);
        onClose();
    };

    const handleViewAllResults = () => {
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    const handleQuickSearch = (searchTerm: string) => {
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
        onClose();
    };

    const handleAdvancedSearch = () => {
        router.push('/search');
        onClose();
    };

    // Funções para prefetch de resultados (com delay)
    const handleResultMouseEnter = (result: SearchResult) => {
        const type = result.media_type === 'tv' ? 'tv' : 'movie';
        const url = `/media/${type}/${result.id}`;

        // Limpa timeout anterior se existir
        const existingTimeout = prefetchTimeoutsRef.current.get(result.id);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Cria novo timeout para prefetch (300ms delay)
        const timeout = setTimeout(() => {
            router.prefetch(url);
        }, 300);

        prefetchTimeoutsRef.current.set(result.id, timeout);
    };

    const handleResultMouseLeave = (result: SearchResult) => {
        // Cancela o prefetch se o mouse sair antes do delay
        const timeout = prefetchTimeoutsRef.current.get(result.id);
        if (timeout) {
            clearTimeout(timeout);
            prefetchTimeoutsRef.current.delete(result.id);
        }
    };

    // Prefetch para botões de gênero (usando hash do gênero como chave)
    const handleGenreMouseEnter = (genre: string) => {
        const url = `/search?q=${encodeURIComponent(genre)}`;
        const genreHash = genre.charCodeAt(0); // Usa primeiro char como chave simples

        const existingTimeout = prefetchTimeoutsRef.current.get(genreHash);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        const timeout = setTimeout(() => {
            router.prefetch(url);
        }, 200); // Delay menor para botões estáticos

        prefetchTimeoutsRef.current.set(genreHash, timeout);
    };

    const handleGenreMouseLeave = (genre: string) => {
        const genreHash = genre.charCodeAt(0);
        const timeout = prefetchTimeoutsRef.current.get(genreHash);
        if (timeout) {
            clearTimeout(timeout);
            prefetchTimeoutsRef.current.delete(genreHash);
        }
    };

    const genres = [t('genres.action'), t('genres.comedy'), t('genres.drama'), t('genres.sciFi'), t('genres.horror')];

    // Não renderiza nada até o componente estar montado no cliente
    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop com blur que cobre toda a página */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/70"
                        style={{
                            zIndex: 99998,
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)'
                        }}
                        onClick={onClose}
                    />

                    {/* Container do Modal acima do backdrop */}
                    <div className="fixed inset-0 overflow-y-auto pointer-events-none" style={{ zIndex: 99999 }}>
                        <motion.div
                            ref={modalRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label={t('title')}
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="max-w-3xl mx-auto px-4 pt-24 pointer-events-auto"
                        >
                            {/* Search Input */}
                            <div className="relative mb-8">
                                <Search aria-hidden="true" className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('placeholder')}
                                    aria-label={tA11y('searchInput')}
                                    className="w-full bg-bg-card backdrop-blur-sm text-white text-lg pl-14 pr-14 py-4 rounded-2xl border-2 border-white/[0.08] focus:outline-none focus:border-primary transition-colors shadow-2xl shadow-black/40 relative z-0"
                                    autoFocus
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        aria-label={tA11y('clearSearch')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <X aria-hidden="true" className="w-5 h-5 text-gray-400 hover:text-white" />
                                    </button>
                                )}
                                {!query && (
                                    <button
                                        onClick={onClose}
                                        aria-label={tA11y('closeSearch')}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <X aria-hidden="true" className="w-5 h-5 text-gray-400 hover:text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Popular Searches */}
                            {!query && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-400 text-sm">{t('popularSearches')}</p>
                                        <button
                                            onClick={handleAdvancedSearch}
                                            onMouseEnter={advancedSearchPrefetch.handleMouseEnter}
                                            onMouseLeave={advancedSearchPrefetch.handleMouseLeave}
                                            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                                            <span>{t('advancedSearch')}</span>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {genres.map((genre, index) => (
                                            <motion.button
                                                key={genre}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                                                onClick={() => handleQuickSearch(genre)}
                                                onMouseEnter={() => handleGenreMouseEnter(genre)}
                                                onMouseLeave={() => handleGenreMouseLeave(genre)}
                                                className="px-6 py-3 backdrop-blur-sm text-white rounded-full hover:bg-white/[0.08] transition-colors border border-white/[0.06] hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                style={{ background: GRADIENTS.search }}
                                            >
                                                {genre}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Search Results */}
                            {showResults && query && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8"
                                >
                                    <p className="text-gray-400 text-sm mb-4">
                                        {loading ? t('searching') : t('resultsFor', { query })}
                                    </p>

                                    {loading ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-4 p-3 backdrop-blur-sm rounded-xl border border-white/[0.06] animate-pulse"
                                                    style={{ background: GRADIENTS.search }}
                                                >
                                                    <div className="w-16 h-24 bg-gray-800 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-5 bg-gray-800 rounded w-3/4" />
                                                        <div className="h-4 bg-gray-800 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : results.length > 0 ? (
                                        <>
                                            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                                {results.map((result) => (
                                                    <motion.button
                                                        key={result.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        onClick={() => handleResultClick(result)}
                                                        onMouseEnter={() => handleResultMouseEnter(result)}
                                                        onMouseLeave={() => handleResultMouseLeave(result)}
                                                        className="flex gap-4 p-3 backdrop-blur-sm rounded-xl border border-white/[0.06] hover:border-primary transition-all w-full text-left group shadow-lg shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                        style={{ background: GRADIENTS.search }}
                                                    >
                                                        <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-900">
                                                            <OptimizedImage
                                                                src={getPosterUrl(result.poster_path)}
                                                                alt={result.title || result.name || ''}
                                                                fill
                                                                loading="lazy"
                                                                sizeContext="searchResult"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start gap-2 mb-1">
                                                                {result.media_type === 'movie' ? (
                                                                    <Film aria-hidden="true" className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                                                                ) : (
                                                                    <Tv aria-hidden="true" className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                                                                )}
                                                                <h3 className="text-white font-medium group-hover:text-primary transition-colors truncate">
                                                                    {result.title || result.name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                                <span>
                                                                    {result.media_type === 'movie' ? tc('movie') : tc('tvShow')}
                                                                </span>
                                                                {(result.release_date || result.first_air_date) && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>
                                                                            {new Date(result.release_date || result.first_air_date || '').getFullYear()}
                                                                        </span>
                                                                    </>
                                                                )}
                                                                {result.vote_average > 0 && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            ⭐ {result.vote_average.toFixed(1)}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>

                                            {/* Botão Ver Todos os Resultados */}
                                            <motion.button
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={handleViewAllResults}
                                                className="w-full py-3 px-6 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            >
                                                {tc('viewAllResults')}
                                            </motion.button>
                                        </>
                                    ) : (
                                        <div className="text-center py-12 backdrop-blur-sm rounded-xl border border-white/[0.06]" style={{ background: GRADIENTS.search }}>
                                            <Search aria-hidden="true" className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-500">{t('noResultsFound')}</p>
                                            <p className="text-gray-600 text-sm mt-2">
                                                {t('tryOtherTerm')}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    // Usa createPortal para renderizar o modal diretamente no body
    // Isso garante que o modal fique fora do stacking context da Navbar
    return createPortal(modalContent, document.body);
}

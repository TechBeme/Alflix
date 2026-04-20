'use client';

import { Film, Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export type MediaType = 'all' | 'movie' | 'tv';

interface MediaTypeFilterProps {
    activeFilter: MediaType;
    onChange: (filter: MediaType) => void;
    className?: string;
}

/**
 * MediaTypeFilter - Componente de filtro de tipo de mídia reutilizável
 * 
 * Design: Tabs com underline animado (inspirado em YouTube/Twitter)
 * Features:
 * - Animação suave da linha vermelha entre tabs (layoutId)
 * - Optimistic UI - responde instantaneamente ao clique
 * - Responsivo e acessível
 * 
 * @param activeFilter - Filtro ativo atual ('all' | 'movie' | 'tv')
 * @param onChange - Callback chamado ao mudar filtro
 * @param className - Classes CSS adicionais (opcional)
 */
export default function MediaTypeFilter({
    activeFilter,
    onChange,
    className = '',
}: MediaTypeFilterProps) {
    const t = useTranslations('filter');
    const tc = useTranslations('common');

    return (
        <div className={`border-b border-white/[0.06] ${className}`}>
            <div className="flex gap-1" role="tablist">
                <button
                    onClick={() => onChange('all')}
                    className={`relative px-6 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeFilter === 'all'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    aria-label={t('viewAll')}
                    role="tab"
                    aria-selected={activeFilter === 'all'}
                >
                    {t('all')}
                    {activeFilter === 'all' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
                <button
                    onClick={() => onChange('movie')}
                    className={`relative flex items-center gap-2 px-6 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeFilter === 'movie'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    aria-label={t('viewMovies')}
                    role="tab"
                    aria-selected={activeFilter === 'movie'}
                >
                    <Film className="w-4 h-4" aria-hidden="true" />
                    <span>{tc('movies')}</span>
                    {activeFilter === 'movie' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
                <button
                    onClick={() => onChange('tv')}
                    className={`relative flex items-center gap-2 px-6 py-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeFilter === 'tv'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                    aria-label={t('viewShows')}
                    role="tab"
                    aria-selected={activeFilter === 'tv'}
                >
                    <Tv className="w-4 h-4" aria-hidden="true" />
                    <span>{tc('tvShows')}</span>
                    {activeFilter === 'tv' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            </div>
        </div>
    );
}

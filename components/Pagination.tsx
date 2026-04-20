'use client';

import { motion } from 'framer-motion';
import { GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className = '',
}: PaginationProps) {
    const t = useTranslations('pagination');
    const tA11y = useTranslations('a11y');

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Mostrar todas as páginas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (currentPage <= 3) {
            // Início
            for (let i = 1; i <= maxVisible; i++) {
                pages.push(i);
            }
        } else if (currentPage >= totalPages - 2) {
            // Fim
            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Meio
            for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <motion.nav
            aria-label={tA11y('pagination')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex justify-center items-center gap-2 ${className}`}
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-white/[0.06] hover:border-primary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/[0.06] shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: GRADIENTS.pagination }}
            >
                {t('previous')}
            </button>

            <div className="flex gap-2">
                {pageNumbers.map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        aria-label={tA11y('goToPage', { page: pageNum })}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                        className={`w-10 h-10 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${currentPage === pageNum
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-gray-400 hover:text-white border border-white/[0.06] hover:border-primary'
                            }`}
                        style={currentPage !== pageNum ? { background: GRADIENTS.pagination } : {}}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-white/[0.06] hover:border-primary rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/[0.06] shadow-lg shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: GRADIENTS.pagination }}
            >
                {t('next')}
            </button>
        </motion.nav>
    );
}

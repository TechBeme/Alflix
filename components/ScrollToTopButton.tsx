import { ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScrollToTopButtonProps {
  onClick: () => void;
}

/**
 * ScrollToTopButton - Botão flutuante para voltar ao topo
 * Usado com useScrollToTop hook
 */
export default function ScrollToTopButton({ onClick }: ScrollToTopButtonProps) {
  const tc = useTranslations('common');

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 p-3 md:p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-all hover:scale-110 z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label={tc('scrollToTop')}
    >
      <ArrowUp className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
    </button>
  );
}

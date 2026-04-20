import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar visibilidade e funcionalidade do botão "Scroll to Top"
 * 
 * @param threshold - Pixels de scroll antes de mostrar o botão (padrão: 500)
 * @returns [showButton, scrollToTop] - Estado e função
 */
export function useScrollToTop(threshold = 500) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [showButton, scrollToTop] as const;
}

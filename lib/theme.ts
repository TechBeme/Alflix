/**
 * Theme Constants
 * Centralized theme values for consistent styling across the application
 * 
 * Design Language: Premium dark theme inspired by Netflix/HBO
 * - Multi-layer gradients for depth
 * - Subtle glass-morphism on surfaces
 * - Red accent (#d0212a) for primary actions
 */

export const COLORS = {
    primary: '#d0212a',
    primaryHover: '#b01d24',
    primaryHover2: '#b01820', // Variante alternativa de hover
    primaryLight: '#ff4444',
    primaryDark: '#8b0000', // Vermelho escuro (dark red) - usado em gradientes de avatar
    danger: '#DC2626', // Vermelho para elementos de destaque (video player progress bar)

    background: {
        black: '#000000',
        darkest: '#060606', // Mais escuro que black (auth pages)
        darker3: '#080808', // Muito escuro (footers, alguns gradientes)
        darker2: '#0a0a0a', // Muito escuro
        darker: '#121212', // Escuro padrão
        dark0: '#101010', // Entre darker2 e darker
        dark1: '#0c0c0c', // Entre darker2 e dark
        dark2: '#0e0e0e', // Entre darker2 e darker
        dark3: '#111111', // Entre darker2 e darker
        dark4: '#141414', // Entre darker e card
        dark5: '#151515', // Entre dark4 e elevated
        elevated: '#161616', // Elevado
        elevated2: '#181818', // Mais elevado que elevated
        card: '#1a1a1a', // Card padrão
        card2: '#1c1c1c', // Card alternativo
        card3: '#1e1e1e', // Card alternativo mais claro
        muted: '#2a2a2a', // Muted
        gray: '#3a3a3a', // Cinza escuro (toggles desabilitados)
    },

    border: {
        default: '#2a2a2a',
        light: 'rgba(255, 255, 255, 0.06)',
        lighter: 'rgba(255, 255, 255, 0.08)',
        gray: '#2a2a2a',
        grayLight: 'rgba(128, 128, 128, 0.3)',
        hover: '#d0212a',
        subtle: 'rgba(255, 255, 255, 0.04)',
    },

    text: {
        white: '#ffffff',
        gray: '#9ca3af',
        gray200: '#e5e7eb', // Cinza claro (Tailwind gray-200) - usado em gradientes de texto
        gray300: '#d1d5db', // Cinza médio (Tailwind gray-300) - usado em gradientes de texto
        grayLight: '#e0e0e0', // Cinza claro para textos em gradientes
        grayDark: '#6b7280',
        muted: 'rgba(255, 255, 255, 0.7)',
        subtle: 'rgba(255, 255, 255, 0.4)',
    },
} as const;

export const GRADIENTS = {
    primary: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryLight})`,
    primaryText: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primary})`,
    whiteToGray: `linear-gradient(to right, ${COLORS.text.white}, ${COLORS.text.gray200}, ${COLORS.text.gray300})`,
    whiteToGrayAlt: `linear-gradient(to right, ${COLORS.text.white}, ${COLORS.text.grayLight})`,
    backgroundSubtle: `linear-gradient(to bottom right, rgba(139, 0, 0, 0.05), rgba(90, 0, 0, 0.03), ${COLORS.background.black})`,
    radialRed: 'radial-gradient(circle at 20% 50%, rgba(139, 0, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(90, 0, 0, 0.05) 0%, transparent 50%)',
    heroOverlay: `linear-gradient(to top, ${COLORS.background.black}, rgba(0, 0, 0, 0.5), transparent)`,
    /** Gradiente de superfície para cards e painéis */
    surface: `linear-gradient(to bottom, ${COLORS.background.elevated}, ${COLORS.background.darker}, ${COLORS.background.dark2})`,
    /** Gradiente padrão para páginas de conteúdo (profile, movies, tv, media, search, etc.) */
    pageContent: `linear-gradient(to bottom, ${COLORS.background.darker}, ${COLORS.background.darker2}, ${COLORS.background.darker3})`,
    /** Gradiente para páginas de login/auth (mais escuro) */
    pageAuth: `linear-gradient(to bottom, ${COLORS.background.darker2}, ${COLORS.background.darker3}, ${COLORS.background.darkest})`,
    /** Gradiente para a página watch (mais escuro, próximo ao preto) */
    pageWatch: `linear-gradient(to bottom, ${COLORS.background.darker2}, ${COLORS.background.darker3}, ${COLORS.background.black})`,
    /** Landing page wrapper */
    pageLanding: `linear-gradient(to bottom, ${COLORS.background.darker2}, ${COLORS.background.darker3})`,
    /** Seção da landing: Features (tom mais escuro) */
    sectionFeatures: `linear-gradient(to bottom, ${COLORS.background.dark1}, ${COLORS.background.darker3}, ${COLORS.background.dark1})`,
    /** Seção da landing: Pricing (tom claro — definido no componente PricingSection) */
    sectionPricing: `linear-gradient(to bottom, ${COLORS.background.dark4}, ${COLORS.background.darker}, ${COLORS.background.dark2})`,
    /** Seção da landing: FAQ (tom intermediário, distinto de Features) */
    sectionFAQ: `linear-gradient(to bottom, ${COLORS.background.elevated2}, ${COLORS.background.dark4}, ${COLORS.background.dark2})`,
    /** Seção da landing: CTA (tom mais claro) */
    sectionCTA: `linear-gradient(to bottom, ${COLORS.background.dark3}, ${COLORS.background.dark2}, ${COLORS.background.dark3})`,
    /** Seções de conteúdo em páginas institucionais (terms, privacy, etc.) */
    sectionInstitutional: `linear-gradient(to bottom, ${COLORS.background.dark2}, ${COLORS.background.darker2}, ${COLORS.background.dark2})`,
    /** Gradientes de formulários e inputs */
    input: `linear-gradient(to bottom, ${COLORS.background.dark2}, ${COLORS.background.darker2})`,
    inputAlt: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.elevated})`,
    /** Gradientes de dropdowns e menus */
    dropdown: `linear-gradient(to bottom, ${COLORS.background.card3}, ${COLORS.background.elevated2})`,
    dropdownAlt: `linear-gradient(to bottom, ${COLORS.background.card3}, ${COLORS.background.elevated}, ${COLORS.background.darker})`,
    dropdownItem: `linear-gradient(to bottom, ${COLORS.background.card2}, ${COLORS.background.dark4})`,
    dropdownItemAlt: `linear-gradient(to bottom, ${COLORS.background.elevated2}, ${COLORS.background.dark3})`,
    /** Gradiente de paginação */
    pagination: `linear-gradient(to bottom, ${COLORS.background.dark4}, ${COLORS.background.dark2})`,
    /** Gradiente para cards de cast */
    cast: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.dark4})`,
    castAlt: `linear-gradient(to bottom, ${COLORS.background.card3}, ${COLORS.background.elevated2})`,
    /** Gradiente para trailer section */
    trailer: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.dark4})`,
    trailerModal: `linear-gradient(to bottom, ${COLORS.background.elevated}, ${COLORS.background.dark2})`,
    /** Gradiente de footer */
    footer: `linear-gradient(to bottom, ${COLORS.background.dark2}, ${COLORS.background.darker2}, ${COLORS.background.darker3})`,
    /** Divider premium */
    divider: `linear-gradient(to right, transparent, ${COLORS.border.light}, transparent)`,
    dividerAlt: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.15), transparent)',
    /** Gradientes de modais */
    modal: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.elevated})`,
    modalAlt: `linear-gradient(to bottom, ${COLORS.background.elevated}, ${COLORS.background.darker})`,
    /** Gradientes de search */
    search: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.dark4})`,
    /** Gradientes de video player */
    player: `linear-gradient(to bottom, ${COLORS.background.darker2}, ${COLORS.background.darker3}, ${COLORS.background.black})`,
    playerControls: `linear-gradient(to bottom, ${COLORS.background.card3}, ${COLORS.background.elevated}, ${COLORS.background.darker})`,
    playerControlsAlt: `linear-gradient(to bottom, ${COLORS.background.elevated}, ${COLORS.background.darker})`,
    /** Gradientes de navbar */
    navbarDropdown: `linear-gradient(to bottom, ${COLORS.background.card}, ${COLORS.background.dark4}, ${COLORS.background.dark0})`,
    /** Gradientes de avatar */
    avatar: `linear-gradient(to bottom right, ${COLORS.primary}, ${COLORS.primaryDark})`,
    /** Gradientes de filter bar */
    filterButton: `linear-gradient(to bottom, ${COLORS.background.dark4}, ${COLORS.background.dark2})`,
    filterDropdownItem: `linear-gradient(to bottom, ${COLORS.background.card2}, ${COLORS.background.dark4})`,
    filterDropdownItemAlt: `linear-gradient(to bottom, ${COLORS.background.elevated2}, ${COLORS.background.dark3})`,
} as const;

export const SPACING = {
    section: {
        py: 'py-20 md:py-32',
        px: 'px-4 md:px-8',
    },
    container: {
        maxWidth: 'max-w-7xl',
        maxWidthNarrow: 'max-w-4xl',
        maxWidthWide: 'max-w-5xl',
    },
} as const;

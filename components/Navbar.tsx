'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Menu, X, User, LogOut, CreditCard, Bell, Home, Tv, Film, List, HelpCircle, ChevronRight, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import SearchModal from './SearchModal';
import UserAvatar from './UserAvatar';
import LanguageSwitcher from './LanguageSwitcher';
import type { Session } from '@/lib/auth-client';
import { usePrefetch } from '@/hooks/usePrefetch';
import { SITE_NAME, SITE_NAME_SUFFIX, SITE_NAME_FULL } from '@/lib/config';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

interface NavbarProps {
    initialSession?: Session | null;
}

/**
 * Navbar Component
 * 
 * Usa useSession() do Better Auth com fallback SSR para zero flash + cross-tab sync.
 * 
 * Fluxo híbrido SSR + Client:
 * 1. Server Component (NavbarWrapper) busca sessão via auth.api.getSession()
 * 2. Navbar recebe initialSession como prop (zero flash durante hidratação)
 * 3. useSession() assume com initialCache após hidratação
 * 4. Better Auth mantém sincronizado via cache + cross-tab sync automático
 * 
 * Benefícios:
 * - Zero flash de conteúdo não autenticado (SSR)
 * - Cross-tab sync automático (mudanças propagam para todas as abas)
 * - Cache compartilhado (Nanostores do Better Auth)
 * - Deduplicação de requests
 * - Atualização reativa quando sessão muda
 * 
 * @param initialSession - Sessão do servidor (SSR) - usado como fallback inicial
 */
export default function Navbar({ initialSession }: NavbarProps) {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const userMenuButtonRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const menuPanelRef = useRef<HTMLDivElement>(null);

    // Hook nativo do Better Auth com fallback SSR
    // - Primeiro render: usa initialSession (SSR, zero flash)
    // - Após hidratação: hook assume e mantém sincronizado
    // - Cross-tab sync: mudanças propagam automaticamente
    const { data: session } = authClient.useSession();

    // Usa session do hook (ou initialSession durante hidratação)
    const user = session?.user || initialSession?.user || null;

    // Helper: verificar rota ativa
    const isActiveRoute = useCallback((href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    }, [pathname]);

    // Helper: verificar seção específica de settings ativa
    const isActiveSettingsSection = useCallback((section: string) => {
        if (pathname !== '/settings') return false;
        const currentSection = searchParams.get('section') || 'account';
        return currentSection === section;
    }, [pathname, searchParams]);

    // Prefetch para links principais (delay de 200ms - responsividade rápida)
    const homePrefetch = usePrefetch('/', 200);
    const tvPrefetch = usePrefetch('/tv', 200);
    const moviesPrefetch = usePrefetch('/movies', 200);
    const settingsPrefetch = usePrefetch('/settings', 200);
    const loginPrefetch = usePrefetch('/login', 200);


    /**
     * Faz logout usando o authClient diretamente
     * Após logout, força redirecionamento para limpar estado do servidor
     */
    const handleLogout = useCallback(async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // Força reload completo para limpar estado SSR
                        window.location.href = '/';
                    },
                },
            });
        } catch (error) {
            console.error(tc('errorLoggingOut'), error);
        }
    }, []);

    const handleSubscribeClick = () => {
        // Se estiver na landing page, fazer scroll para a seção de preços
        if (pathname === '/') {
            document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Se não, redirecionar para a landing page
            router.push('/#pricing');
        }
    };

    // Necessário para portais funcionarem com SSR
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fechar todos os menus ao mudar de rota
    useEffect(() => {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
    }, [pathname]);

    // Calcular posição do dropdown dinamicamente (scroll/resize)
    const updateDropdownPosition = useCallback(() => {
        if (!userMenuButtonRef.current) return;
        const rect = userMenuButtonRef.current.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        });
    }, []);

    useEffect(() => {
        if (!isUserMenuOpen) {
            setDropdownPos(null);
            return;
        }
        updateDropdownPosition();
        window.addEventListener('scroll', updateDropdownPosition, true);
        window.addEventListener('resize', updateDropdownPosition);
        return () => {
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isUserMenuOpen, updateDropdownPosition]);

    // Fechar dropdown ao clicar fora (considera tanto o botão quanto o portal)
    useEffect(() => {
        if (!isUserMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const isInsideTrigger = userMenuButtonRef.current?.contains(target);
            const isInsideDropdown = dropdownRef.current?.contains(target);
            if (!isInsideTrigger && !isInsideDropdown) {
                setIsUserMenuOpen(false);
            }
        };
        // Use timeout para não capturar o click que abriu o menu
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    // Fechar menus ao pressionar Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isUserMenuOpen) setIsUserMenuOpen(false);
                if (isMenuOpen) setIsMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isUserMenuOpen, isMenuOpen]);

    // Bloquear scroll quando menu mobile está aberto
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    return (
        <>
            <nav className="fixed top-0 w-full z-[100] bg-black/80 backdrop-blur-md border-b border-white/5 max-w-full overflow-x-clip overflow-y-visible">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo - Esquerda */}
                        <div className="flex items-center flex-shrink-0 min-w-0">
                            <Link href="/" prefetch={false} className="flex items-center cursor-pointer gap-1 sm:gap-2">
                                <Image
                                    src="/logo.png"
                                    alt={tA11y('logoAlt', { siteName: SITE_NAME_FULL })}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                                />
                                <div className="flex items-center">
                                    <span style={{ color: COLORS.primary }} className="text-xl sm:text-2xl md:text-3xl font-bold">{SITE_NAME}</span>
                                    {SITE_NAME_SUFFIX && (
                                        <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{SITE_NAME_SUFFIX}</span>
                                    )}
                                </div>
                            </Link>
                        </div>

                        {/* Desktop Navigation - Centro (Apenas para usuários autenticados) */}
                        {user && (
                            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
                                <Link
                                    href="/"
                                    prefetch={false}
                                    onMouseEnter={homePrefetch.handleMouseEnter}
                                    onMouseLeave={homePrefetch.handleMouseLeave}
                                    className="text-sm font-medium text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    {t('home')}
                                </Link>
                                <Link
                                    href="/tv"
                                    prefetch={false}
                                    onMouseEnter={tvPrefetch.handleMouseEnter}
                                    onMouseLeave={tvPrefetch.handleMouseLeave}
                                    className="text-sm font-medium text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    {t('tvShows')}
                                </Link>
                                <Link
                                    href="/movies"
                                    prefetch={false}
                                    onMouseEnter={moviesPrefetch.handleMouseEnter}
                                    onMouseLeave={moviesPrefetch.handleMouseLeave}
                                    className="text-sm font-medium text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    {t('movies')}
                                </Link>
                                <Link
                                    href="/my-list"
                                    prefetch={false}
                                    className="text-sm font-medium text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    {t('myList')}
                                </Link>
                            </div>
                        )}

                        {/* Right Side - Direita */}
                        <div className="flex items-center gap-6">
                            {user ? (
                                // Usuário Autenticado: Lupa, Notificações, Perfil
                                <div className="hidden md:flex items-center gap-3">
                                    <button
                                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label={t('search')}
                                    >
                                        <Search className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                    <LanguageSwitcher variant="icon" user={user} />
                                    <Link
                                        href="/settings?section=notifications"
                                        prefetch={false}
                                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label={t('notifications')}
                                    >
                                        <Bell className="w-5 h-5" aria-hidden="true" />
                                    </Link>
                                    <div
                                        ref={userMenuButtonRef}
                                        className="relative flex items-center gap-2 cursor-pointer group"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        tabIndex={0}
                                        role="button"
                                        aria-haspopup="menu"
                                        aria-expanded={isUserMenuOpen}
                                        aria-label={t('userMenu')}
                                    >
                                        <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <UserAvatar icon={(user as any)?.avatarIcon || 'user'} color={(user as any)?.avatarColor || 'red'} size="sm" shape="rounded" />
                                        </div>
                                        <svg aria-hidden="true" className={`w-3 h-3 text-white transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                // Usuário NÃO Autenticado: Botões Entrar e Assinar
                                <div className="hidden md:flex items-center gap-4">
                                    <LanguageSwitcher variant="icon" user={user} />
                                    <Link
                                        href="/login"
                                        prefetch={false}
                                        onMouseEnter={loginPrefetch.handleMouseEnter}
                                        onMouseLeave={loginPrefetch.handleMouseLeave}
                                    >
                                        <Button
                                            variant="outline"
                                            className="border-white/20 text-white hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            {t('login')}
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={handleSubscribeClick}
                                        className="bg-primary text-white hover:bg-primary-hover transition-colors"
                                    >
                                        {t('subscribe')}
                                    </Button>
                                </div>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden text-white hover:text-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={isMenuOpen ? t('closeMenu') : t('openMenu')}
                                aria-expanded={isMenuOpen}
                                aria-haspopup="dialog"
                            >
                                {isMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Modal */}
                {user && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
            </nav>

            {/* User Profile Dropdown - renderizado via portal fora da nav */}
            {mounted && isUserMenuOpen && dropdownPos && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed w-56 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden border border-white/[0.08] animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{
                        zIndex: 99997,
                        top: dropdownPos.top,
                        right: dropdownPos.right,
                        background: GRADIENTS.navbarDropdown,
                    }}
                    role="menu"
                    aria-orientation="vertical"
                    aria-label={t('userMenu')}
                >
                    {/* User info header */}
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <UserAvatar icon={(user as any)?.avatarIcon || 'user'} color={(user as any)?.avatarColor || 'red'} size="md" shape="rounded" ring />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{user?.name || t('profile')}</p>
                                <p className="text-white/40 text-xs truncate">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5 px-2">
                        <Link
                            href="/settings"
                            prefetch={false}
                            onMouseEnter={settingsPrefetch.handleMouseEnter}
                            onMouseLeave={settingsPrefetch.handleMouseLeave}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.06] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                        >
                            <User className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" aria-hidden="true" />
                            <span className="text-sm font-medium">{t('profile')}</span>
                        </Link>
                        <Link
                            href="/settings?section=preferences"
                            prefetch={false}
                            onMouseEnter={settingsPrefetch.handleMouseEnter}
                            onMouseLeave={settingsPrefetch.handleMouseLeave}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.06] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                        >
                            <Settings className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" aria-hidden="true" />
                            <span className="text-sm font-medium">{t('settings')}</span>
                        </Link>
                        <Link
                            href="/settings?section=notifications"
                            prefetch={false}
                            onMouseEnter={settingsPrefetch.handleMouseEnter}
                            onMouseLeave={settingsPrefetch.handleMouseLeave}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.06] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                        >
                            <Bell className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" aria-hidden="true" />
                            <span className="text-sm font-medium">{t('notifications')}</span>
                        </Link>
                        <Link
                            href="/settings?section=plan"
                            prefetch={false}
                            onMouseEnter={settingsPrefetch.handleMouseEnter}
                            onMouseLeave={settingsPrefetch.handleMouseLeave}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.06] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            onClick={() => setIsUserMenuOpen(false)}
                            role="menuitem"
                        >
                            <CreditCard className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" aria-hidden="true" />
                            <span className="text-sm font-medium">{t('plans')}</span>
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    {/* Logout */}
                    <div className="py-1.5 px-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.06] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            role="menuitem"
                        >
                            <LogOut className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" aria-hidden="true" />
                            <span className="text-sm font-medium">{t('logout')}</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Mobile Menu - Sempre montado, controlado por CSS transitions */}
            {mounted && createPortal(
                <>
                    {/* Overlay */}
                    <div
                        className={`fixed inset-0 bg-black/70 backdrop-blur-sm md:hidden mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}
                        style={{ zIndex: 99990 }}
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Painel lateral */}
                    <div
                        ref={menuPanelRef}
                        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-[380px] md:hidden mobile-menu-panel ${isMenuOpen ? 'open' : ''}`}
                        style={{ zIndex: 99991 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('navigationMenu')}
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
                        }}
                        onTouchMove={(e) => {
                            if (!touchStartRef.current || !menuPanelRef.current) return;
                            const touch = e.touches[0];
                            const deltaX = touch.clientX - touchStartRef.current.x;
                            const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
                            // Só arrastar se o gesto for mais horizontal que vertical
                            if (deltaX > 0 && deltaX > deltaY) {
                                e.preventDefault();
                                menuPanelRef.current.style.transition = 'none';
                                menuPanelRef.current.style.transform = `translateX(${deltaX}px)`;
                            }
                        }}
                        onTouchEnd={(e) => {
                            if (!touchStartRef.current || !menuPanelRef.current) return;
                            const touch = e.changedTouches[0];
                            const deltaX = touch.clientX - touchStartRef.current.x;
                            const elapsed = Date.now() - touchStartRef.current.time;
                            const velocity = deltaX / elapsed;
                            // Fechar se arrastou >30% da largura OU se o swipe foi rápido (>0.5px/ms)
                            menuPanelRef.current.style.transition = '';
                            menuPanelRef.current.style.transform = '';
                            if (deltaX > 100 || velocity > 0.5) {
                                setIsMenuOpen(false);
                            }
                            touchStartRef.current = null;
                        }}
                    >
                        {/* Background com gradiente sutil */}
                        <div className="absolute inset-0 bg-gradient-to-b from-bg-darker to-bg-darker2 to-bg-darker3" />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary/[0.02]" />

                        {/* Borda esquerda com glow sutil */}
                        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                        {/* Conteúdo relativo ao background */}
                        <div className="relative h-full flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3 menu-item" style={{ animationDelay: '0ms' }}>
                                    <Image
                                        src="/logo.png"
                                        alt={SITE_NAME_FULL}
                                        width={28}
                                        height={28}
                                        className="w-7 h-7"
                                    />
                                    <span className="text-lg font-bold tracking-tight">
                                        <span style={{ color: '#d0212a' }}>{SITE_NAME}</span>
                                        {SITE_NAME_SUFFIX && <span className="text-white">{SITE_NAME_SUFFIX}</span>}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/10 transition-colors menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    style={{ animationDelay: '50ms' }}
                                    aria-label={t('closeMenu')}
                                >
                                    <X className="w-4 h-4 text-white/80" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Scroll área */}
                            <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
                                {user ? (
                                    <>
                                        {/* Perfil do Usuário */}
                                        <div className="px-6 py-5 menu-item" style={{ animationDelay: '80ms' }}>
                                            <Link
                                                href="/settings"
                                                prefetch={false}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                                            >
                                                <div className="w-11 h-11 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                    <UserAvatar icon={(user as any)?.avatarIcon || 'user'} color={(user as any)?.avatarColor || 'red'} size="md" shape="rounded" ring className="w-11 h-11" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-[15px] truncate">{user?.name || t('profile')}</p>
                                                    <p className="text-white/40 text-xs truncate">{user.email}</p>
                                                </div>
                                                <ChevronRight aria-hidden="true" className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                            </Link>
                                        </div>

                                        {/* Divider */}
                                        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                                        {/* Navegação */}
                                        <div className="px-6 py-4">
                                            <p className="text-white/30 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 px-3">
                                                {t('navigation')}
                                            </p>
                                            <nav className="space-y-0.5">
                                                {[
                                                    { href: '/', icon: Home, label: t('home'), delay: 120 },
                                                    { href: '/tv', icon: Tv, label: t('tvShows'), delay: 150 },
                                                    { href: '/movies', icon: Film, label: t('movies'), delay: 180 },
                                                    { href: '/my-list', icon: List, label: t('myList'), delay: 210 },
                                                ].map(({ href, icon: Icon, label, delay }) => {
                                                    const active = isActiveRoute(href);
                                                    return (
                                                        <Link
                                                            key={href}
                                                            href={href}
                                                            prefetch={false}
                                                            onClick={() => setIsMenuOpen(false)}
                                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active
                                                                ? 'bg-white/[0.08] text-white'
                                                                : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                                                                }`}
                                                            style={{ animationDelay: `${delay}ms` }}
                                                        >
                                                            <Icon aria-hidden="true" className={`w-[18px] h-[18px] transition-colors ${active ? 'text-primary' : 'text-white/40 group-hover:text-primary'
                                                                }`} />
                                                            <span className="font-medium text-[15px]">{label}</span>
                                                            {active && (
                                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                        </Link>
                                                    );
                                                })}
                                                <button
                                                    onClick={() => {
                                                        setIsSearchOpen(true);
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/[0.04] hover:text-white transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                    style={{ animationDelay: '240ms' }}
                                                >
                                                    <Search aria-hidden="true" className="w-[18px] h-[18px] text-white/40 group-hover:text-primary transition-colors" />
                                                    <span className="font-medium text-[15px]">{t('search')}</span>
                                                </button>
                                            </nav>
                                        </div>

                                        {/* Divider */}
                                        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                                        {/* Conta */}
                                        <div className="px-6 py-4">
                                            <p className="text-white/30 text-[11px] font-semibold uppercase tracking-[0.15em] mb-2 px-3">
                                                {t('account')}
                                            </p>
                                            <nav className="space-y-0.5">
                                                <Link
                                                    href="/settings?section=preferences"
                                                    prefetch={false}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActiveSettingsSection('preferences')
                                                        ? 'bg-white/[0.08] text-white'
                                                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                                                        }`}
                                                    style={{ animationDelay: '270ms' }}
                                                >
                                                    <Settings aria-hidden="true" className={`w-[18px] h-[18px] transition-colors ${isActiveSettingsSection('preferences') ? 'text-primary' : 'text-white/40 group-hover:text-primary'
                                                        }`} />
                                                    <span className="font-medium text-[15px]">{t('settings')}</span>
                                                    {isActiveSettingsSection('preferences') && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                    )}
                                                </Link>
                                                <Link
                                                    href="/settings?section=notifications"
                                                    prefetch={false}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActiveSettingsSection('notifications')
                                                        ? 'bg-white/[0.08] text-white'
                                                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                                                        }`}
                                                    style={{ animationDelay: '300ms' }}
                                                >
                                                    <Bell aria-hidden="true" className={`w-[18px] h-[18px] transition-colors ${isActiveSettingsSection('notifications') ? 'text-primary' : 'text-white/40 group-hover:text-primary'
                                                        }`} />
                                                    <span className="font-medium text-[15px]">{t('notifications')}</span>
                                                    {isActiveSettingsSection('notifications') && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                    )}
                                                </Link>
                                                <Link
                                                    href="/settings?section=plan"
                                                    prefetch={false}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActiveSettingsSection('plan')
                                                        ? 'bg-white/[0.08] text-white'
                                                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                                                        }`}
                                                    style={{ animationDelay: '330ms' }}
                                                >
                                                    <CreditCard aria-hidden="true" className={`w-[18px] h-[18px] transition-colors ${isActiveSettingsSection('plan') ? 'text-primary' : 'text-white/40 group-hover:text-primary'
                                                        }`} />
                                                    <span className="font-medium text-[15px]">{t('plansAndSubscription')}</span>
                                                    {isActiveSettingsSection('plan') && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                    )}
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/[0.04] hover:text-white transition-all group menu-item focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                    style={{ animationDelay: '360ms' }}
                                                >
                                                    <LogOut aria-hidden="true" className="w-[18px] h-[18px] text-white/40 group-hover:text-primary transition-colors" />
                                                    <span className="font-medium text-[15px]">{t('logout')}</span>
                                                </button>
                                            </nav>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Usuário não logado */}
                                        <div className="px-6 py-8">
                                            <div className="mb-8 menu-item" style={{ animationDelay: '100ms' }}>
                                                <h3 className="text-white text-xl font-bold mb-2 tracking-tight">
                                                    {t('welcome')} {SITE_NAME_FULL}
                                                </h3>
                                                <p className="text-white/40 text-sm leading-relaxed">
                                                    {t('loginPrompt')}
                                                </p>
                                            </div>

                                            <div className="space-y-3 menu-item" style={{ animationDelay: '160ms' }}>
                                                <Link
                                                    href="/login"
                                                    prefetch={false}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="block w-full"
                                                >
                                                    <Button
                                                        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                                                        size="lg"
                                                    >
                                                        {t('login')}
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-white/10 text-white hover:bg-white/[0.06] font-semibold py-6 rounded-xl transition-all"
                                                    size="lg"
                                                    onClick={() => {
                                                        handleSubscribeClick();
                                                        setIsMenuOpen(false);
                                                    }}
                                                >
                                                    {t('viewPlans')}
                                                </Button>
                                            </div>

                                            {/* Divider */}
                                            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                                            <nav className="space-y-0.5 menu-item" style={{ animationDelay: '220ms' }}>
                                                <Link
                                                    href="/about"
                                                    prefetch={false}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:bg-white/[0.04] hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <HelpCircle aria-hidden="true" className="w-[18px] h-[18px] text-white/40 group-hover:text-primary transition-colors" />
                                                    <span className="font-medium text-[15px]">{t('about')}</span>
                                                </Link>
                                            </nav>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer sutil */}
                            <div className="px-6 py-4 border-t border-white/[0.04] menu-item" style={{ animationDelay: '330ms' }}>
                                <div className="mb-3">
                                    <LanguageSwitcher variant="menu" user={user} />
                                </div>
                                <p className="text-white/20 text-[11px] text-center">
                                    © {new Date().getFullYear()} {SITE_NAME_FULL}
                                </p>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}

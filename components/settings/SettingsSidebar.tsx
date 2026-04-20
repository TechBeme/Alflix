'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User, CreditCard, Users, Sliders, Bell, History } from 'lucide-react';
import { COLORS, GRADIENTS } from '@/lib/theme';
import type { SettingsSection } from '@/app/settings/SettingsPageClient';

interface SettingsSidebarProps {
    activeSection: SettingsSection;
    onSectionChange: (section: SettingsSection) => void;
    maxScreens: number;
}

interface SidebarItem {
    id: SettingsSection;
    label: string;
    icon: React.ElementType;
    description: string;
}

/**
 * SettingsSidebar - Navegação lateral para desktop / tabs horizontais para mobile
 * 
 * @example
 * <SettingsSidebar
 *   activeSection="account"
 *   onSectionChange={setActiveSection}
 *   maxScreens={4}
 * />
 */
export default function SettingsSidebar({
    activeSection,
    onSectionChange,
    maxScreens,
}: SettingsSidebarProps) {
    const router = useRouter();
    const t = useTranslations('settingsPage');

    const items: SidebarItem[] = [
        { id: 'account', label: t('account'), icon: User, description: t('accountDesc') },
        { id: 'plan', label: t('subscription'), icon: CreditCard, description: t('subscriptionDesc') },
        ...(maxScreens >= 2 ? [{
            id: 'family' as SettingsSection,
            label: t('family'),
            icon: Users,
            description: t('familyDesc'),
        }] : []),
        { id: 'preferences', label: t('preferences'), icon: Sliders, description: t('preferencesDesc') },
        { id: 'notifications', label: t('notificationsLabel'), icon: Bell, description: t('notificationsDesc') },
        { id: 'history', label: t('history'), icon: History, description: t('historyDesc') },
    ];

    const handleSectionChange = (section: SettingsSection) => {
        // Atualiza o estado local via callback
        onSectionChange(section);
        // Atualiza a URL para manter sincronização
        if (section === 'account') {
            router.push('/settings');
        } else {
            router.push(`/settings?section=${section}`);
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <nav
                className="hidden lg:block w-72 shrink-0 rounded-xl border border-white/[0.06] p-3 h-fit sticky top-28"
                style={{ background: GRADIENTS.surface }}
            >
                <ul className="space-y-1">
                    {items.map((item) => {
                        const isActive = activeSection === item.id;
                        const Icon = item.icon;

                        return (
                            <li key={item.id}>
                                <button
                                    onClick={() => handleSectionChange(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive
                                        ? 'bg-white/[0.08] text-white'
                                        : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                                        }`}
                                >
                                    {/* Active indicator */}
                                    <div className={`w-0.5 h-8 rounded-full transition-all ${isActive ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: COLORS.primary }} />
                                    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-white/40 group-hover:text-primary'}`} aria-hidden="true" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{item.label}</p>
                                        <p className="text-xs text-white/30 truncate">{item.description}</p>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Mobile Tabs (horizontal scroll) */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 pb-2 min-w-max">
                    {items.map((item) => {
                        const isActive = activeSection === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleSectionChange(item.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive
                                    ? 'text-white border-primary bg-primary/10'
                                    : 'text-white/60 border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-white/40'}`} aria-hidden="true" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

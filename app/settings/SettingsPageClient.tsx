'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import { GRADIENTS } from '@/lib/theme';
import type { Session } from '@/lib/auth-client';
import type { SessionData, UserPreferencesData } from '@/types/settings';

// Dynamic imports: Cada seção tem 300-600+ linhas e só uma é visível por vez
const AccountSection = dynamic(() => import('@/components/settings/AccountSection'));
const PlanSection = dynamic(() => import('@/components/settings/PlanSection'));
const FamilySection = dynamic(() => import('@/components/settings/FamilySection'));
const PreferencesSection = dynamic(() => import('@/components/settings/PreferencesSection'));
const NotificationsSection = dynamic(() => import('@/components/settings/NotificationsSection'));
const HistorySection = dynamic(() => import('@/components/settings/HistorySection'));

// Re-export types for child components
export type { SessionData, UserPreferencesData } from '@/types/settings';

export type SettingsSection = 'account' | 'plan' | 'family' | 'preferences' | 'notifications' | 'history';

export interface PlanData {
    id: string;
    name: string;
    screens: number;
    priceMonthly: number;
    priceYearly: number;
    active: boolean;
}

export interface FamilyMemberData {
    id: string;
    userId: string;
    joinedAt: string | Date;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatarIcon: string;
        avatarColor: string;
    };
}

export interface FamilyInviteData {
    id: string;
    token: string;
    email: string | null;
    status: string;
    expiresAt: string | Date;
    createdAt: string | Date;
}

export interface FamilyData {
    id: string;
    ownerId: string;
    name: string;
    maxMembers: number;
    members: FamilyMemberData[];
    invites: FamilyInviteData[];
}

export interface FamilyMembershipData {
    id: string;
    familyId: string;
    family: {
        id: string;
        ownerId: string;
        name: string;
        owner: {
            id: string;
            name: string | null;
            email: string;
            avatarIcon: string;
            avatarColor: string;
        };
    };
}

interface SettingsPageClientProps {
    initialSession: Session | null;
    initialPreferences: UserPreferencesData;
    userPlan: PlanData | null;
    trialEndsAt: string | null;
    family: FamilyData | null;
    familyMembership: FamilyMembershipData | null;
    maxScreens: number;
    initialSessions: Array<Omit<SessionData, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date }>;
}

export default function SettingsPageClient({
    initialSession,
    initialPreferences,
    userPlan,
    trialEndsAt,
    family,
    familyMembership,
    maxScreens,
    initialSessions,
}: SettingsPageClientProps) {
    const searchParams = useSearchParams();
    const validSections: SettingsSection[] = ['account', 'plan', 'family', 'preferences', 'notifications', 'history'];
    const initialSection = validSections.includes(searchParams.get('section') as SettingsSection)
        ? (searchParams.get('section') as SettingsSection)
        : 'account';

    const t = useTranslations('settingsPage');
    const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
    const [preferences, setPreferences] = useState<UserPreferencesData>(initialPreferences);

    // Sincronizar activeSection com mudanças nos searchParams
    useEffect(() => {
        const section = searchParams.get('section') as SettingsSection;
        if (section && validSections.includes(section)) {
            setActiveSection(section);
        } else if (!section) {
            setActiveSection('account');
        }
    }, [searchParams]);

    const handlePreferencesUpdate = useCallback((updated: Partial<UserPreferencesData>) => {
        setPreferences(prev => ({ ...prev, ...updated }));
    }, []);

    const renderSection = () => {
        switch (activeSection) {
            case 'account':
                return (
                    <AccountSection
                        initialSession={initialSession}
                        initialSessions={initialSessions}
                    />
                );
            case 'plan':
                return (
                    <PlanSection
                        userPlan={userPlan}
                        trialEndsAt={trialEndsAt}
                        familyMembership={familyMembership}
                    />
                );
            case 'family':
                return (
                    <FamilySection
                        family={family}
                        familyMembership={familyMembership}
                        maxScreens={maxScreens}
                        userPlan={userPlan}
                        user={initialSession?.user ? {
                            avatarIcon: (initialSession.user as any).avatarIcon,
                            avatarColor: (initialSession.user as any).avatarColor,
                        } : null}
                    />
                );
            case 'preferences':
                return (
                    <PreferencesSection
                        preferences={preferences}
                        onUpdate={handlePreferencesUpdate}
                    />
                );
            case 'notifications':
                return (
                    <NotificationsSection
                        preferences={preferences}
                        onUpdate={handlePreferencesUpdate}
                    />
                );
            case 'history':
                return <HistorySection />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen" style={{ background: GRADIENTS.pageContent }}>
            <Navbar initialSession={initialSession} />

            <div className="pt-24 pb-20 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">{t('title')}</h1>

                {/* Layout: Sidebar + Content */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <SettingsSidebar
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                        maxScreens={maxScreens}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {renderSection()}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

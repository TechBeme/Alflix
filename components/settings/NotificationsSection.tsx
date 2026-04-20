'use client';

import { useCallback, useRef } from 'react';
import { Mail, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { toast } from 'sonner';
import type { UserPreferencesData } from '@/app/settings/SettingsPageClient';

interface NotificationsSectionProps {
    preferences: UserPreferencesData;
    onUpdate: (updated: Partial<UserPreferencesData>) => void;
}

interface NotificationToggle {
    key: keyof UserPreferencesData;
    label: string;
    description: string;
}

const EMAIL_TOGGLES: NotificationToggle[] = [
    { key: 'emailNewReleases', label: 'newReleases', description: 'newReleasesEmail' },
    { key: 'emailRecommendations', label: 'recommendations', description: 'recommendationsEmail' },
    { key: 'emailAccountAlerts', label: 'accountAlerts', description: 'accountAlertsDesc' },
    { key: 'emailMarketing', label: 'marketing', description: 'marketingDesc' },
];

const PUSH_TOGGLES: NotificationToggle[] = [
    { key: 'pushNewReleases', label: 'newReleases', description: 'newReleasesPush' },
    { key: 'pushRecommendations', label: 'recommendations', description: 'recommendationsPush' },
    { key: 'pushAccountAlerts', label: 'accountAlerts', description: 'accountAlertsPush' },
];

/**
 * NotificationsSection - Seção de Notificações (email + push)
 * 
 * Gerencia preferências de notificação por email e push.
 */
export default function NotificationsSection({ preferences, onUpdate }: NotificationsSectionProps) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const t = useTranslations('settingsNotifications');

    const saveNotification = useCallback(async (updates: Partial<UserPreferencesData>, previousValues: Partial<UserPreferencesData>) => {
        try {
            const response = await fetch('/api/settings/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || t('saveError'));
            }
            // Status 204 = sucesso silencioso, sem retorno de dados
        } catch (error) {
            // Reverte a mudança em caso de erro
            onUpdate(previousValues);
            toast.error(error instanceof Error ? error.message : t('saveNotifError'));
        }
    }, [onUpdate]);

    const togglePref = useCallback((key: keyof UserPreferencesData) => {
        const currentValue = preferences[key] as boolean;
        const newValue = !currentValue;

        // Atualiza localmente via onUpdate imediatamente para UI responsiva
        onUpdate({ [key]: newValue } as Partial<UserPreferencesData>);

        // Debounce para salvar no servidor
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveNotification(
                { [key]: newValue } as Partial<UserPreferencesData>,
                { [key]: currentValue } as Partial<UserPreferencesData>
            );
        }, 500);
    }, [preferences, onUpdate, saveNotification]);

    const renderToggle = (item: NotificationToggle) => {
        const value = preferences[item.key] as boolean;
        return (
            <div key={item.key} className="flex items-center justify-between py-4">
                <div>
                    <p className="text-white font-medium mb-1">{t(item.label)}</p>
                    <p className="text-sm text-gray-400">{t(item.description)}</p>
                </div>
                <button
                    onClick={() => togglePref(item.key)}
                    role="switch"
                    aria-checked={value}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value ? 'bg-primary' : 'bg-bg-muted'}`}
                >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Notificações por Email */}
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5" aria-hidden="true" style={{ color: COLORS.primary }} />
                    <h2 className="text-lg font-semibold text-white">{t('emailTitle')}</h2>
                </div>

                <div className="space-y-1">
                    {EMAIL_TOGGLES.map(renderToggle)}
                </div>
            </div>

            {/* Notificações Push */}
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="w-5 h-5" aria-hidden="true" style={{ color: COLORS.primary }} />
                    <h2 className="text-lg font-semibold text-white">{t('pushTitle')}</h2>
                </div>
                <p className="text-xs text-gray-500 mb-4 pl-8">
                    {t('pushSoon')}
                </p>

                <div className="space-y-1 opacity-70">
                    {PUSH_TOGGLES.map(renderToggle)}
                </div>
            </div>
        </div>
    );
}

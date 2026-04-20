import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface NotificationsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface NotificationSettings {
    newReleases: boolean;
    recommendations: boolean;
    accountAlerts: boolean;
    marketing: boolean;
}

export default function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
    const t = useTranslations('notificationsModal');
    const tc = useTranslations('common');
    const [notifications, setNotifications] = useState<NotificationSettings>({
        newReleases: true,
        recommendations: true,
        accountAlerts: true,
        marketing: false
    });
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    // Buscar preferências atuais do banco
    useEffect(() => {
        if (open && !fetched) {
            fetch('/api/settings/preferences')
                .then(res => res.json())
                .then(data => {
                    if (data.preferences) {
                        setNotifications({
                            newReleases: data.preferences.emailNewReleases ?? true,
                            recommendations: data.preferences.emailRecommendations ?? true,
                            accountAlerts: data.preferences.emailAccountAlerts ?? true,
                            marketing: data.preferences.emailMarketing ?? false,
                        });
                    }
                    setFetched(true);
                })
                .catch(() => { });
        }
    }, [open, fetched]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailNewReleases: notifications.newReleases,
                    emailRecommendations: notifications.recommendations,
                    emailAccountAlerts: notifications.accountAlerts,
                    emailMarketing: notifications.marketing,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t('saveError'));
            }

            toast.success(t('saved'));
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('savePrefsError'));
        } finally {
            setLoading(false);
        }
    };

    const toggleNotification = (key: keyof NotificationSettings) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Modal open={open} onOpenChange={onOpenChange} title={t('title')}>
            <div className="space-y-1">
                {/* Novos Lançamentos */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="text-white font-medium mb-1">{t('newReleases')}</p>
                        <p className="text-sm text-gray-400">{t('newReleasesDesc')}</p>
                    </div>
                    <button
                        onClick={() => toggleNotification('newReleases')}
                        role="switch"
                        aria-checked={notifications.newReleases}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifications.newReleases ? 'bg-primary' : 'bg-bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.newReleases ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {/* Recomendações */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="text-white font-medium mb-1">{t('recommendations')}</p>
                        <p className="text-sm text-gray-400">{t('recommendationsDesc')}</p>
                    </div>
                    <button
                        onClick={() => toggleNotification('recommendations')}
                        role="switch"
                        aria-checked={notifications.recommendations}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifications.recommendations ? 'bg-primary' : 'bg-bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.recommendations ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {/* Alertas da Conta */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="text-white font-medium mb-1">{t('accountAlerts')}</p>
                        <p className="text-sm text-gray-400">{t('accountAlertsDesc')}</p>
                    </div>
                    <button
                        onClick={() => toggleNotification('accountAlerts')}
                        role="switch"
                        aria-checked={notifications.accountAlerts}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifications.accountAlerts ? 'bg-primary' : 'bg-bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.accountAlerts ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between py-4">
                    <div>
                        <p className="text-white font-medium mb-1">{t('marketing')}</p>
                        <p className="text-sm text-gray-400">{t('marketingDesc')}</p>
                    </div>
                    <button
                        onClick={() => toggleNotification('marketing')}
                        role="switch"
                        aria-checked={notifications.marketing}
                        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${notifications.marketing ? 'bg-primary' : 'bg-bg-muted'
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications.marketing ? 'translate-x-6' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-white/[0.08] text-white font-medium rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {tc('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {loading ? t('saving') : t('savePrefs')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { Mail, Globe, LogOut, ChevronDown, Trash2, Pencil, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { COLORS, GRADIENTS } from '@/lib/theme';
import ConfirmDialog from '@/components/ConfirmDialog';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';
import SessionCard from '@/components/settings/SessionCard';
import ChangeEmailModal from '@/components/profile/ChangeEmailModal';
import AvatarPickerModal from '@/components/settings/AvatarPickerModal';
import UserAvatar from '@/components/UserAvatar';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import type { Session } from '@/lib/auth-client';
import type { SessionData } from '@/types/settings';

interface AccountSectionProps {
    initialSession: Session | null;
    initialSessions: Array<Omit<SessionData, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date }>;
}

/**
 * AccountSection - Seção de Conta
 * 
 * Identidade (avatar, nome, email) + segurança (sessões, exclusão de conta).
 * Assinatura vive na sua própria seção dedicada — sem duplicação.
 */
export default function AccountSection({ initialSession, initialSessions }: AccountSectionProps) {
    const user = initialSession?.user || null;
    const t = useTranslations('settingsPage');
    const tc = useTranslations('common');
    const tA11y = useTranslations('a11y');

    // Profile state
    const [userName, setUserName] = useState(user?.name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
    const [avatarIcon, setAvatarIcon] = useState((user as Record<string, unknown>)?.avatarIcon as string || 'user');
    const [avatarColor, setAvatarColor] = useState((user as Record<string, unknown>)?.avatarColor as string || 'red');
    const nameInputRef = useRef<HTMLInputElement>(null);
    const saveNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const previousNameRef = useRef(user?.name || '');

    // Sessions state - normaliza as datas para strings
    const normalizedSessions = initialSessions.map(s => ({
        ...s,
        createdAt: typeof s.createdAt === 'string' ? s.createdAt : s.createdAt.toISOString(),
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : s.updatedAt.toISOString(),
    }));

    const [sessions, setSessions] = useState<SessionData[]>(normalizedSessions);
    const [currentSessionId] = useState<string>(initialSession?.session.id ?? '');
    const [revoking, setRevoking] = useState<string | null>(null);
    const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [sessionsExpanded, setSessionsExpanded] = useState(false);

    const saveName = useCallback(async (newName: string, previousName: string) => {
        try {
            const response = await fetch('/api/settings/name', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || t('errorSaveName'));
            }

            // Better Auth cache will auto-update via useSession() hook
        } catch (error) {
            // Reverte a mudança em caso de erro
            setUserName(previousName);
            toast.error(error instanceof Error ? error.message : t('errorSaveName'));
        }
    }, []);

    const handleNameChange = useCallback((newName: string) => {
        setUserName(newName);
    }, []);

    const startEditingName = useCallback(() => {
        previousNameRef.current = userName;
        setIsEditingName(true);
        setTimeout(() => nameInputRef.current?.focus(), 0);
    }, [userName]);

    const finishEditingName = useCallback(() => {
        setIsEditingName(false);
        const trimmed = userName.trim();

        // Se vazio, reverte ao anterior
        if (!trimmed) {
            setUserName(previousNameRef.current);
            return;
        }

        setUserName(trimmed);

        // Só salva se realmente mudou
        if (trimmed !== previousNameRef.current) {
            if (saveNameTimeoutRef.current) {
                clearTimeout(saveNameTimeoutRef.current);
            }
            saveName(trimmed, previousNameRef.current);
        }
    }, [userName, saveName]);

    const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameInputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setUserName(previousNameRef.current);
            setIsEditingName(false);
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        window.location.href = '/';
                    },
                },
            });
        } catch (error) {
            console.error(tc('errorLoggingOut'), error);
        }
    }, []);

    const handleRevokeSession = useCallback(async (sessionId: string) => {
        try {
            setRevoking(sessionId);
            const response = await fetch('/api/settings/sessions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || t('errorEndSession'));
            }

            setSessions(prev => prev.filter(s => s.id !== sessionId));
            toast.success(t('sessionEnded'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('errorEndSession'));
        } finally {
            setRevoking(null);
        }
    }, []);

    const handleRevokeAll = useCallback(async () => {
        try {
            const response = await fetch('/api/settings/sessions', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                throw new Error(data.error || t('errorEndAllSessions'));
            }

            setSessions(prev => prev.filter(s => s.id === currentSessionId));
            toast.success(t('allSessionsEnded'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('errorEndAllSessions'));
        }
    }, [currentSessionId]);

    const otherSessionsCount = sessions.filter(s => s.id !== currentSessionId).length;

    const handleAvatarSave = useCallback((icon: string, color: string) => {
        setAvatarIcon(icon);
        setAvatarColor(color);
        // Better Auth cache will auto-update via useSession() hook
    }, []);

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* ── Perfil do Usuário + Logout ── */}
            <div
                className="rounded-xl border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden"
                style={{ background: GRADIENTS.surface }}
            >
                {/* Header: Avatar + Info + Sair */}
                <div className="p-6 pb-0">
                    <div className="flex items-center gap-5">
                        <div className="relative group/avatar">
                            <UserAvatar
                                icon={avatarIcon}
                                color={avatarColor}
                                size="lg"
                                shape="rounded"
                                onClick={() => setIsAvatarPickerOpen(true)}
                            />
                            <div
                                className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:opacity-100"
                                onClick={() => setIsAvatarPickerOpen(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsAvatarPickerOpen(true); } }}
                                aria-label={tA11y('editAvatar')}
                            >
                                <Pencil className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 max-w-xs">
                                    <input
                                        ref={nameInputRef}
                                        type="text"
                                        value={userName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        onKeyDown={handleNameKeyDown}
                                        maxLength={50}
                                        className="flex-1 min-w-0 text-lg font-bold text-white bg-white/[0.06] border border-white/[0.12] rounded-lg px-3 py-1.5 outline-none focus:border-primary/50 transition-colors"
                                        aria-label={tA11y('editName')}
                                    />
                                    <button
                                        onClick={finishEditingName}
                                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        title={t('confirmTitle')}
                                        aria-label={tA11y('confirmEdit')}
                                    >
                                        <Check className="w-4 h-4" style={{ color: COLORS.primary }} aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => { setUserName(previousNameRef.current); setIsEditingName(false); }}
                                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        title={t('cancelTitle')}
                                        aria-label={tA11y('cancelEdit')}
                                    >
                                        <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={startEditingName}
                                    className="group/name flex items-center gap-2 max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
                                    aria-label={tA11y('editName')}
                                >
                                    <h2 className="text-xl font-bold text-white truncate">
                                        {userName || tc('user')}
                                    </h2>
                                    <Pencil className="w-3.5 h-3.5 text-gray-500 shrink-0 sm:opacity-0 sm:group-hover/name:opacity-100 transition-opacity" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/[0.06] transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ color: COLORS.primary }}
                            title={t('logoutTitle')}
                        >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">{t('logout')}</span>
                            <span className="sr-only sm:hidden">{t('logout')}</span>
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 mt-5" style={{ height: '1px', background: GRADIENTS.divider }} />

                {/* Row: Email */}
                <div className="px-6">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <Mail className="w-4 h-4 text-white/30 shrink-0" aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-white font-medium text-sm">{tc('email')}</p>
                                <p className="text-gray-400 text-sm truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEmailModalOpen(true)}
                            className="px-4 py-2 text-sm bg-white/[0.08] text-white rounded-lg hover:bg-white/[0.12] transition-colors shrink-0 ml-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {t('change')}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Sessões Ativas (colapsável) ── */}
            <div
                className="rounded-xl border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden"
                style={{ background: GRADIENTS.surface }}
            >
                <button
                    onClick={() => setSessionsExpanded(prev => !prev)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">{t('activeSessions')}</h2>
                            <p className="text-sm text-gray-400">
                                {t('devicesConnected', { count: sessions.length })}
                            </p>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform duration-200 ${sessionsExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                <div
                    className={`grid transition-all duration-300 ease-in-out ${sessionsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="overflow-hidden">
                        <div className="px-6 pb-6 space-y-4">
                            {otherSessionsCount > 0 && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowRevokeAllDialog(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        aria-label={t('endAll')}
                                    >
                                        <LogOut className="w-4 h-4" aria-hidden="true" />
                                        <span className="hidden sm:inline">{t('endAll')}</span>
                                    </button>
                                </div>
                            )}

                            {sessions.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">{t('noSessions')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {sessions.map(session => (
                                        <SessionCard
                                            key={session.id}
                                            session={session}
                                            isCurrent={session.id === currentSessionId}
                                            onRevoke={handleRevokeSession}
                                            revoking={revoking === session.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Exclusão de Conta ── */}
            <div
                className="rounded-xl border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Trash2 className="w-5 h-5 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                            <div>
                                <p className="text-white font-medium">{t('deleteAccount')}</p>
                                <p className="text-sm text-gray-400">
                                    {t('deleteAccountDesc')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteAccountModal(true)}
                            className="px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            {t('deleteAccount')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <ChangeEmailModal
                open={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
                currentEmail={user.email}
            />

            <AvatarPickerModal
                open={isAvatarPickerOpen}
                onOpenChange={setIsAvatarPickerOpen}
                currentIcon={avatarIcon}
                currentColor={avatarColor}
                onSave={handleAvatarSave}
            />

            <ConfirmDialog
                open={showRevokeAllDialog}
                onOpenChange={setShowRevokeAllDialog}
                title={t('endAllSessions')}
                message={t('endAllSessionsDesc')}
                confirmText={tc('confirm')}
                cancelText={tc('cancel')}
                onConfirm={handleRevokeAll}
            />

            <DeleteAccountModal
                open={showDeleteAccountModal}
                onOpenChange={setShowDeleteAccountModal}
                userEmail={initialSession?.user?.email || ''}
            />
        </div>
    );
}

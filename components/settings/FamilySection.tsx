'use client';

import { useState, useCallback } from 'react';
import { Users, UserPlus, Copy, Check, Trash2, LogOut, Mail } from 'lucide-react';
import { COLORS, GRADIENTS } from '@/lib/theme';
import ConfirmDialog from '@/components/ConfirmDialog';
import UserAvatar from '@/components/UserAvatar';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FamilyData, FamilyMembershipData, PlanData } from '@/app/settings/SettingsPageClient';

interface FamilySectionProps {
    family: FamilyData | null;
    familyMembership: FamilyMembershipData | null;
    maxScreens: number;
    userPlan: PlanData | null;
    user: { avatarIcon?: string; avatarColor?: string } | null;
}

/**
 * FamilySection - Seção de Família nas configurações
 * 
 * Permite ao owner gerenciar membros e convites.
 * Membros podem ver a família e sair.
 */
export default function FamilySection({ family: initialFamily, familyMembership, maxScreens, userPlan, user }: FamilySectionProps) {
    const t = useTranslations('settingsFamily');
    const tc = useTranslations('common');
    const [family, setFamily] = useState(initialFamily);
    const [loading, setLoading] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [removingMember, setRemovingMember] = useState<string | null>(null);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);

    const isOwner = !!family;
    const isMember = !!familyMembership;
    const canCreateFamily = maxScreens >= 2;

    // Slots usados (owner conta como 1 + membros aceitos + convites pendentes)
    // ✅ CORREÇÃO: Mesmo sem família criada, o owner sempre conta como 1 membro
    const membersCount = family ? family.members.length + 1 : (canCreateFamily && !isMember ? 1 : 0); // +1 para o owner
    const pendingInvites = family?.invites?.length ?? 0;
    const usedSlots = membersCount + pendingInvites; // Inclui convites pendentes na contagem
    const totalSlots = family?.maxMembers ?? maxScreens;
    const slotsDisponiveis = totalSlots - usedSlots;
    const podeConvidar = slotsDisponiveis > 0;

    const handleCreateInvite = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/family/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao criar convite');
            }

            // Refresh family data
            const familyResponse = await fetch('/api/family');
            const familyData = await familyResponse.json();
            if (familyData.ownedFamily) {
                setFamily(familyData.ownedFamily);
            }

            toast.success(t('inviteCreated'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('inviteCreateError'));
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCopyInviteLink = useCallback(async (token: string) => {
        try {
            const url = `${window.location.origin}/invite/${token}`;
            await navigator.clipboard.writeText(url);
            setCopiedToken(token);
            toast.success(t('linkCopied'));
            setTimeout(() => setCopiedToken(null), 2000);
        } catch {
            toast.error(t('copyError'));
        }
    }, []);

    const handleRevokeInvite = useCallback(async (inviteId: string) => {
        try {
            const response = await fetch('/api/family/invite', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            setFamily(prev => prev ? {
                ...prev,
                invites: prev.invites.filter(i => i.id !== inviteId),
            } : null);

            toast.success(t('inviteRevoked'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('revokeError'));
        }
    }, []);

    const handleRemoveMember = useCallback(async () => {
        if (!selectedMemberId) return;

        try {
            setRemovingMember(selectedMemberId);
            const response = await fetch('/api/family/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: selectedMemberId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            setFamily(prev => prev ? {
                ...prev,
                members: prev.members.filter(m => m.id !== selectedMemberId),
            } : null);

            toast.success(t('memberRemoved'));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('memberRemoveError'));
        } finally {
            setRemovingMember(null);
            setSelectedMemberId(null);
        }
    }, [selectedMemberId]);

    const handleLeaveFamily = useCallback(async () => {
        try {
            const response = await fetch('/api/family/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leave: true }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }

            toast.success(t('leftFamily'));
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('leaveError'));
        }
    }, []);

    // Plano não suporta família
    if (!canCreateFamily) {
        return (
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
                </div>

                <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-white font-medium mb-2">{t('notAvailable')}</p>
                    <p className="text-gray-400 text-sm mb-6">
                        {t('upgradeDesc')}
                    </p>
                    <Link
                        href="/settings?section=plan"
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {t('viewPlans')}
                    </Link>
                </div>
            </div>
        );
    }

    // Usuário é membro de outra família
    if (isMember && !isOwner) {
        return (
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
                </div>

                <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                icon={(familyMembership.family.owner.avatarIcon as string) || 'user'}
                                color={(familyMembership.family.owner.avatarColor as string) || 'red'}
                                size="sm"
                                shape="rounded"
                            />
                            <div>
                                <p className="text-white font-medium">
                                    {t('familyOf', { name: familyMembership.family.owner.name || tc('user') })}
                                </p>
                                <p className="text-gray-400 text-sm">{familyMembership.family.owner.email}</p>
                            </div>
                        </div>

                        <div className="lg:shrink-0">
                            <button
                                onClick={() => setShowLeaveDialog(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                <LogOut className="w-4 h-4" aria-hidden="true" />
                                {t('leaveFamily')}
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mt-4">
                        {t('memberDesc')}
                    </p>
                </div>

                <ConfirmDialog
                    open={showLeaveDialog}
                    onOpenChange={setShowLeaveDialog}
                    title={t('leaveFamily')}
                    message={t('leaveFamilyConfirm')}
                    confirmText={t('leave')}
                    cancelText={tc('cancel')}
                    onConfirm={handleLeaveFamily}
                />
            </div>
        );
    }

    // Owner view (ou ainda sem família)
    return (
        <div className="space-y-6">
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                        <div>
                            <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
                            <p className="text-sm text-gray-400">
                                {userPlan?.name || t('plan')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Slots usage bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('members')}</span>
                        <span className="text-sm text-white font-medium">{t('slotsOf', { used: usedSlots, total: totalSlots })}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${(usedSlots / totalSlots) * 100}%`,
                                backgroundColor: COLORS.primary,
                            }}
                        />
                    </div>
                </div>

                {/* Owner card */}
                <div className="space-y-3 mb-6">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('activeMembers')}</p>

                    {/* Owner */}
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-primary bg-primary/5">
                        <UserAvatar
                            icon={(user?.avatarIcon as string) || 'user'}
                            color={(user?.avatarColor as string) || 'red'}
                            size="sm"
                            shape="rounded"
                        />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className="text-white text-sm font-medium truncate">{t('you')}</p>
                            <span
                                className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full shrink-0"
                                style={{ backgroundColor: COLORS.primary, color: 'white' }}
                            >
                                {t('owner')}
                            </span>
                        </div>
                    </div>

                    {/* Members */}
                    {family?.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                            <UserAvatar
                                icon={(member.user.avatarIcon as string) || 'user'}
                                color={(member.user.avatarColor as string) || 'red'}
                                size="sm"
                                shape="rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                    {member.user.name || tc('user')}
                                </p>
                                <p className="text-gray-500 text-xs truncate">{member.user.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedMemberId(member.id);
                                    setShowRemoveDialog(true);
                                }}
                                disabled={removingMember === member.id}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                title={t('removeMember')}
                                aria-label={t('removeMember')}
                            >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Pending invites */}
                {family?.invites && family.invites.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">{t('pendingInvites')}</p>
                        <div className="space-y-3">
                            {family.invites.map((invite) => {
                                const expiresAt = new Date(invite.expiresAt);
                                const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000));
                                const isCopied = copiedToken === invite.token;

                                return (
                                    <div key={invite.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.06]">
                                            <Mail className="w-4 h-4 text-white/40" aria-hidden="true" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium">
                                                {invite.email || t('openInvite')}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {t('expiresIn', { days: daysLeft })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => handleCopyInviteLink(invite.token)}
                                                className="p-2 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                title={t('copyLink')}
                                                aria-label={t('copyLink')}
                                            >
                                                {isCopied ? <Check className="w-4 h-4 text-green-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                                            </button>
                                            <button
                                                onClick={() => handleRevokeInvite(invite.id)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                title={t('revokeInvite')}
                                                aria-label={t('revokeInvite')}
                                            >
                                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Create invite button */}
                {podeConvidar ? (
                    <button
                        onClick={handleCreateInvite}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                        {loading ? t('creating') : t('inviteMember')}
                    </button>
                ) : (
                    <p className="text-sm text-gray-400">
                        {t('allSlotsFull')}
                        {pendingInvites > 0
                            ? ` ${t('cancelInviteOrRemove')}`
                            : ` ${t('removeToInvite')}`}
                    </p>
                )}
            </div>

            {/* Confirm remove dialog */}
            <ConfirmDialog
                open={showRemoveDialog}
                onOpenChange={setShowRemoveDialog}
                title={t('removeMemberTitle')}
                message={t('removeMemberDesc')}
                confirmText={t('remove')}
                cancelText={tc('cancel')}
                onConfirm={handleRemoveMember}
            />
        </div>
    );
}

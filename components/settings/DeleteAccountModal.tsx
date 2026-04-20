'use client';

import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { COLORS } from '@/lib/theme';
import TwoStepVerificationModal from '@/components/ui/TwoStepVerificationModal';
import { authClient } from '@/lib/auth-client';

interface DeleteAccountModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userEmail: string;
}

/**
 * DeleteAccountModal - Modal de exclusão de conta com verificação OTP
 * 
 * Usa o componente modular TwoStepVerificationModal:
 * 1. Etapa de contexto: aviso sobre consequências (com botão "Continuar" + seta →)
 * 2. Etapa de verificação: OTP enviado para o email do usuário
 */
export default function DeleteAccountModal({ open, onOpenChange, userEmail }: DeleteAccountModalProps) {
    const t = useTranslations('settingsDeleteAccount');
    const tc = useTranslations('common');

    const handleVerifySuccess = useCallback(async (otp: string) => {
        try {
            // Enviar OTP para o servidor validar
            const response = await fetch('/api/settings/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp }),
            });

            if (!response.ok) {
                const data = response.status !== 204 ? await response.json() : {};
                return {
                    success: false,
                    error: data.error || t('deleteError'),
                };
            }

            toast.success(t('deleteSuccess'));

            // CRÍTICO: Fazer signOut no cliente para garantir limpeza dos cookies
            // O servidor já invalidou os cookies, mas precisamos atualizar o estado local
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        // Redirecionar após signOut para evitar loop infinito
                        window.location.href = '/';
                    },
                },
            });

            return { success: true };
        } catch {
            return {
                success: false,
                error: t('unexpectedError'),
            };
        }
    }, [userEmail]);

    return (
        <TwoStepVerificationModal
            open={open}
            onOpenChange={onOpenChange}
            icon={AlertTriangle}
            iconColor={COLORS.primary}
            title={t('title')}
            description={
                <>
                    {t('permanent')}{' '}
                    {t('allDataRemoved')}
                </>
            }
            continueButtonText={t('continueButton')}
            continueButtonColor={COLORS.primary}
            otpTitle={t('verifyIdentity')}
            otpDescription={
                <>
                    {t('verificationSent')}{' '}
                    <span className="text-white font-medium">{userEmail}</span>.
                    {t('confirmDeletion')}
                </>
            }
            verifyButtonText={t('delete')}
            targetEmail={userEmail}
            otpType="forget-password"
            onVerifySuccess={handleVerifySuccess}
            cancelButtonText={tc('cancel')}
        />
    );
}

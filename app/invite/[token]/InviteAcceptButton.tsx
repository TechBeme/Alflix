'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { COLORS } from '@/lib/theme';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { translateApiError } from '@/lib/i18n';

interface InviteAcceptButtonProps {
    token: string;
}

/**
 * InviteAcceptButton - Client Component
 * 
 * Botão de aceitar convite familiar com feedback visual.
 */
export default function InviteAcceptButton({ token }: InviteAcceptButtonProps) {
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const router = useRouter();
    const t = useTranslations('inviteAccept');
    const tRoot = useTranslations(); // Para traduzir erros da API

    const handleAccept = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/family/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                const data = await response.json();
                const errorMessage = translateApiError(tRoot, data.error);
                throw new Error(errorMessage);
            }

            setAccepted(true);
            toast.success(t('success'));

            setTimeout(() => {
                router.push('/settings');
            }, 1500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('acceptError'));
        } finally {
            setLoading(false);
        }
    };

    if (accepted) {
        return (
            <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-green-400" aria-hidden="true" />
                <p className="text-green-400 font-medium">{t('redirecting')}</p>
            </div>
        );
    }

    return (
        <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ backgroundColor: COLORS.primary }}
        >
            {loading ? t('accepting') : t('accept')}
        </button>
    );
}

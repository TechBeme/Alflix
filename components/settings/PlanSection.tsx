'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Check, Clock, Loader2 } from 'lucide-react';
import { COLORS, GRADIENTS } from '@/lib/theme';
import ConfirmDialog from '@/components/ConfirmDialog';
import PlanCard from '@/components/PlanCard';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { PlanData, FamilyMembershipData } from '@/app/settings/SettingsPageClient';

interface PlanSectionProps {
    userPlan: PlanData | null;
    trialEndsAt: string | null;
    familyMembership: FamilyMembershipData | null;
}

const PLAN_DEFS = [
    { id: 'plan_individual', nameKey: 'individual' as const, priceKey: 'individualPrice' as const, screens: 1 },
    { id: 'plan_duo', nameKey: 'duo' as const, priceKey: 'duoPrice' as const, screens: 2, popular: true },
    { id: 'plan_familia', nameKey: 'family' as const, priceKey: 'familyPrice' as const, screens: 4 },
];

const PLAN_FEATURE_KEYS: Record<string, string[]> = {
    plan_individual: [
        'feature_1_screen',
        'feature_4k_quality',
        'feature_no_ads',
        'feature_all_content',
        'feature_cancel_anytime',
        'feature_24_7_support',
    ],
    plan_duo: [
        'feature_2_screens',
        'feature_4k_quality',
        'feature_no_ads',
        'feature_all_content',
        'feature_cancel_anytime',
        'feature_24_7_support',
        'feature_custom_profiles',
    ],
    plan_familia: [
        'feature_4_screens',
        'feature_4k_quality',
        'feature_no_ads',
        'feature_all_content',
        'feature_cancel_anytime',
        'feature_24_7_support',
        'feature_custom_profiles',
        'feature_parental_control',
    ],
};

/**
 * PlanSection - Seção de Assinatura & Plano
 * 
 * Mostra o plano atual do usuário (ex: Duo, Família).
 * Se estiver em período de teste, exibe badge + dias restantes.
 * Quando o trial expira, mostra aviso para assinar.
 */
export default function PlanSection({ userPlan, trialEndsAt, familyMembership }: PlanSectionProps) {
    const t = useTranslations('settingsPlan');
    const tp = useTranslations('plans');
    const tc = useTranslations('common');
    const searchParams = useSearchParams();
    const isFamilyMember = !!familyMembership;
    const hasPlan = !!userPlan;
    const [changingTo, setChangingTo] = useState<string | null>(null);
    const [cancelingPlan, setCancelingPlan] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);

    const AVAILABLE_PLANS = useMemo(() => PLAN_DEFS.map(def => ({
        ...def,
        name: tp(def.nameKey),
        price: tp(def.priceKey),
        features: [
            tc('screens', { count: def.screens }),
            tp('quality4kHdr'),
            tp('noAds'),
            tp('unlimitedDownload'),
            tp('cancelAnytime'),
        ],
    })), [tp, tc]);

    // Detectar se veio da página de watch sem plano ativo
    useEffect(() => {
        const message = searchParams.get('message');
        if (message === 'subscription_required' && !hasPlan) {
            toast.error(t('subscriptionRequired'), {
                description: t('subscriptionRequiredDesc'),
                duration: 7000,
            });
        }
    }, [searchParams, hasPlan]);

    // Detectar retorno de checkout (sucesso ou cancelamento)
    useEffect(() => {
        const payment = searchParams.get('payment');

        if (payment === 'success') {
            toast.success(t('paymentConfirmed'), {
                description: t('paymentConfirmedDesc'),
                duration: 5000,
            });
            // Limpa URL
            window.history.replaceState({}, '', '/settings?section=plan');
            // Idealmente, recarregar dados do usuário aqui
            setTimeout(() => window.location.reload(), 2000);
        } else if (payment === 'canceled') {
            toast.error(t('paymentCancelled'), {
                description: t('paymentCancelledDesc'),
                duration: 4000,
            });
            // Limpa URL
            window.history.replaceState({}, '', '/settings?section=plan');
        }
    }, [searchParams]);

    // Calcular estado do trial
    const trialInfo = useMemo(() => {
        if (!trialEndsAt) return null;

        const end = new Date(trialEndsAt);
        const now = new Date();
        const diffMs = end.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return {
            isActive: diffMs > 0,
            daysRemaining: Math.max(0, daysRemaining),
            endsAt: end,
        };
    }, [trialEndsAt]);

    const isOnTrial = trialInfo?.isActive ?? false;
    const isTrialExpired = trialInfo !== null && !trialInfo.isActive;
    const currentPlanName = userPlan?.name ?? null;

    // Mapear userPlan.id para a chave de preço no i18n
    const getPlanPrice = () => {
        if (!hasPlan || isTrialExpired || !userPlan?.id) return '—';
        const planDef = PLAN_DEFS.find(def => def.id === userPlan.id);
        if (!planDef) return '—';
        return `${tc('currency')} ${tp(planDef.priceKey)}${tc('perMonth')}`;
    };
    const planPriceLabel = getPlanPrice();

    const handleSelectPlan = async (plan: typeof AVAILABLE_PLANS[0]) => {
        if (plan.name === currentPlanName && !isOnTrial) return;

        try {
            setChangingTo(plan.name);

            // Chama API de criação de checkout
            // Backend define URLs de sucesso/cancelamento (nunca do frontend)
            const response = await fetch('/api/payment/checkout/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: plan.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || tc('failedToCreateCheckout'));
            }

            // Redireciona para página de checkout
            window.location.href = data.checkoutUrl;

        } catch (error) {
            console.error(tc('errorCreatingCheckout'), error);
            toast.error(t('paymentError'), {
                description: error instanceof Error ? error.message : t('tryAgainLater'),
            });
            setChangingTo(null);
        }
    };

    const handleCancelSubscription = async () => {
        try {
            setCancelingPlan(true);
            setShowCancelDialog(false);

            const response = await fetch('/api/settings/subscription/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || tc('failedToCancelSubscription'));
            }

            toast.success(t('subscriptionCancelled'), {
                description: t('cancelledDesc'),
                duration: 4000,
            });

            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error(tc('errorCancellingSubscription'), error);
            toast.error(t('cancelSubError'), {
                description: error instanceof Error ? error.message : t('tryAgainLater'),
            });
            setCancelingPlan(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Plano Atual */}
            <div
                className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                style={{ background: GRADIENTS.surface }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-5 h-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-white">{t('yourPlan')}</h2>
                </div>

                {/* Membro de família - UI diferente */}
                {isFamilyMember ? (
                    <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                            <h3 className="text-xl font-bold text-white">
                                {t('sharedPlan')}
                            </h3>
                            <span
                                className="px-3 py-1 text-xs font-semibold uppercase rounded-full"
                                style={{
                                    backgroundColor: `${COLORS.primary}20`,
                                    color: COLORS.primary,
                                }}
                            >
                                {t('familyTag')}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            {t('sharedPlanDesc', { name: familyMembership.family.owner.name || t('aMember') })}
                        </p>
                        <div className="pt-4 border-t border-white/[0.06]">
                            <p className="text-sm text-gray-400 mb-3">{t('sharedBenefits')}</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                                    {t('fullCatalogAccess')}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                                    {t('quality4k')}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                                    {t('noAds')}
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Check className="w-4 h-4 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                                    {t('unlimitedDownload')}
                                </li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-5">
                        <div className="flex flex-col lg:flex-row lg:justify-between gap-5">
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-xl font-bold text-white">
                                        {hasPlan ? currentPlanName : t('noActivePlan')}
                                    </h3>

                                    {/* Badge de status */}
                                    {isOnTrial && (
                                        <span
                                            className="px-3 py-1 text-xs font-semibold uppercase rounded-full"
                                            style={{
                                                backgroundColor: '#f59e0b20',
                                                color: '#f59e0b',
                                            }}
                                        >
                                            {t('freeTrial')}
                                        </span>
                                    )}
                                    {hasPlan && !isOnTrial && !isTrialExpired && (
                                        <span
                                            className="px-3 py-1 text-xs font-semibold uppercase rounded-full"
                                            style={{
                                                backgroundColor: `${COLORS.primary}20`,
                                                color: COLORS.primary,
                                            }}
                                        >
                                            {t('active')}
                                        </span>
                                    )}
                                    {isTrialExpired && (
                                        <span
                                            className="px-3 py-1 text-xs font-semibold uppercase rounded-full"
                                            style={{
                                                backgroundColor: '#ef444420',
                                                color: '#ef4444',
                                            }}
                                        >
                                            {t('expired')}
                                        </span>
                                    )}
                                    {!hasPlan && !isTrialExpired && (
                                        <span
                                            className="px-3 py-1 text-xs font-semibold uppercase rounded-full"
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                color: '#9ca3af',
                                            }}
                                        >
                                            {t('inactive')}
                                        </span>
                                    )}
                                </div>

                                {/* Info do plano */}
                                {hasPlan && !isTrialExpired && (
                                    <p className="text-gray-400 text-sm mt-1">
                                        {planPriceLabel}
                                    </p>
                                )}

                                {/* Trial info */}
                                {isOnTrial && trialInfo && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock className="w-4 h-4 text-amber-500" aria-hidden="true" />
                                        <p className="text-amber-500 text-sm font-medium">
                                            {trialInfo.daysRemaining === 1
                                                ? t('lastDay')
                                                : t('daysRemaining', { days: trialInfo.daysRemaining })
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Trial expirado */}
                                {isTrialExpired && (
                                    <p className="text-gray-400 text-sm mt-1">
                                        {t('trialExpiredDesc')}
                                    </p>
                                )}

                                {/* Sem plano */}
                                {!hasPlan && !isTrialExpired && (
                                    <p className="text-gray-400 text-sm mt-1">
                                        {t('choosePlanDesc')}
                                    </p>
                                )}
                            </div>

                            <div className="lg:self-center lg:shrink-0">
                                {hasPlan ? (
                                    <button
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={cancelingPlan}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cancelingPlan ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
                                            }`}
                                        style={{ backgroundColor: COLORS.primary }}
                                    >
                                        {cancelingPlan ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                {t('cancelling')}
                                            </>
                                        ) : (
                                            t('cancelPlan')
                                        )}
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {hasPlan && !isTrialExpired && PLAN_FEATURE_KEYS[userPlan.id] && (
                            <div className="pt-4 border-t border-white/[0.06]">
                                <p className="text-sm text-gray-400 mb-3">{t('planBenefits')}</p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                    {PLAN_FEATURE_KEYS[userPlan.id].map((featureKey) => (
                                        <li key={featureKey} className="flex items-center gap-2 text-sm text-gray-300">
                                            <Check className="w-4 h-4 shrink-0" style={{ color: COLORS.primary }} aria-hidden="true" />
                                            {t(featureKey)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Seleção de Planos */}
            {!hasPlan && (
                <div
                    className="rounded-xl p-6 border border-white/[0.06] shadow-lg shadow-black/20"
                    style={{ background: GRADIENTS.surface }}
                >
                    <h3 className="text-lg font-semibold text-white mb-6">{t('choosePlan')}</h3>

                    <div className="grid sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
                        {AVAILABLE_PLANS.map((plan) => {
                            const isCurrent = plan.name === currentPlanName && !isOnTrial && !isTrialExpired;
                            const isSelected = changingTo === plan.name;

                            return (
                                <PlanCard
                                    key={plan.name}
                                    name={plan.name}
                                    price={plan.price}
                                    screens={plan.screens}
                                    popular={plan.popular}
                                    features={plan.features}
                                    ctaText={isCurrent ? t('currentPlan') : isSelected ? t('redirecting') : t('subscribe')}
                                    onSelect={() => handleSelectPlan(plan)}
                                    disabled={isCurrent || isSelected}
                                    loading={isSelected}
                                    noAnimation={true}
                                    compact={true}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Dialog de Cancelamento */}
            <ConfirmDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                title={t('cancelSubscription')}
                message={t('cancelSubscriptionDesc')}
                confirmText={cancelingPlan ? t('cancelling') : tc('confirm')}
                cancelText={tc('back')}
                onConfirm={handleCancelSubscription}
            />
        </div>
    );
}

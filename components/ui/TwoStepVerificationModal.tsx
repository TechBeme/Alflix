'use client';

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Loader2, AlertCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

const OTP_LENGTH = 6;
const OTP_COOLDOWN = 60;

export interface TwoStepVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    // Step 1: Contexto
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    description: string | ReactNode;
    continueButtonText?: string;
    continueButtonColor?: string;

    // Step 2: OTP
    otpTitle: string;
    otpDescription: string | ReactNode;
    verifyButtonText?: string;

    // Comportamento
    targetEmail: string;
    otpType?: 'email-verification' | 'forget-password';
    onVerifySuccess: (otp: string) => Promise<{ success: boolean; error?: string }>;

    // Cancelar
    onCancel?: () => void;
    cancelButtonText?: string;
}

/**
 * TwoStepVerificationModal - Modal modular de verificação em 2 etapas
 * 
 * Etapa 1: Contexto/informação com botão "Continuar" (com seta →)
 * Etapa 2: Verificação OTP
 * 
 * Reutilizável para qualquer ação crítica que necessite verificação OTP:
 * - Excluir conta
 * - Alterar email
 * - Alterar senha
 * - Reset de autenticação 2FA
 * - etc.
 */
export default function TwoStepVerificationModal({
    open,
    onOpenChange,
    icon: Icon,
    iconColor = COLORS.primary,
    iconBgColor,
    title,
    description,
    continueButtonText,
    continueButtonColor = COLORS.primary,
    otpTitle,
    otpDescription,
    verifyButtonText,
    targetEmail,
    otpType = 'forget-password',
    onVerifySuccess,
    onCancel,
    cancelButtonText,
}: TwoStepVerificationModalProps) {
    const t = useTranslations('twoStep');
    const tc = useTranslations('common');

    // Resolve default texts using translations
    const resolvedContinueText = continueButtonText ?? tc('continue');
    const resolvedVerifyText = verifyButtonText ?? (t('verifying').replace('...', '') || tc('confirm'));
    const resolvedCancelText = cancelButtonText ?? tc('cancel');
    const [step, setStep] = useState<'context' | 'otp'>('context');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // OTP state
    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [cooldown, setCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const otpValue = otp.join('');
    const isOtpComplete = otpValue.length === OTP_LENGTH;

    // Timer do cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Focus no primeiro OTP input ao entrar no step de verificação
    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => otpRefs.current[0]?.focus(), 150);
        }
    }, [step]);

    // Reset ao fechar
    const handleClose = useCallback((isOpen: boolean) => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('context');
                setOtp(new Array(OTP_LENGTH).fill(''));
                setErrorMessage('');
                setCooldown(0);
                setLoading(false);
            }, 200);
        }
        onOpenChange(isOpen);
    }, [onOpenChange]);

    // Step 1 → Step 2: Enviar OTP
    const handleProceedToOtp = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: targetEmail,
                type: otpType,
            });

            if (error) {
                setErrorMessage(t('sendError'));
                setLoading(false);
                return;
            }

            setStep('otp');
            setCooldown(OTP_COOLDOWN);
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [targetEmail, otpType, loading]);

    // Step 2: Verificar OTP
    const handleVerifyOtp = useCallback(async (code?: string) => {
        const finalCode = code || otpValue;
        if (finalCode.length !== OTP_LENGTH || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            // Chamar callback de sucesso, que deve validar o OTP no servidor
            // NÃO validamos aqui no client-side por questões de segurança
            const result = await onVerifySuccess(finalCode);

            if (!result.success) {
                setErrorMessage(result.error || t('unexpectedError'));
                setOtp(new Array(OTP_LENGTH).fill(''));
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
                setLoading(false);
                return;
            }

            // Sucesso - fechar modal
            handleClose(false);
        } catch {
            setErrorMessage(t('unexpectedError'));
            setLoading(false);
        }
    }, [otpValue, loading, onVerifySuccess, handleClose]);

    // OTP handlers
    const handleOtpChange = useCallback((index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setErrorMessage('');

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit
        const fullCode = newOtp.join('');
        if (fullCode.length === OTP_LENGTH) {
            handleVerifyOtp(fullCode);
        }
    }, [otp, handleVerifyOtp]);

    const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;

        const newOtp = new Array(OTP_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        setErrorMessage('');

        if (pasted.length === OTP_LENGTH) {
            otpRefs.current[OTP_LENGTH - 1]?.focus();
            handleVerifyOtp(pasted);
        } else {
            otpRefs.current[pasted.length]?.focus();
        }
    }, [handleVerifyOtp]);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
        if (e.key === 'Enter' && isOtpComplete) {
            handleVerifyOtp();
        }
    }, [otp, isOtpComplete, handleVerifyOtp]);

    const handleResendOtp = useCallback(async () => {
        if (cooldown > 0 || loading) return;
        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: targetEmail,
                type: otpType,
            });

            if (error) {
                setErrorMessage(t('resendError'));
                setLoading(false);
                return;
            }

            setCooldown(OTP_COOLDOWN);
            setOtp(new Array(OTP_LENGTH).fill(''));
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [targetEmail, otpType, cooldown, loading]);

    const handleCancelClick = useCallback(() => {
        if (onCancel) {
            onCancel();
        }
        handleClose(false);
    }, [onCancel, handleClose]);

    return (
        <Dialog.Root open={open} onOpenChange={handleClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                <Dialog.Content
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
                        'w-full max-w-md rounded-2xl p-8',
                        'border border-white/[0.06]',
                        'shadow-2xl shadow-black/40',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out',
                        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                        'focus:outline-none'
                    )}
                    style={{ background: GRADIENTS.surface }}
                >
                    {/* Ícone */}
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: iconBgColor || `${iconColor}20` }}
                        >
                            <Icon className="w-8 h-8" style={{ color: iconColor }} aria-hidden="true" />
                        </div>
                    </div>

                    {/* Título */}
                    <Dialog.Title className="text-2xl font-bold text-white text-center mb-3">
                        {step === 'context' ? title : otpTitle}
                    </Dialog.Title>

                    {/* ─── Step 1: Contexto ─── */}
                    {step === 'context' && (
                        <>
                            <Dialog.Description className="text-gray-400 text-center mb-6 leading-relaxed">
                                {description}
                            </Dialog.Description>

                            {/* Erro */}
                            {errorMessage && (
                                <div className="flex items-start gap-3 p-4 rounded-lg border border-red-900/50 bg-red-950/30 mb-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelClick}
                                    disabled={loading}
                                    className={cn(
                                        'flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors',
                                        'bg-white/[0.08] text-white hover:bg-white/[0.12]',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                    )}
                                >
                                    {resolvedCancelText}
                                </button>

                                <button
                                    onClick={handleProceedToOtp}
                                    disabled={loading}
                                    className={cn(
                                        'flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors text-white',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        'flex items-center justify-center gap-2',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                    )}
                                    style={{ backgroundColor: continueButtonColor }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                            {t('sending')}
                                        </>
                                    ) : (
                                        <>
                                            {resolvedContinueText}
                                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ─── Step 2: OTP ─── */}
                    {step === 'otp' && (
                        <>
                            <Dialog.Description className="text-gray-400 text-center mb-2 leading-relaxed">
                                {otpDescription}
                            </Dialog.Description>

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3 my-6" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        disabled={loading}
                                        className={cn(
                                            'w-12 h-14 text-center text-2xl font-bold text-white rounded-xl',
                                            'border focus:outline-none transition-all',
                                            'disabled:opacity-50',
                                            digit
                                                ? 'border-primary/60 focus:ring-2 focus:ring-primary/30'
                                                : 'border-white/[0.12] focus:border-primary/50 focus:ring-2 focus:ring-primary/30'
                                        )}
                                        style={{ background: GRADIENTS.inputAlt }}
                                        aria-label={t('digitLabel', { index: index + 1 })}
                                    />
                                ))}
                            </div>

                            {/* Reenviar */}
                            <div className="text-center mb-6">
                                {cooldown > 0 ? (
                                    <p className="text-sm text-white/30">
                                        {t('resendIn', { seconds: cooldown })}
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        style={{ color: COLORS.primary }}
                                    >
                                        {t('resendCode')}
                                    </button>
                                )}
                            </div>

                            {/* Erro */}
                            {errorMessage && (
                                <div className="flex items-start gap-3 p-4 rounded-lg border border-red-900/50 bg-red-950/30 mb-4">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            {/* Botões */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelClick}
                                    disabled={loading}
                                    className={cn(
                                        'flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors',
                                        'bg-white/[0.08] text-white hover:bg-white/[0.12]',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                    )}
                                >
                                    {resolvedCancelText}
                                </button>

                                <button
                                    onClick={() => handleVerifyOtp()}
                                    disabled={!isOtpComplete || loading}
                                    className={cn(
                                        'flex-1 px-6 py-2.5 rounded-lg font-medium transition-colors text-white',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                        'flex items-center justify-center gap-2',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                    )}
                                    style={{ backgroundColor: continueButtonColor }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                            {t('verifying')}
                                        </>
                                    ) : (
                                        resolvedVerifyText
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

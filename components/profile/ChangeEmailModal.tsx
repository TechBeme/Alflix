'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '@/components/Modal';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { GRADIENTS, COLORS } from '@/lib/theme';
import { useTranslations } from 'next-intl';

/**
 * ChangeEmailModal — Fluxo seguro de troca de email com OTP duplo
 * 
 * Etapas:
 * 1. Inserir novo email
 * 2. Verificar email ATUAL com OTP (prova de identidade)
 * 3. Verificar email NOVO com OTP (prova de posse)
 * 4. Atualização concluída
 * 
 * Segurança:
 * - Dupla verificação OTP (email atual + novo)
 * - Cooldown de 60s entre reenvios
 * - Auto-submit ao completar 6 dígitos
 * - Mensagens genéricas (sem vazamento de informação)
 * - Rate limit server-side (5 tentativas/hora)
 */

interface ChangeEmailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentEmail: string;
}

type Step = 'new-email' | 'verify-current' | 'verify-new' | 'success';

const OTP_LENGTH = 6;
const OTP_COOLDOWN = 60;


export default function ChangeEmailModal({ open, onOpenChange, currentEmail }: ChangeEmailModalProps) {
    const t = useTranslations('changeEmail');
    const tc = useTranslations('common');
    // Fluxo
    const [step, setStep] = useState<Step>('new-email');
    const [newEmail, setNewEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // OTP state
    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [currentOtpValue, setCurrentOtpValue] = useState(''); // Armazenar OTP do email atual
    const [cooldown, setCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Derived
    const otpValue = otp.join('');
    const isOtpComplete = otpValue.length === OTP_LENGTH;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
    const isNewEmailDifferent = newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

    // Timer do cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Focus no primeiro OTP input ao entrar nos steps de verificação
    useEffect(() => {
        if (step === 'verify-current' || step === 'verify-new') {
            setTimeout(() => otpRefs.current[0]?.focus(), 150);
        }
    }, [step]);

    // Focus no input de email ao abrir
    useEffect(() => {
        if (open && step === 'new-email') {
            setTimeout(() => emailInputRef.current?.focus(), 150);
        }
    }, [open, step]);

    // Reset ao fechar
    const handleClose = useCallback(() => {
        onOpenChange(false);
        // Delay para não mostrar reset durante animação de saída
        setTimeout(() => {
            setStep('new-email');
            setNewEmail('');
            setOtp(new Array(OTP_LENGTH).fill(''));
            setCurrentOtpValue('');
            setErrorMessage('');
            setCooldown(0);
            setLoading(false);
        }, 200);
    }, [onOpenChange]);

    // ─── Step 1: Submeter novo email → enviar OTP para email atual ──────

    const handleSubmitNewEmail = useCallback(async () => {
        if (!isEmailValid || !isNewEmailDifferent || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: currentEmail,
                type: 'email-verification', // Alterar email - validar email atual
            });

            if (error) {
                setErrorMessage(t('sendError'));
                return;
            }

            setStep('verify-current');
            setOtp(new Array(OTP_LENGTH).fill(''));
            setCooldown(OTP_COOLDOWN);
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [currentEmail, isEmailValid, isNewEmailDifferent, loading]);

    // ─── Step 2: Verificar OTP do email atual → enviar OTP para novo ────

    const handleVerifyCurrentEmail = useCallback(async (code?: string) => {
        const finalCode = code || otpValue;
        if (finalCode.length !== OTP_LENGTH || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            // NÃO validar OTP aqui (segurança)
            // Apenas armazenar e enviar OTP para o novo email
            setCurrentOtpValue(finalCode);

            // Enviar OTP para o novo email
            const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
                email: newEmail.trim().toLowerCase(),
                type: 'email-verification', // Verifica posse do novo email
            });

            if (sendError) {
                setErrorMessage(t('sendError'));
                setLoading(false);
                return;
            }

            setStep('verify-new');
            setOtp(new Array(OTP_LENGTH).fill(''));
            setCooldown(OTP_COOLDOWN);
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [currentEmail, newEmail, otpValue, loading]);

    // ─── Step 3: Verificar OTP do novo email → alterar email ────────────

    const handleVerifyNewEmail = useCallback(async (code?: string) => {
        const finalCode = code || otpValue;
        if (finalCode.length !== OTP_LENGTH || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            // Verificar OTP do novo email
            const { error } = await authClient.emailOtp.verifyEmail({
                email: newEmail.trim().toLowerCase(),
                otp: finalCode,
            });

            if (error) {
                // Enviar ambos os OTPs para validação no servidor
                const res = await fetch('/api/settings/change-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        newEmail: newEmail.trim().toLowerCase(),
                        currentOtp: currentOtpValue,
                        newOtp: finalCode,
                    }),
                });

                if (!res.ok) {
                    const data = res.status !== 204 ? await res.json() : {};
                    setErrorMessage(data.error || t('changeError'));
                    setOtp(new Array(OTP_LENGTH).fill(''));
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                    setLoading(false);
                    return;
                }

                // Sucesso!
                setStep('success');
                toast.success(t('changeSuccess'), {
                    description: `${newEmail.trim().toLowerCase()}`
                });
            }
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [newEmail, currentOtpValue, otpValue, loading]);

    // Determinar qual handler usar baseado no step atual
    const currentVerifyHandler = step === 'verify-current' ? handleVerifyCurrentEmail : handleVerifyNewEmail;

    const handleOtpChange = useCallback((index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setErrorMessage('');

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit quando completo
        const fullCode = newOtp.join('');
        if (fullCode.length === OTP_LENGTH) {
            currentVerifyHandler(fullCode);
        }
    }, [otp, currentVerifyHandler]);

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
            currentVerifyHandler(pasted);
        } else {
            otpRefs.current[pasted.length]?.focus();
        }
    }, [currentVerifyHandler]);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
        if (e.key === 'Enter' && isOtpComplete) {
            currentVerifyHandler();
        }
    }, [otp, isOtpComplete, currentVerifyHandler]);

    /** Reenviar OTP (respeitando cooldown) */
    const handleResendOtp = useCallback(async () => {
        if (cooldown > 0 || loading) return;

        setLoading(true);
        setErrorMessage('');

        const targetEmail = step === 'verify-current'
            ? currentEmail
            : newEmail.trim().toLowerCase();

        const targetType = 'email-verification'; // Ambos os OTPs são do tipo email-verification

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: targetEmail,
                type: targetType,
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
    }, [step, currentEmail, newEmail, cooldown, loading]);

    // ─── Progress indicator ─────────────────────────────────────────────

    const stepNumber = step === 'new-email' ? 1 : step === 'verify-current' ? 2 : step === 'verify-new' ? 3 : 3;

    const renderProgressBar = () => (
        <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map((s) => (
                <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${s < stepNumber ? 'bg-green-500'
                        : s === stepNumber ? 'bg-primary'
                            : 'bg-white/10'
                        }`}
                />
            ))}
        </div>
    );

    // ─── OTP Input Grid (reutilizável) ──────────────────────────────────

    const renderOtpInputs = () => (
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
                    className={`
                        w-12 h-14 text-center text-2xl font-bold text-white rounded-xl
                        border focus:outline-none transition-all
                        ${digit
                            ? 'border-primary/60 focus:ring-2 focus:ring-primary/30'
                            : 'border-white/[0.12] focus:border-primary/50 focus:ring-2 focus:ring-primary/30'
                        }
                        disabled:opacity-50
                    `}
                    style={{ background: GRADIENTS.inputAlt }}
                    aria-label={t('codeDigit', { number: index + 1 })}
                />
            ))}
        </div>
    );

    // ─── Render ─────────────────────────────────────────────────────────

    const renderTitle = () => {
        switch (step) {
            case 'new-email': return t('title');
            case 'verify-current': return t('confirmYourIdentity');
            case 'verify-new': return t('verifyNewEmail');
            case 'success': return t('emailChanged');
        }
    };

    return (
        <Modal open={open} onOpenChange={handleClose} title={renderTitle()}>
            {step !== 'success' && renderProgressBar()}

            {/* Mensagem de erro */}
            {errorMessage && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-red-900/50 bg-red-950/30 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
            )}

            {/* ─── Step 1: Novo email ─────────────────────────────── */}
            {step === 'new-email' && (
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('currentEmail')}
                        </label>
                        <p className="text-sm text-white">{currentEmail}</p>
                    </div>

                    <div>
                        <label htmlFor="new-email" className="block text-sm font-medium text-gray-300 mb-2">
                            {t('newEmail')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" aria-hidden="true" />
                            <input
                                ref={emailInputRef}
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => {
                                    setNewEmail(e.target.value);
                                    setErrorMessage('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && isEmailValid && isNewEmailDifferent) {
                                        handleSubmitNewEmail();
                                    }
                                }}
                                placeholder={t('newEmailPlaceholder')}
                                autoComplete="email"
                                disabled={loading}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-gray-500 border border-white/[0.08] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
                                style={{ background: GRADIENTS.inputAlt }}
                            />
                        </div>
                        {newEmail && !isNewEmailDifferent && (
                            <p className="text-xs text-amber-400 mt-1.5">
                                {t('emailMustBeDifferent')}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            {t('verificationInfo')}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-white/[0.08] text-white font-medium rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {tc('cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmitNewEmail}
                            disabled={loading || !isEmailValid || !isNewEmailDifferent}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <>
                                    {tc('continue')}
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Step 2: Verificar email atual ──────────────────── */}
            {step === 'verify-current' && (
                <div className="space-y-3">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                            <ShieldCheck className="w-6 h-6 text-primary" aria-hidden="true" />
                        </div>
                        <p className="text-sm text-gray-300">
                            {t('codeSentTo')}
                        </p>
                        <p className="text-white font-semibold mt-1">
                            {currentEmail}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {t('confirmIdentity')}
                        </p>
                    </div>

                    {renderOtpInputs()}

                    {/* Resend + Cooldown */}
                    <div className="text-center">
                        {cooldown > 0 ? (
                            <p className="text-xs text-gray-500">
                                {t('resendIn', { seconds: cooldown })}
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOtp}
                                disabled={loading}
                                className="text-xs text-primary hover:text-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('resendCode')}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setStep('new-email');
                                setOtp(new Array(OTP_LENGTH).fill(''));
                                setErrorMessage('');
                            }}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.08] text-white font-medium rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                            {tc('back')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVerifyCurrentEmail()}
                            disabled={loading || !isOtpComplete}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <>
                                    {t('verify')}
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Step 3: Verificar novo email ───────────────────── */}
            {step === 'verify-new' && (
                <div className="space-y-3">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                            <Mail className="w-6 h-6 text-green-400" aria-hidden="true" />
                        </div>
                        <p className="text-sm text-gray-300">
                            {t('nowVerifyNewEmail')}
                        </p>
                        <p className="text-white font-semibold mt-1">
                            {newEmail.trim().toLowerCase()}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {t('almostDone')}
                        </p>
                    </div>

                    {renderOtpInputs()}

                    {/* Resend + Cooldown */}
                    <div className="text-center">
                        {cooldown > 0 ? (
                            <p className="text-xs text-gray-500">
                                {t('resendIn', { seconds: cooldown })}
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOtp}
                                disabled={loading}
                                className="text-xs text-primary hover:text-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                {t('resendCode')}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setStep('verify-current');
                                setOtp(new Array(OTP_LENGTH).fill(''));
                                setErrorMessage('');
                                setCooldown(0);
                            }}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.08] text-white font-medium rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                            {tc('back')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVerifyNewEmail()}
                            disabled={loading || !isOtpComplete}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <>
                                    {t('confirmChange')}
                                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Step 4: Sucesso ────────────────────────────────── */}
            {step === 'success' && (
                <div className="text-center space-y-4 py-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                        <CheckCircle className="w-8 h-8 text-green-400" aria-hidden="true" />
                    </div>

                    <div>
                        <p className="text-gray-300 text-sm">
                            {t('changeSuccess')}
                        </p>
                        <p className="text-white font-semibold text-lg mt-1">
                            {newEmail.trim().toLowerCase()}
                        </p>
                    </div>

                    <p className="text-xs text-gray-500">
                        {t('nextTimeUseNewEmail')}
                    </p>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        {tc('close')}
                    </button>
                </div>
            )}
        </Modal>
    );
}

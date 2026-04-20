'use client';

import { useState, Suspense, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { usePrefetch } from '@/hooks/usePrefetch';
import { COLORS, GRADIENTS } from '@/lib/theme';
import { SITE_NAME, SITE_NAME_SUFFIX, SITE_NAME_FULL } from '@/lib/config';
import { useTranslations } from 'next-intl';

/** Cooldown em segundos entre reenvios de OTP */
const OTP_COOLDOWN = 60;
/** Comprimento do OTP */
const OTP_LENGTH = 6;

type Step = 'email' | 'otp';

function LoginForm() {
    const t = useTranslations('loginPage');
    const tA11y = useTranslations('a11y');
    const searchParams = useSearchParams();
    const router = useRouter();
    const redirectUrl = searchParams.get('redirect');

    // One-time session check (NOT reactive) to avoid refetching on tab focus.
    // useSession() refetches on every visibilitychange event, which triggers
    // rate limiting on /get-session. On the login page we only need a single check.
    const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        authClient.getSession().then(({ data }) => {
            if (!cancelled) {
                setUser(data?.user ?? null);
                setAuthLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setAuthLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Prefetch
    const homePrefetch = usePrefetch('/', 300);
    const termsPrefetch = usePrefetch('/terms', 300);
    const privacyPrefetch = usePrefetch('/privacy', 300);

    // State
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Refs para inputs do OTP
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Timer do cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Redirecionar usuários já autenticados
    useEffect(() => {
        if (!authLoading && user) {
            const destination = redirectUrl || '/';
            router.push(destination);
        }
    }, [user, authLoading, router, redirectUrl]);

    // Focus no primeiro input OTP ao mudar de step
    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    // Validação simples de email
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const otpValue = otp.join('');
    const isOtpComplete = otpValue.length === OTP_LENGTH;

    /** Envia OTP para o email */
    const handleSendOTP = useCallback(async () => {
        if (!isEmailValid || loading) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: email.trim().toLowerCase(),
                type: 'sign-in',
            });

            if (error) {
                // Resposta genérica — não revela se email existe
                setErrorMessage(t('processError'));
                return;
            }

            // Sucesso — muda para step OTP
            setStep('otp');
            setOtp(new Array(OTP_LENGTH).fill(''));
            setCooldown(OTP_COOLDOWN);
            setSuccessMessage(t('codeSentSuccess'));
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [email, isEmailValid, loading]);

    /** Reenvia OTP (respeitando cooldown) */
    const handleResendOTP = useCallback(async () => {
        if (cooldown > 0 || loading) return;

        setLoading(true);
        setErrorMessage('');

        try {
            const { error } = await authClient.emailOtp.sendVerificationOtp({
                email: email.trim().toLowerCase(),
                type: 'sign-in',
            });

            if (error) {
                setErrorMessage(t('resendError'));
                return;
            }

            setCooldown(OTP_COOLDOWN);
            setOtp(new Array(OTP_LENGTH).fill(''));
            setSuccessMessage(t('newCodeSent'));
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [email, cooldown, loading]);

    /** Faz login com OTP */
    const handleVerifyOTP = useCallback(async (code?: string) => {
        const finalCode = code || otpValue;
        if (finalCode.length !== OTP_LENGTH || loading) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const { data, error } = await authClient.signIn.emailOtp({
                email: email.trim().toLowerCase(),
                otp: finalCode,
            });

            if (error) {
                const msg = error.message?.toLowerCase() || '';

                if (msg.includes('too_many_attempts') || msg.includes('too many')) {
                    setErrorMessage(t('tooManyAttempts'));
                    setOtp(new Array(OTP_LENGTH).fill(''));
                } else if (msg.includes('expired') || msg.includes('expirado')) {
                    setErrorMessage(t('codeExpired'));
                    setOtp(new Array(OTP_LENGTH).fill(''));
                } else if (msg.includes('invalid') || msg.includes('incorrect')) {
                    setErrorMessage(t('invalidCode'));
                    setOtp(new Array(OTP_LENGTH).fill(''));
                    setTimeout(() => otpRefs.current[0]?.focus(), 100);
                } else {
                    setErrorMessage(t('invalidCode'));
                    setOtp(new Array(OTP_LENGTH).fill(''));
                }
                return;
            }

            if (data?.user) {
                setSuccessMessage(t('loginSuccess'));
                setTimeout(() => {
                    const destination = redirectUrl || '/';
                    window.location.href = destination;
                }, 800);
            } else {
                setErrorMessage(t('authError'));
            }
        } catch {
            setErrorMessage(t('connectionError'));
        } finally {
            setLoading(false);
        }
    }, [email, otpValue, loading, redirectUrl]);

    /** Handler para cada input do OTP */
    const handleOtpChange = (index: number, value: string) => {
        // Aceitar apenas dígitos
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setErrorMessage('');

        // Auto-avançar para próximo campo
        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit quando completo
        const fullCode = newOtp.join('');
        if (fullCode.length === OTP_LENGTH) {
            handleVerifyOTP(fullCode);
        }
    };

    /** Handler para colar código OTP */
    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        if (!pasted) return;

        const newOtp = new Array(OTP_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        setErrorMessage('');

        // Focus no último campo preenchido ou submit
        if (pasted.length === OTP_LENGTH) {
            otpRefs.current[OTP_LENGTH - 1]?.focus();
            handleVerifyOTP(pasted);
        } else {
            otpRefs.current[pasted.length]?.focus();
        }
    };

    /** Handler de teclado para OTP (backspace) */
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
        if (e.key === 'Enter' && isOtpComplete) {
            handleVerifyOTP();
        }
    };

    /** Voltar para step de email */
    const handleBackToEmail = () => {
        setStep('email');
        setOtp(new Array(OTP_LENGTH).fill(''));
        setErrorMessage('');
        setSuccessMessage('');
        setTimeout(() => emailInputRef.current?.focus(), 100);
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: GRADIENTS.pageAuth }}>
                <AnimatedBackground variant="default" withGrid={true} />
                <div className="relative z-10 text-center" role="status">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORS.primary }} aria-hidden="true" />
                    <p className="text-gray-400">{t('verifyingAuth')}</p>
                </div>
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: GRADIENTS.pageAuth }}>
            <AnimatedBackground variant="default" withGrid={true} />

            <div className="w-full max-w-md relative z-10">
                {/* Botão Voltar */}
                <Link
                    href="/"
                    prefetch={false}
                    onMouseEnter={homePrefetch.handleMouseEnter}
                    onMouseLeave={homePrefetch.handleMouseLeave}
                    className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
                    {t('back')}
                </Link>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image
                            src="/logo.png"
                            alt={tA11y('logoAlt', { siteName: SITE_NAME_FULL })}
                            width={50}
                            height={50}
                            className="w-12 h-12"
                        />
                        <h1 className="text-5xl font-bold">
                            <span style={{
                                background: GRADIENTS.primaryText,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}>
                                {SITE_NAME}
                            </span>
                            {SITE_NAME_SUFFIX && (
                                <span className="text-white">{SITE_NAME_SUFFIX}</span>
                            )}
                        </h1>
                    </div>
                </div>

                {/* Card */}
                <div className="border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-black/40" style={{ background: GRADIENTS.surface }}>

                    {step === 'email' ? (
                        /* ──────── STEP 1: EMAIL ──────── */
                        <>
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${COLORS.primary}20` }}>
                                    <Mail className="w-8 h-8" style={{ color: COLORS.primary }} aria-hidden="true" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">{t('title')}</h2>
                                <p className="text-gray-400 text-sm">
                                    {t('subtitle')}
                                </p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('emailLabel')}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" aria-hidden="true" />
                                        <input
                                            ref={emailInputRef}
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                                            placeholder={t('emailPlaceholder')}
                                            autoComplete="email"
                                            autoFocus
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-gray-500 border border-white/[0.08] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                            style={{ background: GRADIENTS.inputAlt }}
                                        />
                                    </div>
                                </div>

                                {/* Mensagens */}
                                {errorMessage && (
                                    <div className="flex items-start gap-3 p-4 rounded-lg border border-red-900/50 bg-red-950/30" role="alert">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                        <p className="text-sm text-red-400">{errorMessage}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading || !isEmailValid}
                                    className="w-full text-white py-6 text-base font-medium hover:opacity-90 transition-all"
                                    style={{ backgroundColor: COLORS.primary }}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                            {t('sending')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            {t('continue')}
                                            <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </>
                    ) : (
                        /* ──────── STEP 2: OTP ──────── */
                        <>
                            <div className="text-center mb-6">
                                <button
                                    onClick={handleBackToEmail}
                                    className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                                    {t('changeEmail')}
                                </button>

                                <h2 className="text-2xl font-bold text-white mb-2">{t('verifyEmail')}</h2>
                                <p className="text-gray-400 text-sm">
                                    {t('codeSent', { digits: OTP_LENGTH })}
                                </p>
                                <p className="text-white font-medium text-sm mt-1">{email}</p>
                            </div>

                            {/* OTP Inputs */}
                            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-12 h-14 text-center text-2xl font-bold text-white rounded-xl border border-white/[0.12] focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                                        style={{ background: GRADIENTS.inputAlt }}
                                        aria-label={t('codeDigit', { number: index + 1 })}
                                    />
                                ))}
                            </div>

                            {/* Mensagens */}
                            {errorMessage && (
                                <div className="flex items-start gap-3 p-4 rounded-lg border border-red-900/50 bg-red-950/30 mb-4" role="alert">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-start gap-3 p-4 rounded-lg border border-green-900/50 bg-green-950/30 mb-4" role="status">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    <p className="text-sm text-green-400">{successMessage}</p>
                                </div>
                            )}

                            {/* Botão Verificar */}
                            <Button
                                onClick={() => handleVerifyOTP()}
                                disabled={loading || !isOtpComplete}
                                className="w-full text-white py-6 text-base font-medium hover:opacity-90 transition-all mb-4"
                                style={{ backgroundColor: COLORS.primary }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                                        {t('verifying')}
                                    </span>
                                ) : (
                                    t('signIn')
                                )}
                            </Button>

                            {/* Reenviar */}
                            <div className="text-center">
                                <p className="text-gray-500 text-sm mb-1">{t('didntReceive')}</p>
                                {cooldown > 0 ? (
                                    <p className="text-gray-400 text-sm">
                                        {t('resendIn', { seconds: cooldown })}
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendOTP}
                                        disabled={loading}
                                        className="text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        style={{ color: COLORS.primary }}
                                    >
                                        {t('resendCode')}
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* Termos */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        {t('termsAgreement')}{' '}
                        <Link
                            href="/terms"
                            prefetch={false}
                            onMouseEnter={termsPrefetch.handleMouseEnter}
                            onMouseLeave={termsPrefetch.handleMouseLeave}
                            className="text-primary hover:text-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                            {t('termsOfUse')}
                        </Link>{' '}
                        {t('and')}{' '}
                        <Link
                            href="/privacy"
                            prefetch={false}
                            onMouseEnter={privacyPrefetch.handleMouseEnter}
                            onMouseLeave={privacyPrefetch.handleMouseLeave}
                            className="text-primary hover:text-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                        >
                            {t('privacyPolicy')}
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPageClient() {
    const t = useTranslations('loginPage');
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: GRADIENTS.pageAuth }}>
                <div className="text-white">{t('loadingText')}</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

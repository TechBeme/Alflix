'use client';

import { SITE_NAME_FULL } from '@/lib/config';
import { localeToDir } from '@/lib/language';

import { useEffect, useMemo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { COLORS } from '@/lib/theme';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

// Traduções inline para erro crítico (não pode usar next-intl pois substitui root layout)
const translations = {
    'pt-BR': {
        title: 'Erro Crítico',
        description: 'Ocorreu um erro crítico na aplicação. Por favor, recarregue a página ou entre em contato com o suporte se o problema persistir.',
        errorCode: 'Código do erro',
        reloadButton: 'Recarregar Página',
        helpText: 'Se o problema persistir, entre em contato com',
        support: 'nosso suporte',
        pageTitle: `Erro Crítico - ${SITE_NAME_FULL}`,
    },
    'en': {
        title: 'Critical Error',
        description: 'A critical error occurred in the application. Please reload the page or contact support if the problem persists.',
        errorCode: 'Error code',
        reloadButton: 'Reload Page',
        helpText: 'If the problem persists, contact',
        support: 'our support',
        pageTitle: `Critical Error - ${SITE_NAME_FULL}`,
    },
    'es': {
        title: 'Error Crítico',
        description: 'Ocurrió un error crítico en la aplicación. Por favor, recargue la página o contacte con soporte si el problema persiste.',
        errorCode: 'Código de error',
        reloadButton: 'Recargar Página',
        helpText: 'Si el problema persiste, contacte con',
        support: 'nuestro soporte',
        pageTitle: `Error Crítico - ${SITE_NAME_FULL}`,
    },
    'ar': {
        title: 'خطأ حرج',
        description: 'حدث خطأ حرج في التطبيق. يرجى إعادة تحميل الصفحة أو التواصل مع الدعم إذا استمرت المشكلة.',
        errorCode: 'رمز الخطأ',
        reloadButton: 'إعادة تحميل الصفحة',
        helpText: 'إذا استمرت المشكلة، تواصل مع',
        support: 'فريق الدعم',
        pageTitle: `خطأ حرج - ${SITE_NAME_FULL}`,
    },
    'de': {
        title: 'Kritischer Fehler',
        description: 'In der Anwendung ist ein kritischer Fehler aufgetreten. Bitte laden Sie die Seite neu oder kontaktieren Sie den Support, wenn das Problem weiterhin besteht.',
        errorCode: 'Fehlercode',
        reloadButton: 'Seite neu laden',
        helpText: 'Wenn das Problem weiterhin besteht, kontaktieren Sie',
        support: 'unseren Support',
        pageTitle: `Kritischer Fehler - ${SITE_NAME_FULL}`,
    },
    'fr': {
        title: 'Erreur Critique',
        description: 'Une erreur critique s\'est produite dans l\'application. Veuillez recharger la page ou contacter le support si le problème persiste.',
        errorCode: 'Code d\'erreur',
        reloadButton: 'Recharger la Page',
        helpText: 'Si le problème persiste, contactez',
        support: 'notre support',
        pageTitle: `Erreur Critique - ${SITE_NAME_FULL}`,
    },
    'hi': {
        title: 'गंभीर त्रुटि',
        description: 'एप्लिकेशन में एक गंभीर त्रुटि हुई। कृपया पेज रीलोड करें या समस्या बनी रहने पर सहायता से संपर्क करें।',
        errorCode: 'त्रुटि कोड',
        reloadButton: 'पेज रीलोड करें',
        helpText: 'यदि समस्या बनी रहती है, तो संपर्क करें',
        support: 'हमारी सहायता टीम',
        pageTitle: `गंभीर त्रुटि - ${SITE_NAME_FULL}`,
    },
    'it': {
        title: 'Errore Critico',
        description: 'Si è verificato un errore critico nell\'applicazione. Ricarica la pagina o contatta l\'assistenza se il problema persiste.',
        errorCode: 'Codice errore',
        reloadButton: 'Ricarica Pagina',
        helpText: 'Se il problema persiste, contatta',
        support: 'il nostro supporto',
        pageTitle: `Errore Critico - ${SITE_NAME_FULL}`,
    },
    'ja': {
        title: '重大なエラー',
        description: 'アプリケーションで重大なエラーが発生しました。ページを再読み込みするか、問題が解決しない場合はサポートにお問い合わせください。',
        errorCode: 'エラーコード',
        reloadButton: 'ページを再読み込み',
        helpText: '問題が解決しない場合は、',
        support: 'サポート',
        pageTitle: `重大なエラー - ${SITE_NAME_FULL}`,
    },
    'ko': {
        title: '심각한 오류',
        description: '애플리케이션에서 심각한 오류가 발생했습니다. 페이지를 새로고침하거나 문제가 지속되면 지원팀에 문의하세요.',
        errorCode: '오류 코드',
        reloadButton: '페이지 새로고침',
        helpText: '문제가 지속되면 연락하세요',
        support: '고객 지원',
        pageTitle: `심각한 오류 - ${SITE_NAME_FULL}`,
    },
    'ru': {
        title: 'Критическая ошибка',
        description: 'В приложении произошла критическая ошибка. Пожалуйста, перезагрузите страницу или обратитесь в службу поддержки, если проблема не исчезнет.',
        errorCode: 'Код ошибки',
        reloadButton: 'Перезагрузить страницу',
        helpText: 'Если проблема не исчезнет, свяжитесь с',
        support: 'нашей поддержкой',
        pageTitle: `Критическая ошибка - ${SITE_NAME_FULL}`,
    },
    'zh': {
        title: '严重错误',
        description: '应用程序发生了严重错误。请重新加载页面，如果问题持续存在，请联系技术支持。',
        errorCode: '错误代码',
        reloadButton: '重新加载页面',
        helpText: '如果问题持续存在，请联系',
        support: '我们的技术支持',
        pageTitle: `严重错误 - ${SITE_NAME_FULL}`,
    }
};

/**
 * Global Error Boundary - Catches errors in root layout
 * 
 * This is a special error boundary that catches errors in the root layout
 * and other places where the regular error.tsx can't catch.
 * 
 * Note: Must include <html> and <body> tags as it replaces the root layout.
 * 
 * Used in: Root level errors (Next.js App Router convention)
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
    // Detectar idioma do navegador
    const lang = useMemo(() => {
        if (typeof window !== 'undefined') {
            const browserLang = navigator.language;
            if (browserLang.startsWith('pt')) return 'pt-BR';
            if (browserLang.startsWith('es')) return 'es';
            if (browserLang.startsWith('ar')) return 'ar';
            if (browserLang.startsWith('de')) return 'de';
            if (browserLang.startsWith('fr')) return 'fr';
            if (browserLang.startsWith('hi')) return 'hi';
            if (browserLang.startsWith('it')) return 'it';
            if (browserLang.startsWith('ja')) return 'ja';
            if (browserLang.startsWith('ko')) return 'ko';
            if (browserLang.startsWith('ru')) return 'ru';
            if (browserLang.startsWith('zh')) return 'zh';
        }
        return 'en';
    }, []);

    const t = translations[lang as keyof typeof translations] || translations['en'];

    useEffect(() => {
        // Log critical error
        console.error('Critical Application Error:', error);

        // TODO: Send to error tracking service immediately
        // errorTrackingService.captureException(error, {
        //     level: 'critical',
        //     digest: error.digest,
        //     context: 'global-error-boundary'
        // });
    }, [error]);

    return (
        <html lang={lang} dir={localeToDir(lang)}>
            <head>
                <title>{t.pageTitle}</title>
            </head>
            <body style={{ margin: 0, padding: 0, backgroundColor: COLORS.background.black, fontFamily: 'system-ui, sans-serif' }}>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        maxWidth: '42rem',
                        width: '100%',
                        textAlign: 'center'
                    }} role="alert">
                        {/* Error Icon */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                width: '5rem',
                                height: '5rem',
                                borderRadius: '50%',
                                backgroundColor: `${COLORS.primary}20`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <AlertTriangle
                                    size={40}
                                    color={COLORS.primary}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            color: COLORS.text.white,
                            marginBottom: '1rem'
                        }}>
                            {t.title}
                        </h1>

                        {/* Description */}
                        <p style={{
                            fontSize: '1.125rem',
                            color: COLORS.text.gray,
                            marginBottom: '2rem'
                        }}>
                            {t.description}
                        </p>

                        {/* Error Digest */}
                        {error.digest && (
                            <p style={{
                                fontSize: '0.875rem',
                                color: COLORS.text.grayDark,
                                marginBottom: '2rem',
                                fontFamily: 'monospace'
                            }}>
                                {t.errorCode}: {error.digest}
                            </p>
                        )}

                        {/* Retry Button */}
                        <button
                            onClick={reset}
                            style={{
                                backgroundColor: COLORS.primary,
                                color: COLORS.text.white,
                                padding: '0.75rem 1.5rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background-color 0.2s',
                                outline: 'none',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.boxShadow = '0 0 0 2px white';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.primaryHover;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = COLORS.primary;
                            }}
                        >
                            <RefreshCw size={20} aria-hidden="true" />
                            {t.reloadButton}
                        </button>

                        {/* Help Text */}
                        <p style={{
                            fontSize: '0.875rem',
                            color: COLORS.text.grayDark,
                            marginTop: '2rem'
                        }}>
                            {t.helpText}{' '}
                            <a
                                href="/contact"
                                style={{
                                    color: COLORS.primary,
                                    textDecoration: 'underline',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = '0 0 0 2px white';
                                    e.currentTarget.style.borderRadius = '2px';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {t.support}
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </body>
        </html>
    );
}

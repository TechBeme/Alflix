'use client';

import { Monitor, Smartphone, Tablet, MapPin, LogOut } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { COLORS } from '@/lib/theme';
import { UAParser } from 'ua-parser-js';
import { useState, useEffect } from 'react';
import type { SessionData } from '@/types/settings';
import { localeToBCP47 } from '@/lib/language';

interface SessionCardProps {
    session: SessionData;
    isCurrent: boolean;
    onRevoke: (sessionId: string) => void;
    revoking: boolean;
}

/**
 * Parseia o User-Agent em informações legíveis
 */
function parseUserAgent(userAgent: string | null, t: any) {
    if (!userAgent) {
        return { browser: t('unknownBrowser'), os: t('unknownOS'), deviceType: 'desktop' as const };
    }

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserName = browser.name || t('unknownBrowser');
    const browserVersion = browser.version ? ` ${browser.version.split('.')[0]}` : '';
    const osName = os.name || t('unknownOS');
    const osVersion = os.version ? ` ${os.version}` : '';

    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (device.type === 'mobile') deviceType = 'mobile';
    else if (device.type === 'tablet') deviceType = 'tablet';

    return {
        browser: `${browserName}${browserVersion}`,
        os: `${osName}${osVersion}`,
        deviceType,
    };
}

/**
 * Formata a data relativa
 */
function formatRelativeDate(dateStr: string, locale: string, t: any): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return t('now');
    if (diffMinutes < 60) return t('minutesAgo', { minutes: diffMinutes });
    if (diffHours < 24) return t('hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('daysAgo', { days: diffDays });

    return date.toLocaleDateString(localeToBCP47(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/**
 * Formata a data de criação
 */
function formatDate(dateStr: string, locale: string): string {
    return new Date(dateStr).toLocaleDateString(localeToBCP47(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Retorna o ícone do dispositivo
 */
function DeviceIcon({ type, className }: { type: 'desktop' | 'mobile' | 'tablet'; className?: string }) {
    switch (type) {
        case 'mobile':
            return <Smartphone className={className} aria-hidden="true" />;
        case 'tablet':
            return <Tablet className={className} aria-hidden="true" />;
        default:
            return <Monitor className={className} aria-hidden="true" />;
    }
}

/**
 * Formata o IP de forma legível (IPv4/IPv6)
 */
function formatIpAddress(ip: string | null, t: any): string {
    if (!ip) return t('unknownIP');

    // IPv6 localhost (::1, ::ffff:127.0.0.1, 0000:0000:...)
    if (ip === '::1' || ip.startsWith('::ffff:127.0.0.1') || ip.match(/^0+:0+:0+:0+:0+:0+:0+:0+$/)) {
        return t('local');
    }

    // IPv4 localhost
    if (ip.startsWith('127.0.0.') || ip === 'localhost') {
        return t('local');
    }

    // IPv6 real - mostra apenas primeiros segmentos
    if (ip.includes(':')) {
        const segments = ip.split(':').filter(s => s);
        if (segments.length > 2) {
            return `${segments[0]}:${segments[1]}:••••`;
        }
        return segments.slice(0, 2).join(':') + ':••••';
    }

    // IPv4 - mascara últimos 2 octetos
    if (ip.includes('.')) {
        return ip.split('.').map((part, i) => i >= 2 ? '•••' : part).join('.');
    }

    return t('unknownIP');
}

/**
 * SessionCard - Card individual de uma sessão ativa
 * 
 * Mostra informações do dispositivo, IP e permite encerrar a sessão.
 */
export default function SessionCard({ session, isCurrent, onRevoke, revoking }: SessionCardProps) {
    const t = useTranslations('settingsSession');
    const locale = useLocale();
    const { browser, os, deviceType } = parseUserAgent(session.userAgent, t);
    const maskedIp = formatIpAddress(session.ipAddress, t);
    const [geoData, setGeoData] = useState<{ city: string; country: string; countryCode: string | null } | null>(
        session.geoCity && session.geoCountry ? {
            city: session.geoCity,
            country: session.geoCountry,
            countryCode: session.geoCountryCode,
        } : null
    );

    // Se não tem geodata no banco, buscar via API (apenas uma vez)
    useEffect(() => {
        if (!geoData && session.ipAddress && maskedIp !== t('local') && maskedIp !== t('unknownIP')) {
            fetch('/api/sessions/geolocate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Enviar cookies de autenticação
            })
                .then(res => res.json())
                .then(data => {
                    if (data.city && data.country) {
                        setGeoData({
                            city: data.city,
                            country: data.country,
                            countryCode: data.countryCode,
                        });
                    }
                })
                .catch(() => { });
        }
    }, [session.id, session.ipAddress, geoData, maskedIp]);

    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${isCurrent
                ? 'border-primary bg-primary/5'
                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
        >
            {/* Ícone do dispositivo */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isCurrent ? `${COLORS.primary}20` : 'rgba(255,255,255,0.06)' }}
            >
                <DeviceIcon
                    type={deviceType}
                    className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-white/50'}`}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">
                        {browser} {t('on')} {os}
                    </p>
                    {isCurrent && (
                        <span
                            className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full shrink-0"
                            style={{ backgroundColor: COLORS.primary, color: 'white' }}
                        >
                            {t('thisDevice')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {/* Localização (se disponível) */}
                    {geoData?.city && geoData?.country && geoData.city !== 'Local' && geoData.city !== 'Desconhecido' && (
                        <>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" aria-hidden="true" />
                                {geoData.city}, {geoData.countryCode || geoData.country}
                            </span>
                            <span className="text-xs text-gray-600">•</span>
                        </>
                    )}

                    {/* IP mascarado */}
                    <span className="text-xs text-gray-500">{maskedIp}</span>
                    <span className="text-xs text-gray-600">•</span>

                    {/* Datas */}
                    <span className="text-xs text-gray-500" title={formatDate(session.createdAt, locale)}>
                        {t('connected', { time: formatRelativeDate(session.createdAt, locale, t) })}
                    </span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">
                        {t('activeTime', { time: formatRelativeDate(session.updatedAt, locale, t) })}
                    </span>
                </div>
            </div>

            {/* Ação */}
            {!isCurrent && (
                <button
                    onClick={() => onRevoke(session.id)}
                    disabled={revoking}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title={t('endSession')}
                    aria-label={t('endSession')}
                >
                    {revoking ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                    )}
                </button>
            )}
        </div>
    );
}

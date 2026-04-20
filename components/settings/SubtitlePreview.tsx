'use client';

import { useTranslations } from 'next-intl';

interface SubtitlePreviewProps {
    color: string;
    bg: string;
    size: string;
    font: string;
}

const FONT_MAP: Record<string, string> = {
    default: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Courier, monospace',
    casual: '"Comic Sans MS", cursive, sans-serif',
};

const SIZE_MAP: Record<string, string> = {
    small: '14px',
    medium: '18px',
    large: '22px',
    xlarge: '28px',
};

/**
 * SubtitlePreview - Preview ao vivo das configurações de legenda
 * 
 * Mostra um mini player mockup com o texto de legenda estilizado
 * conforme as configurações atuais.
 */
export default function SubtitlePreview({ color, bg, size, font }: SubtitlePreviewProps) {
    const t = useTranslations('settingsPreferences');

    return (
        <div>
            <label className="block text-sm text-gray-400 mb-2">{t('preview')}</label>
            <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-white/[0.06]">
                {/* Simulated video background */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Fake video gradient bars */}
                <div className="absolute top-4 left-4 right-4 flex gap-2 opacity-20">
                    <div className="h-1 flex-1 rounded bg-white/30" />
                    <div className="h-1 w-8 rounded bg-primary/50" />
                </div>

                {/* Subtitle text */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
                    <span
                        className="px-3 py-1.5 rounded"
                        style={{
                            color,
                            backgroundColor: bg,
                            fontSize: SIZE_MAP[size] || '18px',
                            fontFamily: FONT_MAP[font] || '"Helvetica Neue", Helvetica, Arial, sans-serif',
                            fontWeight: 'bolder',
                            lineHeight: 1.4,
                            textShadow: '#000000 0px 0px 7px',
                        }}
                    >
                        {t('subtitleExample')}
                    </span>
                </div>
            </div>
        </div>
    );
}

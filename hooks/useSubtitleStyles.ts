import { useEffect, useState, useRef } from 'react';
import { SITE_LANGUAGE } from '@/lib/config';

/**
 * Mapeia os nomes de fonte salvos nas preferências para font-family CSS completas
 * Alinhado com globals.css (padrão = "Helvetica Neue", Helvetica, Arial, sans-serif)
 */
const FONT_MAP: Record<string, string> = {
    default: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Courier, monospace',
    casual: '"Comic Sans MS", cursive, sans-serif',
};

/**
 * Mapeia os tamanhos das preferências para valores CSS responsivos (clamp)
 * O padrão "medium" corresponde ao globals.css: clamp(18px, 2.5vw, 45px)
 */
const SIZE_MAP: Record<string, string> = {
    small: 'clamp(14px, 2vw, 32px)',
    medium: 'clamp(18px, 2.5vw, 45px)',
    large: 'clamp(22px, 3vw, 52px)',
    xlarge: 'clamp(28px, 3.5vw, 60px)',
};

interface SubtitlePreferences {
    subtitleEnabled: boolean;
    subtitleLang: string;
    subtitleSize: string;
    subtitleColor: string;
    subtitleBg: string;
    subtitleFont: string;
}

const DEFAULT_PREFS: SubtitlePreferences = {
    subtitleEnabled: false,
    subtitleLang: SITE_LANGUAGE,
    subtitleSize: 'medium',
    subtitleColor: '#FFFFFF',
    subtitleBg: 'transparent',
    subtitleFont: 'default',
};

/**
 * Hook que busca as preferências de legenda do usuário e injeta
 * um <style> dinâmico para aplicar ao ::cue do player de vídeo.
 *
 * Isso garante que as configurações de settings/preferences
 * realmente afetem a aparência das legendas no player.
 */
export function useSubtitleStyles() {
    const [prefs, setPrefs] = useState<SubtitlePreferences>(DEFAULT_PREFS);
    const styleRef = useRef<HTMLStyleElement | null>(null);

    // Buscar preferências do usuário (uma vez)
    useEffect(() => {
        let cancelled = false;

        async function fetchPrefs() {
            try {
                const res = await fetch('/api/settings/preferences');
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled && data.preferences) {
                    setPrefs({
                        subtitleEnabled: data.preferences.subtitleEnabled ?? DEFAULT_PREFS.subtitleEnabled,
                        subtitleLang: data.preferences.subtitleLang ?? DEFAULT_PREFS.subtitleLang,
                        subtitleSize: data.preferences.subtitleSize ?? DEFAULT_PREFS.subtitleSize,
                        subtitleColor: data.preferences.subtitleColor ?? DEFAULT_PREFS.subtitleColor,
                        subtitleBg: data.preferences.subtitleBg ?? DEFAULT_PREFS.subtitleBg,
                        subtitleFont: data.preferences.subtitleFont ?? DEFAULT_PREFS.subtitleFont,
                    });
                }
            } catch {
                // Mantém defaults se falhar
            }
        }

        fetchPrefs();
        return () => { cancelled = true; };
    }, []);

    // Injetar/atualizar <style> dinâmico com as preferências
    useEffect(() => {
        const fontSize = SIZE_MAP[prefs.subtitleSize] || SIZE_MAP.medium;
        const fontFamily = FONT_MAP[prefs.subtitleFont] || FONT_MAP.default;
        const color = prefs.subtitleColor || '#FFFFFF';
        const bg = prefs.subtitleBg || 'transparent';

        const css = `
.video-player-wrapper video::cue {
  color: ${color} !important;
  font-size: ${fontSize} !important;
  font-family: ${fontFamily} !important;
  font-weight: bolder !important;
  line-height: normal !important;
  text-align: center !important;
  text-shadow: #000000 0px 0px 7px !important;
  background: ${bg} !important;
}
`;

        // Cria ou reutiliza o <style> element
        if (!styleRef.current) {
            const style = document.createElement('style');
            style.setAttribute('data-subtitle-prefs', 'true');
            document.head.appendChild(style);
            styleRef.current = style;
        }

        styleRef.current.textContent = css;

        // Cleanup ao desmontar
        return () => {
            if (styleRef.current) {
                styleRef.current.remove();
                styleRef.current = null;
            }
        };
    }, [prefs]);

    return {
        subtitlePrefs: prefs,
        /** Indica se o usuário quer legendas ativadas por padrão */
        defaultSubtitlesEnabled: prefs.subtitleEnabled,
        /** Idioma preferido para legendas */
        preferredSubtitleLang: prefs.subtitleLang,
    };
}

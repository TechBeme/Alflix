'use client';

import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Volume1,
    Maximize,
    Minimize,
    Loader2,
    Gauge,
    Settings,
    Captions,
    RotateCcw,
    RotateCw,
    Check,
    X,
    Sparkles,
    Monitor,
    Smartphone,
    Tv,
    Zap,
    Turtle,
    Rabbit,
    Mic,
    Globe,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GRADIENTS, COLORS } from '@/lib/theme';

export interface VideoPlayerControlsProps {
    playing: boolean;
    volume: number;
    muted: boolean;
    played: number;
    playedSeconds: number;
    duration: number;
    playbackRate: number;
    currentQuality: string;
    fullscreen: boolean;
    buffering: boolean;
    ended: boolean;
    subtitlesEnabled: boolean;
    showControls: boolean;
    qualities: string[];
    playbackRates: number[];
    // Novas props para legendas e áudio
    availableSubtitles: { label: string; language: string; src: string; }[];
    currentSubtitle: string | null;
    availableAudioTracks: { label: string; language: string; }[];
    currentAudioTrack: string;
    onPlayPause: () => void;
    onVolumeChange: (value: number) => void;
    onMuteToggle: () => void;
    onSeek: (value: number) => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onQualityChange: (quality: string) => void;
    onFullscreenToggle: () => void;
    onSubtitlesToggle: () => void;
    onSubtitleChange: (language: string | null) => void;
    onAudioTrackChange: (language: string) => void;
    onMouseMove: () => void;
    title?: string;
}

/**
 * Controles customizados para o player de vídeo
 * Inclui play/pause, volume, seek bar, qualidade, velocidade, legendas e fullscreen
 */
export default function VideoPlayerControls({
    playing,
    volume,
    muted,
    played,
    playedSeconds,
    duration,
    playbackRate,
    currentQuality,
    fullscreen,
    buffering,
    ended,
    subtitlesEnabled,
    showControls,
    qualities,
    playbackRates,
    availableSubtitles,
    currentSubtitle,
    availableAudioTracks,
    currentAudioTrack,
    onPlayPause,
    onVolumeChange,
    onMuteToggle,
    onSeek,
    onSkipForward,
    onSkipBackward,
    onPlaybackRateChange,
    onQualityChange,
    onFullscreenToggle,
    onSubtitlesToggle,
    onSubtitleChange,
    onAudioTrackChange,
    onMouseMove,
    title,
}: VideoPlayerControlsProps) {
    const t = useTranslations('player');
    const tA11y = useTranslations('a11y');
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
    const [seeking, setSeeking] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Refs para detectar cliques fora dos menus
    const subtitlesMenuRef = useRef<HTMLDivElement>(null);
    const qualityMenuRef = useRef<HTMLDivElement>(null);
    const speedMenuRef = useRef<HTMLDivElement>(null);

    // Função para fechar todos os menus
    const closeAllMenus = useCallback(() => {
        setShowSubtitlesMenu(false);
        setShowQualityMenu(false);
        setShowSpeedMenu(false);
    }, []);

    // Fechar menus ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                subtitlesMenuRef.current && !subtitlesMenuRef.current.contains(target) &&
                qualityMenuRef.current && !qualityMenuRef.current.contains(target) &&
                speedMenuRef.current && !speedMenuRef.current.contains(target)
            ) {
                closeAllMenus();
            }
        };

        if (showSubtitlesMenu || showQualityMenu || showSpeedMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSubtitlesMenu, showQualityMenu, showSpeedMenu, closeAllMenus]);

    // Gerenciar hover do volume com delay
    const handleVolumeMouseEnter = () => {
        if (volumeTimeoutRef.current) {
            clearTimeout(volumeTimeoutRef.current);
        }
        setShowVolumeSlider(true);
    };

    const handleVolumeMouseLeave = () => {
        volumeTimeoutRef.current = setTimeout(() => {
            setShowVolumeSlider(false);
        }, 200); // Delay de 200ms antes de esconder
    };

    // Limpar timeout ao desmontar
    useEffect(() => {
        return () => {
            if (volumeTimeoutRef.current) {
                clearTimeout(volumeTimeoutRef.current);
            }
        };
    }, []);

    // Formatar tempo (segundos -> MM:SS)
    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds)) return '00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Handler para seek via barra de progresso
    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;

        onSeek(Math.max(0, Math.min(1, percentage)));
    };

    const handleProgressBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setSeeking(true);
        handleProgressBarClick(e);
    };

    const handleProgressBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (seeking) {
            handleProgressBarClick(e);
        }
    };

    const handleProgressBarMouseUp = () => {
        setSeeking(false);
    };

    useEffect(() => {
        if (seeking) {
            const handleMouseUp = () => setSeeking(false);
            window.addEventListener('mouseup', handleMouseUp);
            return () => window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [seeking]);

    return (
        <div
            className={cn(
                'absolute bottom-0 left-0 right-0 z-40',
                'bg-gradient-to-t from-black/90 via-black/50 to-transparent',
                'transition-opacity duration-300',
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onMouseMove={onMouseMove}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Barra de progresso com tempo restante */}
            <div className="px-6 pt-8 pb-2 flex items-center gap-3">
                <div
                    ref={progressBarRef}
                    className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group hover:h-2 transition-all flex-1"
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(played * 100)}
                    aria-label={tA11y('progressBar')}
                    tabIndex={0}
                    onMouseDown={handleProgressBarMouseDown}
                    onMouseMove={handleProgressBarMouseMove}
                    onMouseUp={handleProgressBarMouseUp}
                >
                    {/* Progresso preenchido */}
                    <div
                        className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                        style={{
                            width: `${played * 100}%`,
                            transition: seeking ? 'none' : 'width 0.1s linear'
                        }}
                    />

                    {/* Indicador (bolinha) */}
                    <div
                        className={cn(
                            'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-lg',
                            'transition-all duration-200',
                            'group-hover:w-4 group-hover:h-4 group-hover:shadow-xl',
                            seeking && 'w-4 h-4 shadow-xl'
                        )}
                        style={{
                            left: `calc(${played * 100}% - ${seeking ? '8px' : '6px'})`,
                            transition: seeking ? 'none' : 'left 0.1s linear'
                        }}
                    />
                </div>

                {/* Tempo restante */}
                <span className="text-xs text-white/70 font-mono whitespace-nowrap">
                    -{formatTime(duration - playedSeconds)}
                </span>
            </div>

            {/* Controles principais */}
            <div className="flex items-center justify-between px-6 pb-4 gap-4">
                {/* Controles da esquerda */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Play/Pause */}
                    <button
                        onClick={onPlayPause}
                        className="text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={playing ? t('pause') : t('play')}
                    >
                        {ended ? (
                            <div className="flex items-center gap-2">
                                <Play className="w-6 h-6" aria-hidden="true" />
                                <span className="text-sm">{t('playAgain')}</span>
                            </div>
                        ) : playing ? (
                            <Pause className="w-6 h-6" aria-hidden="true" />
                        ) : (
                            <Play className="w-6 h-6" aria-hidden="true" />
                        )}
                    </button>

                    {/* Retroceder 10 segundos */}
                    <button
                        onClick={onSkipBackward}
                        className="text-white hover:scale-110 transition-transform p-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t('skipBack')}
                    >
                        <RotateCcw className="w-6 h-6" aria-hidden="true" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            10
                        </span>
                    </button>

                    {/* Avançar 10 segundos */}
                    <button
                        onClick={onSkipForward}
                        className="text-white hover:scale-110 transition-transform p-2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={t('skipForward')}
                    >
                        <RotateCw className="w-6 h-6" aria-hidden="true" />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                            10
                        </span>
                    </button>

                    {/* Volume com slider horizontal */}
                    <div
                        className="relative group flex items-center"
                        onMouseEnter={handleVolumeMouseEnter}
                        onMouseLeave={handleVolumeMouseLeave}
                    >
                        <button
                            onClick={onMuteToggle}
                            className="text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={muted ? t('unmute') : t('mute')}
                        >
                            {muted || volume === 0 ? (
                                <VolumeX className="w-6 h-6" aria-hidden="true" />
                            ) : volume < 0.5 ? (
                                <Volume1 className="w-6 h-6" aria-hidden="true" />
                            ) : (
                                <Volume2 className="w-6 h-6" aria-hidden="true" />
                            )}
                        </button>

                        {/* Slider horizontal estilo YouTube */}
                        <div
                            className={cn(
                                'absolute left-full ml-2 flex items-center transition-all duration-300',
                                showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
                            )}
                        >
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={muted ? 0 : volume}
                                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                    [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform
                                    [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
                                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0
                                    [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                                style={{
                                    background: `linear-gradient(to right, ${COLORS.danger} 0%, ${COLORS.danger} ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                                aria-label={t('volumeControl')}
                            />
                        </div>
                    </div>
                </div>

                {/* Título centralizado */}
                {title && (
                    <div className="flex-1 flex items-center justify-center min-w-0 px-4">
                        <h2 className="text-white text-base font-semibold truncate text-center select-none">
                            {title}
                        </h2>
                    </div>
                )}

                {/* Controles da direita */}
                <div className="flex items-center gap-1 relative flex-shrink-0">
                    {/* Legendas e Áudio */}
                    <div className="relative" ref={subtitlesMenuRef}>
                        <button
                            onClick={() => {
                                closeAllMenus();
                                setShowSubtitlesMenu(!showSubtitlesMenu);
                            }}
                            className={cn(
                                'text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                showSubtitlesMenu && 'text-red-400'
                            )}
                            aria-label={availableAudioTracks.length > 1 ? t('subtitlesAndAudio') : t('subtitles')}
                            aria-haspopup="menu"
                            title={availableAudioTracks.length > 1 ? t('subtitlesAndAudio') : t('subtitles')}
                        >
                            <Captions className="w-6 h-6" aria-hidden="true" />
                        </button>

                        {/* Menu de legendas e áudio */}
                        {showSubtitlesMenu && (
                            <div className={cn(
                                "absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/[0.08] z-50",
                                availableAudioTracks.length > 1 ? "min-w-[420px]" : "min-w-[200px]"
                            )} style={{ background: GRADIENTS.playerControls }}>
                                <div className="py-3 px-3">
                                    <div className="flex gap-4">
                                        {/* Seção de Legendas */}
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5 px-1">
                                                <Captions className="w-3.5 h-3.5" aria-hidden="true" />
                                                {t('subtitles')}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    onSubtitleChange(null);
                                                    setShowSubtitlesMenu(false);
                                                }}
                                                className={cn(
                                                    'w-full px-3 py-2.5 flex items-center justify-between transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                    !subtitlesEnabled || !currentSubtitle
                                                        ? 'text-primary bg-white/[0.06]'
                                                        : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                                                )}
                                            >
                                                <span className="text-sm">{t('disabled')}</span>
                                                {(!subtitlesEnabled || !currentSubtitle) && <Check size={14} className="text-primary" aria-hidden="true" />}
                                            </button>
                                            {availableSubtitles.map((subtitle) => (
                                                <button
                                                    key={subtitle.language}
                                                    onClick={() => {
                                                        onSubtitleChange(subtitle.language);
                                                        setShowSubtitlesMenu(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-3 py-2.5 flex items-center justify-between transition-all rounded-xl mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                        subtitlesEnabled && currentSubtitle === subtitle.language
                                                            ? 'text-primary bg-white/[0.06]'
                                                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                                                    )}
                                                >
                                                    <span className="text-sm">{subtitle.label}</span>
                                                    {subtitlesEnabled && currentSubtitle === subtitle.language && <Check size={14} className="text-primary" aria-hidden="true" />}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Seção de Áudio - SOMENTE se houver múltiplas faixas */}
                                        {availableAudioTracks.length > 1 && (
                                            <>
                                                {/* Divisor vertical */}
                                                <div className="border-l border-white/[0.06]" />

                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5 px-1">
                                                        <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                        {t('audio')}
                                                    </p>
                                                    {availableAudioTracks.map((track) => (
                                                        <button
                                                            key={track.language}
                                                            onClick={() => {
                                                                onAudioTrackChange(track.language);
                                                                setShowSubtitlesMenu(false);
                                                            }}
                                                            className={cn(
                                                                'w-full px-3 py-2.5 flex items-center justify-between transition-all rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                                currentAudioTrack === track.language
                                                                    ? 'text-primary bg-white/[0.06]'
                                                                    : 'text-gray-300 hover:bg-white/[0.06] hover:text-white',
                                                                availableAudioTracks.indexOf(track) > 0 && 'mt-1'
                                                            )}
                                                        >
                                                            <span className="text-sm">{track.label}</span>
                                                            {currentAudioTrack === track.language && <Check size={14} className="text-primary" aria-hidden="true" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Qualidade - Só mostra se houver qualidades disponíveis */}
                    {qualities.length > 0 && (
                        <div className="relative" ref={qualityMenuRef}>
                            <button
                                onClick={() => {
                                    closeAllMenus();
                                    setShowQualityMenu(!showQualityMenu);
                                }}
                                className={cn(
                                    'text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                    showQualityMenu && 'text-red-400'
                                )}
                                aria-label={t('quality')}
                                aria-haspopup="menu"
                                title={t('quality')}
                            >
                                <Settings className="w-6 h-6" aria-hidden="true" />
                            </button>

                            {/* Menu de qualidade */}
                            {showQualityMenu && (
                                <div className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden min-w-[160px] shadow-2xl shadow-black/60 border border-white/[0.08] z-50" style={{ background: GRADIENTS.playerControls }}>
                                    <div className="py-3 px-3">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5 px-1">
                                            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                                            {t('quality')}
                                        </p>
                                        {qualities.map((quality) => {
                                            const getQualityIcon = (q: string) => {
                                                if (q === 'auto') return <Sparkles className="w-4 h-4" aria-hidden="true" />;
                                                if (q === '1080p' || q === '4K') return <Monitor className="w-4 h-4" aria-hidden="true" />;
                                                if (q === '720p') return <Tv className="w-4 h-4" aria-hidden="true" />;
                                                return <Smartphone className="w-4 h-4" aria-hidden="true" />;
                                            };

                                            return (
                                                <button
                                                    key={quality}
                                                    onClick={() => {
                                                        onQualityChange(quality);
                                                        setShowQualityMenu(false);
                                                    }}
                                                    className={cn(
                                                        'w-full px-3 py-2.5 flex items-center gap-2.5 transition-all rounded-xl mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                        currentQuality === quality
                                                            ? 'text-primary bg-white/[0.06]'
                                                            : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                                                    )}
                                                >
                                                    {getQualityIcon(quality)}
                                                    <span className="text-sm font-medium flex-1 text-left">{quality}</span>
                                                    {currentQuality === quality && <Check size={14} className="text-primary" aria-hidden="true" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Velocidade */}
                    <div className="relative" ref={speedMenuRef}>
                        <button
                            onClick={() => {
                                closeAllMenus();
                                setShowSpeedMenu(!showSpeedMenu);
                            }}
                            className={cn(
                                'text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                showSpeedMenu && 'text-red-400'
                            )}
                            aria-label={t('speed')}
                            aria-haspopup="menu"
                            title={t('speed')}
                        >
                            <Gauge className="w-6 h-6" aria-hidden="true" />
                        </button>

                        {/* Menu de velocidade */}
                        {showSpeedMenu && (
                            <div className="absolute bottom-full right-0 mb-2 rounded-2xl overflow-hidden min-w-[140px] shadow-2xl shadow-black/60 border border-white/[0.08] z-50" style={{ background: GRADIENTS.playerControls }}>
                                <div className="py-3 px-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2.5 font-semibold flex items-center gap-1.5 px-1">
                                        <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                                        {t('speed')}
                                    </p>
                                    {playbackRates.map((rate) => {
                                        const getSpeedIcon = (r: number) => {
                                            if (r < 1) return <Turtle className="w-4 h-4" aria-hidden="true" />;
                                            if (r === 1) return <Play className="w-4 h-4" aria-hidden="true" />;
                                            return <Rabbit className="w-4 h-4" aria-hidden="true" />;
                                        };

                                        return (
                                            <button
                                                key={rate}
                                                onClick={() => {
                                                    onPlaybackRateChange(rate);
                                                    setShowSpeedMenu(false);
                                                }}
                                                className={cn(
                                                    'w-full px-3 py-2.5 flex items-center gap-2.5 transition-all rounded-xl mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                    playbackRate === rate
                                                        ? 'text-primary bg-white/[0.06]'
                                                        : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                                                )}
                                            >
                                                {getSpeedIcon(rate)}
                                                <span className="text-sm font-medium flex-1 text-left">{rate === 1 ? t('normal') : `${rate}x`}</span>
                                                {playbackRate === rate && <Check size={14} className="text-primary" aria-hidden="true" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fullscreen */}
                    <button
                        onClick={onFullscreenToggle}
                        className="text-white hover:scale-110 transition-transform p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                        title={fullscreen ? t('exitFullscreen') : t('fullscreen')}
                    >
                        {fullscreen ? (
                            <Minimize className="w-6 h-6" aria-hidden="true" />
                        ) : (
                            <Maximize className="w-6 h-6" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
}

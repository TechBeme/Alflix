import { useState, useRef, useCallback, useEffect, RefObject } from 'react';
import { SITE_LANGUAGE } from '@/lib/config';

export interface VideoQuality {
    label: string;
    url: string;
}

export interface VideoSubtitle {
    label: string;
    language: string;
    src: string;
}

export interface AudioTrack {
    label: string;
    language: string;
}

export interface UseVideoPlayerOptions {
    onProgress?: (progress: { played: number; playedSeconds: number }) => void;
    onEnded?: () => void;
    autoPlay?: boolean;
    startTime?: number;
    qualities?: VideoQuality[];
    defaultQuality?: string;
    subtitles?: VideoSubtitle[];
    audioTracks?: AudioTrack[];
    onQualityChange?: (quality: string, url: string) => void;
    /** Ativar legendas por padrão (da preferência do usuário) */
    defaultSubtitlesEnabled?: boolean;
    /** Idioma preferido para legendas (da preferência do usuário) */
    preferredSubtitleLang?: string;
}

export interface UseVideoPlayerReturn {
    // Player ref (ReactPlayer v3 ref aponta para HTMLVideoElement)
    playerRef: RefObject<HTMLVideoElement | null>;

    // States
    playing: boolean;
    volume: number;
    muted: boolean;
    played: number;
    playedSeconds: number;
    duration: number;
    playbackRate: number;
    currentQuality: string;
    availableQualities: string[];
    currentSubtitle: string | null;
    availableSubtitles: VideoSubtitle[];
    currentAudioTrack: string;
    availableAudioTracks: AudioTrack[];
    showControls: boolean;
    fullscreen: boolean;
    buffering: boolean;
    ended: boolean;
    subtitlesEnabled: boolean;
    setPlaying: (playing: boolean) => void;

    // Actions
    togglePlay: () => void;
    setVolume: (value: number) => void;
    toggleMute: () => void;
    seek: (value: number) => void;
    skipForward: (seconds?: number) => void;
    skipBackward: (seconds?: number) => void;
    setPlaybackRate: (rate: number) => void;
    setQuality: (quality: string) => void;
    toggleFullscreen: () => void;
    toggleSubtitles: () => void;
    setSubtitle: (language: string | null) => void;
    setAudioTrack: (language: string) => void;
    handleProgress: (state: { played: number; playedSeconds: number; loadedSeconds: number }) => void;
    handleDurationChange: (duration: number) => void;
    handleEnded: () => void;
    handleWaiting: () => void;
    handleBufferEnd: () => void;
    setShowControls: (show: boolean) => void;
    setBuffering: (buffering: boolean) => void;
}

/**
 * Hook customizado para gerenciar a lógica do player de vídeo
 * Fornece controles completos, estados e handlers para o VideoPlayer
 */
export function useVideoPlayer({
    onProgress,
    onEnded,
    autoPlay = false,
    startTime = 0,
    qualities = [],
    defaultQuality = 'auto',
    subtitles = [],
    audioTracks = [],
    onQualityChange,
    defaultSubtitlesEnabled = false,
    preferredSubtitleLang = SITE_LANGUAGE,
}: UseVideoPlayerOptions = {}): UseVideoPlayerReturn {
    const playerRef = useRef<HTMLVideoElement | null>(null);

    // Estados do player
    const [playing, setPlaying] = useState(autoPlay);
    const [volume, setVolumeState] = useState(0.8);
    const [muted, setMuted] = useState(autoPlay); // Mute if autoPlay is enabled
    const [played, setPlayed] = useState(0);
    const [playedSeconds, setPlayedSeconds] = useState(startTime);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentQuality, setCurrentQuality] = useState(defaultQuality);
    const [availableQualities, setAvailableQualities] = useState<string[]>(
        qualities.map(q => q.label)
    );
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [availableSubtitles] = useState<VideoSubtitle[]>(subtitles);
    const [currentAudioTrack, setCurrentAudioTrack] = useState<string>(
        audioTracks.length > 0 ? audioTracks[0].language : ''
    );
    const [availableAudioTracks] = useState<AudioTrack[]>(audioTracks);
    const [showControls, setShowControls] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const [ended, setEnded] = useState(false);
    const [subtitlesEnabled, setSubtitlesEnabled] = useState(defaultSubtitlesEnabled);

    // Controle de timeout para ocultar controles
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const seekingRef = useRef(false);

    // Auto-hide controls after 4 seconds of inactivity (increased for better UX)
    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        setShowControls(true);

        if (playing) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 4000); // 4 seconds instead of 3
        }
    }, [playing]);

    // Keep controls visible when video is paused
    useEffect(() => {
        if (!playing) {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            setShowControls(true);
        }
    }, [playing]);

    // Auto-selecionar legenda quando preferência do usuário ativa legendas por padrão
    useEffect(() => {
        if (defaultSubtitlesEnabled && availableSubtitles.length > 0) {
            setSubtitlesEnabled(true);
            if (!currentSubtitle) {
                // Usar idioma preferido do usuário, fallback para primeira disponível
                const preferred = availableSubtitles.find(s => s.language === preferredSubtitleLang);
                setCurrentSubtitle(preferred ? preferred.language : availableSubtitles[0].language);
            }
        }
    }, [defaultSubtitlesEnabled, preferredSubtitleLang, availableSubtitles, currentSubtitle]);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    // Seek para o tempo inicial quando o componente monta
    useEffect(() => {
        if (playerRef.current && startTime > 0) {
            try {
                // Em v3, playerRef.current JÁ É o elemento <video>
                playerRef.current.currentTime = startTime;
            } catch (err) {
                console.error('Erro ao buscar tempo inicial:', err);
            }
        }
    }, [startTime]);

    // Tentativa de autoplay (com fallback se bloqueado pelo navegador)
    useEffect(() => {
        if (!autoPlay) return;

        let mounted = true;
        const timer = setTimeout(() => {
            if (mounted) {
                setPlaying(true);
            }
        }, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [autoPlay]);

    // Actions
    const togglePlay = useCallback(() => {
        setPlaying((prev) => !prev);
        setEnded(false);
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const setVolume = useCallback((value: number) => {
        setVolumeState(value);
        if (value > 0) {
            setMuted(false);
        }
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const toggleMute = useCallback(() => {
        setMuted((prev) => !prev);
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const seek = useCallback((value: number) => {
        if (playerRef.current && duration > 0) {
            seekingRef.current = true;
            try {
                // Em v3, playerRef.current JÁ É o elemento <video>
                // value é uma fração (0-1), converter para segundos
                playerRef.current.currentTime = value * duration;
                setPlayed(value);
                setEnded(false);
            } catch (err) {
                console.error('Erro ao buscar posição:', err);
            } finally {
                // Reset seeking flag após um delay
                setTimeout(() => {
                    seekingRef.current = false;
                }, 100);
            }
        }
        resetControlsTimeout();
    }, [resetControlsTimeout, duration]);

    const skipForward = useCallback((seconds: number = 10) => {
        if (playerRef.current && duration > 0) {
            const newTime = Math.min(playedSeconds + seconds, duration);
            try {
                // Em v3, playerRef.current JÁ É o elemento <video>
                playerRef.current.currentTime = newTime;
            } catch (err) {
                console.error('Erro ao avançar:', err);
            }
        }
        resetControlsTimeout();
    }, [playedSeconds, duration, resetControlsTimeout]);

    const skipBackward = useCallback((seconds: number = 10) => {
        if (playerRef.current) {
            const newTime = Math.max(playedSeconds - seconds, 0);
            try {
                // Em v3, playerRef.current JÁ É o elemento <video>
                playerRef.current.currentTime = newTime;
            } catch (err) {
                console.error('Erro ao voltar:', err);
            }
        }
        resetControlsTimeout();
    }, [playedSeconds, resetControlsTimeout]);

    const setQuality = useCallback((quality: string) => {
        const newQuality = qualities.find(q => q.label === quality);
        if (newQuality && onQualityChange) {
            // Salvar tempo atual antes de trocar
            const currentTime = playerRef.current?.currentTime || playedSeconds;

            // Notificar a troca de qualidade (o componente pai vai trocar a URL)
            onQualityChange(quality, newQuality.url);

            // Atualizar estado
            setCurrentQuality(quality);

            // Retomar do mesmo ponto após a troca
            setTimeout(() => {
                if (playerRef.current && currentTime > 0) {
                    playerRef.current.currentTime = currentTime;
                    if (playing) {
                        playerRef.current.play().catch(() => { });
                    }
                }
            }, 100);
        } else {
            // Se não tiver URL diferente, apenas atualiza o estado (mesmo comportamento anterior)
            setCurrentQuality(quality);
        }
        resetControlsTimeout();
    }, [qualities, onQualityChange, playedSeconds, playing, resetControlsTimeout]);

    const toggleFullscreen = useCallback(() => {
        const element = document.getElementById('video-player-container');

        if (!element) return;

        if (!fullscreen) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            }
            setFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            setFullscreen(false);
        }
        resetControlsTimeout();
    }, [fullscreen, resetControlsTimeout]);

    const toggleSubtitles = useCallback(() => {
        setSubtitlesEnabled((prev) => !prev);

        // Se estiver desabilitando, remove legenda ativa
        if (subtitlesEnabled) {
            setCurrentSubtitle(null);
        } else if (availableSubtitles.length > 0 && !currentSubtitle) {
            // Se estiver habilitando e não tiver legenda selecionada, usa idioma preferido
            const preferredSubtitle = availableSubtitles.find(s => s.language === preferredSubtitleLang);
            setCurrentSubtitle(preferredSubtitle ? preferredSubtitle.language : availableSubtitles[0].language);
        }

        resetControlsTimeout();
    }, [subtitlesEnabled, availableSubtitles, currentSubtitle, preferredSubtitleLang, resetControlsTimeout]);

    const setSubtitle = useCallback((language: string | null) => {
        setCurrentSubtitle(language);
        setSubtitlesEnabled(language !== null);
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const setAudioTrack = useCallback((language: string) => {
        setCurrentAudioTrack(language);
        // Nota: A troca de áudio em HTML5 video requer múltiplas tags <source> ou HLS manifest
        // Por enquanto, apenas atualizamos o estado (implementação completa requer HLS.js)
        resetControlsTimeout();
    }, [resetControlsTimeout]);

    const handleProgress = useCallback((state: { played: number; playedSeconds: number; loadedSeconds?: number }) => {
        // Sempre atualiza o progresso (o ReactPlayer já gerencia isso corretamente)
        setPlayed(state.played);
        setPlayedSeconds(state.playedSeconds);

        // Se o vídeo está tocando, não está em buffering
        if (playing && state.playedSeconds > 0) {
            setBuffering(false);
        }

        if (onProgress) {
            onProgress({ played: state.played, playedSeconds: state.playedSeconds });
        }
    }, [onProgress, playing]);

    const handleDurationChange = useCallback((duration: number) => {

        setDuration(duration);
    }, []);

    const handleEnded = useCallback(() => {
        setEnded(true);
        setPlaying(false);

        if (onEnded) {
            onEnded();
        }
    }, [onEnded]);

    const handleWaiting = useCallback(() => {
        setBuffering(true);
    }, []);

    const handleBufferEnd = useCallback(() => {
        setBuffering(false);
    }, []);

    // Listener para fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Log temporário para debug
    useEffect(() => {
        // Duration state updated
    }, [duration]);

    return {
        playerRef,
        playing,
        volume,
        muted,
        played,
        playedSeconds,
        duration,
        playbackRate,
        currentQuality,
        availableQualities,
        currentSubtitle,
        availableSubtitles,
        currentAudioTrack,
        availableAudioTracks,
        showControls,
        fullscreen,
        buffering,
        ended,
        subtitlesEnabled,
        togglePlay,
        setVolume,
        toggleMute,
        seek,
        skipForward,
        skipBackward,
        setPlaybackRate,
        setQuality,
        toggleFullscreen,
        toggleSubtitles,
        setSubtitle,
        setAudioTrack,
        handleProgress,
        handleDurationChange,
        handleEnded,
        handleWaiting,
        handleBufferEnd,
        setShowControls,
        setBuffering,
        setPlaying,
    };
}

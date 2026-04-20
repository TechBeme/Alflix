'use client';

import { useState, useRef } from 'react';
import Image, { type ImageProps } from 'next/image';
import { getPlaceholderImage } from '@/lib/image-utils';

/**
 * Contextos de imagem pré-configurados com sizes responsivos otimizados.
 * Cada contexto mapeia para breakpoints reais do layout.
 */
export const IMAGE_SIZES = {
    /** Poster em MediaCard dentro de MediaRow (scroll horizontal) */
    poster: '(max-width: 768px) 160px, 192px',
    /** Poster em grid de busca / catálogo */
    posterGrid: '(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, (max-width: 1280px) 18vw, 15vw',
    /** Backdrop hero (full-width acima do fold) */
    heroBackdrop: '100vw',
    /** Thumbnail de episódio */
    episodeThumbnail: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    /** Perfil de ator (cast grid) */
    castProfile: '(max-width: 640px) 120px, (max-width: 768px) 140px, 160px',
    /** Logo / ícone pequeno (streaming providers, etc.) */
    icon: '48px',
    /** Poster continue watching */
    continueWatching: '(max-width: 768px) 256px, 288px',
    /** Poster em resultados de busca rápida (SearchModal) */
    searchResult: '64px',
} as const;

export type ImageSizeContext = keyof typeof IMAGE_SIZES;

export interface OptimizedImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
    /** Contexto da imagem para sizes responsivos automáticos */
    sizeContext?: ImageSizeContext;
    /** Placeholder blur (padrão: 'blur') */
    placeholder?: 'blur' | 'empty';
    /** Custom blur data URL */
    blurDataURL?: string;
}

/** BlurDataURL padrão minimalista (1x1 pixel cinza escuro, ~120 bytes) */
const DEFAULT_BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bvLayAAAAAElFTkSuQmCC";

/** Timeout de carregamento (15s) */
const IMAGE_LOAD_TIMEOUT_MS = 15_000;

/**
 * OptimizedImage - Wrapper production-grade do Next.js Image
 * 
 * Features:
 * - Blur placeholder automático para todas as imagens
 * - Sizes responsivos pré-configurados por contexto (sizeContext)
 * - Timeout de 15s com fallback para placeholder SVG
 * - Tratamento robusto de erros de carregamento
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src={getPosterUrl(movie.poster_path)}
 *   alt={movie.title}
 *   fill
 *   sizeContext="poster"
 * />
 * ```
 */
export default function OptimizedImage({
    src,
    alt,
    sizeContext,
    sizes,
    quality = 75,
    placeholder = 'blur',
    blurDataURL,
    onLoad,
    onError,
    ...props
}: OptimizedImageProps) {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Resolver sizes: prop explícita > sizeContext > undefined (Next.js default)
    const resolvedSizes = sizes || (sizeContext ? IMAGE_SIZES[sizeContext] : undefined);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // Chamar callback original preservando o tipo
        if (onLoad && typeof onLoad === 'function') {
            (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
        }
    };

    const handleImageError = () => {
        if (!hasError) {
            setHasError(true);
            setImageSrc(getPlaceholderImage());
        }
        if (onError && typeof onError === 'function') {
            (onError as () => void)();
        }
    };

    const handleImageStart = () => {
        timeoutRef.current = setTimeout(() => {
            if (!hasError) {
                console.warn(`[OptimizedImage] Timeout (${IMAGE_LOAD_TIMEOUT_MS}ms): ${typeof src === 'string' ? src : 'image'}`);
                handleImageError();
            }
        }, IMAGE_LOAD_TIMEOUT_MS);
    };

    return (
        <Image
            src={imageSrc}
            alt={alt}
            sizes={resolvedSizes}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL || DEFAULT_BLUR_DATA_URL}
            onLoadStart={handleImageStart}
            onLoad={handleImageLoad}
            onError={handleImageError}
            {...props}
        />
    );
}
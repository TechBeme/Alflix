/**
 * Image Utilities for TMDB
 * Funções helper para gerar URLs de imagens do TMDB otimizadas por contexto
 */

type TMDBImageSize =
    | 'w92'
    | 'w154'
    | 'w185'
    | 'w342'
    | 'w500'
    | 'w780'
    | 'w1280'
    | 'original';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Gera URL completa para imagem do TMDB
 * 
 * @param path - Caminho da imagem retornado pela API do TMDB (ex: /xyz123.jpg)
 * @param size - Tamanho da imagem desejado (padrão: 'w500')
 * @returns URL completa da imagem ou placeholder se path for null
 * 
 * @example
 * ```tsx
 * <Image 
 *   src={getTMDBImageUrl(movie.poster_path, 'w500')} 
 *   alt={movie.title} 
 * />
 * ```
 */
export function getTMDBImageUrl(
    path: string | null | undefined,
    size: TMDBImageSize = 'w500'
): string {
    if (!path) {
        return getPlaceholderImage();
    }

    // Validar se o path está bem formado
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${TMDB_IMAGE_BASE_URL}/${size}${cleanPath}`;
}

/**
 * Gera URL para poster de mídia
 * Usa w500 (ideal para cards ~200px com retina 2x)
 */
export function getPosterUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w500');
}

/**
 * Gera URL para poster pequeno (search results, thumbnails)
 * Usa w342 para menor payload em contextos compactos
 */
export function getPosterSmallUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w342');
}

/**
 * Gera URL para backdrop de mídia (hero sections, backgrounds)
 * Usa w1280 em vez de original para balancear qualidade e performance.
 * A diferença visual é imperceptível mas o payload é ~60% menor.
 */
export function getBackdropUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w1280');
}

/**
 * Gera URL para backdrop de mídia em tamanho full (fallback ou impressão)
 */
export function getBackdropOriginalUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'original');
}

/**
 * Gera URL para thumbnail de episódio
 * Usa w500 (ideal para aspect-ratio 16:9 em ~400px viewport)
 */
export function getEpisodeThumbnailUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w500');
}

/**
 * Gera URL para foto de perfil de ator (cast grid)
 * Usa w185 (ideal para grid de ~160px max)
 */
export function getCastProfileUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w185');
}

/**
 * Gera URL para ícone/logo de streaming provider
 * Usa w92 (menor tamanho disponível - ideal para ícones 48px)
 */
export function getProviderLogoUrl(path: string | null | undefined): string {
    return getTMDBImageUrl(path, 'w92');
}

/**
 * Gera URL de imagem placeholder quando não há imagem disponível
 * 
 * @param width - Largura da imagem placeholder (padrão: 500)
 * @param height - Altura da imagem placeholder (padrão: 750)
 * @param text - Texto a ser exibido no placeholder (padrão: 'No Image')
 * @returns URL do placeholder como data URL (SVG inline)
 */
export function getPlaceholderImage(
    width: number = 500,
    height: number = 750,
    text: string = 'No Image'
): string {
    // SVG inline como data URL - não requer requisição externa
    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#0a0a0a"/>
            <text 
                x="50%" 
                y="50%" 
                dominant-baseline="middle" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="20" 
                fill="#666"
            >${text}</text>
        </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Gera múltiplas URLs em diferentes tamanhos para srcSet
 * Útil para imagens responsivas
 * 
 * @param path - Caminho da imagem
 * @param sizes - Array de tamanhos desejados
 * @returns Objeto com URLs em diferentes tamanhos
 * 
 * @example
 * ```tsx
 * const urls = getResponsiveImageUrls(movie.poster_path);
 * <img 
 *   src={urls.w500}
 *   srcSet={`${urls.w342} 342w, ${urls.w500} 500w, ${urls.w780} 780w`}
 * />
 * ```
 */
export function getResponsiveImageUrls(
    path: string | null | undefined,
    sizes: TMDBImageSize[] = ['w342', 'w500', 'w780']
): Record<string, string> {
    const urls: Record<string, string> = {};

    sizes.forEach(size => {
        urls[size] = getTMDBImageUrl(path, size);
    });

    return urls;
}

/**
 * Verifica se uma imagem existe e está acessível
 * 
 * @param url - URL da imagem a ser verificada
 * @returns Promise<boolean> - true se a imagem existe, false caso contrário
 */
export async function checkImageExists(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeout);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Gera URL de imagem do TMDB com fallback automático para placeholder
 * Esta função tenta verificar se a imagem existe antes de retornar a URL
 * 
 * @param path - Caminho da imagem do TMDB
 * @param size - Tamanho da imagem
 * @returns Promise<string> - URL da imagem ou placeholder
 */
export async function getTMDBImageUrlWithFallback(
    path: string | null | undefined,
    size: TMDBImageSize = 'w500'
): Promise<string> {
    if (!path) {
        return getPlaceholderImage();
    }

    const imageUrl = getTMDBImageUrl(path, size);

    // Verificar se a imagem existe
    const exists = await checkImageExists(imageUrl);

    return exists ? imageUrl : getPlaceholderImage();
}

/**
 * Extrai o ID da imagem do caminho TMDB
 * 
 * @param path - Caminho da imagem (ex: /xyz123.jpg)
 * @returns ID da imagem sem barra e extensão
 */
export function extractImageId(path: string | null | undefined): string | null {
    if (!path) return null;
    return path.replace(/^\//, '').replace(/\.[^.]+$/, '');
}

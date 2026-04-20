'use client';

import { useSearchParams } from 'next/navigation';
import SearchInfinite from './SearchInfinite';

/**
 * SearchPageClient - Client Component Otimizado
 * 
 * Responsabilidades:
 * 1. Receber gêneros via props (SSR)
 * 2. Ler query params da URL (ex: /search?q=matrix)
 * 3. Delegar para SearchInfinite (faz 1 requisição: /api/search)
 * 
 * Autenticação:
 * - Via cookies (Better Auth automático)
 * - /api/search retorna 401 se não autenticado
 * - SearchInfinite redireciona para login se necessário
 * 
 * Performance:
 * - Gêneros: vem via SSR (cache 24h)
 * - Watchlist: incluída na resposta do /api/search
 * - Total: 1 requisição por busca
 */

interface Genre {
    id: number;
    name: string;
}

interface SearchPageClientProps {
    genresData: Genre[];
}

export default function SearchPageClient({ genresData }: SearchPageClientProps) {
    // Ler query params da URL (quick search redireciona para /search?q=...)
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    return (
        <SearchInfinite
            initialQuery={query}
            initialFilter="all"
            initialSession={null}
            initialResults={null}
            genresData={genresData}
            initialAdvancedFilters={{}}
        />
    );
}

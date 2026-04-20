/// <reference lib="webworker" />

/**
 * Service Worker - AllFlix PWA
 *
 * Estratégia de cache:
 * - Network First: páginas HTML (conteúdo dinâmico sempre atualizado)
 * - Cache First: assets estáticos (JS, CSS, fontes, imagens)
 * - Stale While Revalidate: API do TMDB (imagens de posters/backdrops)
 * - Offline fallback: página dedicada quando sem conexão
 *
 * Production-grade com versionamento, limpeza de caches antigos e
 * tratamento robusto de erros.
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `allflix-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `allflix-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `allflix-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets estáticos para pre-cache (App Shell)
const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/favicon.ico',
    '/logo.png',
    '/favicon-96x96.png',
    '/favicon-192x192.png',
    '/favicon-512x512.png',
];

// Limites de cache para evitar uso excessivo de storage
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 200;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Limita o número de itens num cache, removendo os mais antigos
 */
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        return trimCache(cacheName, maxItems);
    }
}

/**
 * Verifica se uma URL é uma requisição de navegação (página HTML)
 */
function isNavigationRequest(request) {
    return (
        request.mode === 'navigate' ||
        (request.method === 'GET' &&
            request.headers.get('accept')?.includes('text/html'))
    );
}

/**
 * Verifica se uma URL é um asset estático
 */
function isStaticAsset(url) {
    return (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/_next/image') ||
        url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)
    );
}

/**
 * Verifica se uma URL é uma fonte (prioridade alta de cache)
 */
function isFont(url) {
    return url.pathname.match(/\.(woff2?|ttf|otf|eot)$/);
}

/**
 * Verifica se uma URL é uma imagem do TMDB
 */
function isTmdbImage(url) {
    return url.hostname === 'image.tmdb.org';
}

/**
 * Verifica se uma URL é uma imagem local
 */
function isLocalImage(url) {
    return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/);
}

/**
 * Verifica se uma requisição deve ser ignorada pelo SW
 */
function shouldSkip(url) {
    return (
        // APIs internas (sempre fresh)
        url.pathname.startsWith('/api/') ||
        // Better Auth routes
        url.pathname.startsWith('/api/auth/') ||
        // Next.js HMR / dev
        url.pathname.startsWith('/_next/webpack-hmr') ||
        // Chrome extensions
        url.protocol === 'chrome-extension:' ||
        // Analytics, tracking
        url.hostname.includes('google-analytics') ||
        url.hostname.includes('googletagmanager') ||
        // Manifest (sempre fresh para atualizações)
        url.pathname === '/manifest.webmanifest'
    );
}

// ─── Install Event ─────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                // Pre-cache assets essenciais (fail silently para assets opcionais)
                return Promise.allSettled(
                    PRECACHE_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Failed to precache: ${url}`, err);
                        })
                    )
                );
            })
            .then(() => {
                // Ativa imediatamente sem esperar tabs fecharem
                return self.skipWaiting();
            })
    );
});

// ─── Activate Event ────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                // Remove caches de versões anteriores
                const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
                return Promise.all(
                    cacheNames
                        .filter((name) => !validCaches.includes(name))
                        .map((name) => {
                            console.log(`[SW] Removing old cache: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                // Assume controle de todas as tabs imediatamente
                return self.clients.claim();
            })
    );
});

// ─── Fetch Event ───────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar requisições que não devem ser cacheadas
    if (shouldSkip(url)) return;

    // Apenas GET requests
    if (event.request.method !== 'GET') return;

    // ── Strategy: Imagens TMDB → Stale While Revalidate ──
    if (isTmdbImage(url)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(async (cache) => {
                const cached = await cache.match(event.request);
                const networkRequest = new Request(event.request.url, {
                    mode: 'cors',
                    credentials: 'omit',
                });
                const fetchPromise = fetch(networkRequest)
                    .then((response) => {
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                            trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_ITEMS);
                        }
                        return response;
                    })
                    .catch(() => cached);

                return cached || fetchPromise;
            })
        );
        return;
    }

    // ── Strategy: Assets estáticos → Cache First ──
    if (isStaticAsset(url) || isLocalImage(url)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;

                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200) return response;

                        const responseClone = response.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                        return response;
                    })
                    .catch(() => {
                        // Para imagens falhadas, retorna resposta vazia transparente
                        if (isLocalImage(url)) {
                            return new Response('', {
                                headers: { 'Content-Type': 'image/svg+xml' },
                            });
                        }
                        return new Response('', { status: 408 });
                    });
            })
        );
        return;
    }

    // ── Strategy: Páginas HTML → Passthrough (sem cache no SW) ──
    // A Vercel CDN já faz cache de HTML na edge com invalidação automática.
    // Cachear HTML no SW causava double-render/flicker porque o SW servia
    // a versão cacheada e depois a versão fresh chegava, re-renderizando a página.
    // Agora o SW só intercepta navigation requests quando offline.
    if (isNavigationRequest(event.request)) {
        event.respondWith(
            fetch(event.request).catch(async () => {
                // Offline fallback — tentar página offline pré-cacheada
                const offlinePage = await caches.match(OFFLINE_URL);
                if (offlinePage) return offlinePage;

                return new Response('Offline', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' },
                });
            })
        );
        return;
    }

    // ── Strategy: Outros requests → Network First com fallback ──
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(event.request, responseClone);
                        trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

// ─── Message Event ─────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data === 'GET_VERSION') {
        event.ports[0]?.postMessage({ version: CACHE_VERSION });
    }

    // Limpar todos os caches (útil para debugging)
    if (event.data === 'CLEAR_CACHES') {
        caches.keys().then((names) => {
            Promise.all(names.map((name) => caches.delete(name))).then(() => {
                event.ports[0]?.postMessage({ cleared: true });
            });
        });
    }
});

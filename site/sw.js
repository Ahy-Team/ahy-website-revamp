// UNIFIED Service Worker - Optimized for Mobile & Desktop with LCP Priority
// Adaptive caching strategies based on device capabilities

const CACHE_NAME = "ahy-cache-v5"; // Bump version for LCP optimization
const GSAP_CACHE_NAME = "ahy-gsap-v5";

const PRECACHE_URLS = [
    "/",
    "/index.html",
];

// GSAP files that benefit from aggressive caching
const GSAP_FILES = [
    "/js/gsap.min.js",
    "/js/ScrollTrigger.min.js",
    "/js/ScrollSmoother.min.js",
    "/js/SplitText.min.js",
    "/js/ScrambleTextPlugin.min.js",
    "/js/MotionPath.min.js",
    "/js/circletype.min.js",
    "/js/ScrollToPlugin.min.js"
];

// Detect if request is from mobile device
function isMobileRequest(request) {
    const ua = request.headers.get('user-agent') || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

self.addEventListener("install", (event) => {
    self.skipWaiting();
    
    event.waitUntil(
        Promise.all([
            // Precache static assets
            caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)),
            // Precache GSAP files immediately
            caches.open(GSAP_CACHE_NAME).then(async (cache) => {
                const promises = GSAP_FILES.map(async (url) => {
                    try {
                        const response = await fetch(url, { redirect: 'follow' });
                        if (response.ok) await cache.put(url, response);
                    } catch (e) {
                        console.log('[SW] Failed to precache:', url);
                    }
                });
                await Promise.all(promises);
            })
        ])
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME && cache !== GSAP_CACHE_NAME) {
                            return caches.delete(cache);
                        }
                    }),
                );
            }),
        ]),
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (!url.protocol.startsWith("http")) return;

    const isMobile = isMobileRequest(event.request);

    // ⚡ CRITICAL LCP OPTIMIZATION: Bypass service worker for blob images
    // These are LCP candidates and need immediate browser discovery
    if (url.pathname.includes('/assets/blobs-')) {
        // Don't intercept - let browser handle with native priority
        return;
    }

    // GSAP files: Ultra-fast cache-first with background revalidate
    if (GSAP_FILES.some(path => url.pathname.endsWith(path))) {
        event.respondWith(gsapCacheStrategy(event.request));
        return;
    }

    // Static assets & components
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|mp4|webm|avif|webp)$/) || 
        url.pathname.includes("/components/") || 
        url.pathname.includes("/assets/")) {
        
        // Mobile: More aggressive caching
        if (isMobile) {
            event.respondWith(cacheFirstStrategy(event.request));
        } else {
            // Desktop: Cache-first with faster revalidation
            event.respondWith(cacheFirstWithRevalidate(event.request));
        }
        return;
    }

    // HTML pages: Device-aware strategy
    if (event.request.mode === "navigate") {
        if (isMobile) {
            // Mobile: More aggressive stale-while-revalidate
            event.respondWith(staleWhileRevalidateStrategy(event.request, true));
        } else {
            // Desktop: Standard stale-while-revalidate
            event.respondWith(staleWhileRevalidateStrategy(event.request, false));
        }
        return;
    }

    // Default: Network first
    event.respondWith(fetch(event.request));
});

/* ===============================
   Caching Strategies
   =============================== */

// Cache-first (standard)
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) return cached;
    
    try {
        const response = await fetch(request, { redirect: 'follow' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        console.error('[SW] Fetch failed:', request.url);
        return cached || new Response('Offline', { status: 503 });
    }
}

// Cache-first with background revalidation (desktop)
async function cacheFirstWithRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        // Return cached immediately
        const response = cached.clone();
        
        // Revalidate in background (non-blocking)
        fetch(request, { redirect: 'follow' })
            .then(networkResponse => {
                if (networkResponse.ok) {
                    cache.put(request, networkResponse);
                }
            })
            .catch(() => {});
        
        return response;
    }
    
    // Not in cache, fetch and cache
    try {
        const response = await fetch(request, { redirect: 'follow' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        console.error('[SW] Fetch failed:', request.url);
        throw err;
    }
}

// GSAP-specific: Ultra-fast cache-first
async function gsapCacheStrategy(request) {
    const cache = await caches.open(GSAP_CACHE_NAME);
    const cached = await cache.match(request);
    
    // Return cached immediately (zero delay)
    if (cached) {
        // Revalidate in background for next time
        fetch(request, { redirect: 'follow' }).then(response => {
            if (response.ok) cache.put(request, response);
        }).catch(() => {});
        
        return cached;
    }
    
    // Fetch and cache if not found
    try {
        const response = await fetch(request, { redirect: 'follow' });
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        console.error('[SW] GSAP fetch failed:', request.url);
        throw err;
    }
}

// Stale-while-revalidate (adaptive for mobile/desktop)
async function staleWhileRevalidateStrategy(request, aggressiveCache = false) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request, { redirect: 'follow' })
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);
    
    // Mobile: Return cache immediately if available (aggressive)
    if (aggressiveCache && cached) {
        return cached;
    }
    
    // Desktop: Race between cache and network (with cache preference)
    return cached || fetchPromise;
}

/* ===============================
   Message Handler
   =============================== */

self.addEventListener('message', async (event) => {
    if (event.data.type === 'PREFETCH_GSAP') {
        const cache = await caches.open(GSAP_CACHE_NAME);
        const results = await Promise.all(
            GSAP_FILES.map(async (url) => {
                const cached = await cache.match(url);
                if (cached) return { url, status: 'cached' };
                
                try {
                    const response = await fetch(url, { redirect: 'follow' });
                    if (response.ok) {
                        await cache.put(url, response);
                        return { url, status: 'fetched' };
                    }
                    return { url, status: 'error' };
                } catch (e) {
                    return { url, status: 'error', error: e.message };
                }
            })
        );
        
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'PREFETCH_COMPLETE',
                results
            });
        });
    }
    
    // Handle cache clear request
    if (event.data.type === 'CLEAR_CACHE') {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

/* ===============================
   Background Sync (for offline support)
   =============================== */

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-assets') {
        event.waitUntil(syncAssets());
    }
});

async function syncAssets() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const updates = requests.map(async (request) => {
        try {
            const response = await fetch(request, { redirect: 'follow' });
            if (response.ok) {
                await cache.put(request, response);
            }
        } catch (e) {
            // Silently fail - offline or network error
        }
    });
    
    await Promise.all(updates);
}
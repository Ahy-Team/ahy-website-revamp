const CACHE_NAME = "ahy-cache-v3";
const GSAP_CACHE_NAME = "ahy-gsap-v3"; // Separate cache for GSAP files

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

    // GSAP files: Cache-first with background revalidate
    if (GSAP_FILES.some(path => url.pathname.endsWith(path))) {
        event.respondWith(gsapCacheStrategy(event.request));
        return;
    }

    // Static assets & components: Cache-first
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|mp4|webm|avif|webp)$/) || 
        url.pathname.includes("/components/") || 
        url.pathname.includes("/assets/")) {
        
        event.respondWith(cacheFirstStrategy(event.request));
        return;
    }

    // HTML pages: Stale-while-revalidate
    if (event.request.mode === "navigate") {
        event.respondWith(staleWhileRevalidateStrategy(event.request));
        return;
    }

    // Default: Network first
    event.respondWith(fetch(event.request));
});

// Cache-first with optional background update
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

// GSAP-specific: Ultra-fast cache-first, revalidate in background
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

// Stale-while-revalidate for HTML
async function staleWhileRevalidateStrategy(request) {
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
    
    return cached || fetchPromise;
}

// Message handler from Web Worker / Main thread
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
});
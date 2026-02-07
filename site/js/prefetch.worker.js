// prefetch.worker.js - Runs in separate thread, zero main thread impact

console.log('[PrefetchWorker] Worker loaded');

const GSAP_FILES = [
    '/js/gsap.min.js',
    '/js/ScrollTrigger.min.js',
    '/js/ScrollSmoother.min.js',
    '/js/SplitText.min.js',
    '/js/ScrambleTextPlugin.min.js',
    '/js/MotionPath.min.js',
    '/js/circletype.min.js',
    '/js/ScrollToPlugin.min.js'
];

const COMPONENT_ASSETS = [
    '/components/hero',
    '/components/aboutUs',
    '/components/header',
    '/css/components/hero.css',
    '/css/components/aboutUs.css',
    '/css/components/header.css'
];

let isPrefetching = false;

self.addEventListener('message', async (event) => {
    const { type, priority } = event.data;

    console.log('[PrefetchWorker] Message received:', event.data);

    switch (type) {
        case 'PREFETCH_GSAP':
            if (isPrefetching) {
                console.log('[PrefetchWorker] GSAP prefetch already running — skipped');
                return;
            }
            isPrefetching = true;
            await prefetchGSAP();
            break;

        case 'PREFETCH_COMPONENTS':
            await prefetchComponents(priority || 'low');
            break;

        case 'CHECK_CACHE_STATUS':
            const status = await checkCacheStatus();
            console.log('[PrefetchWorker] Cache status checked:', status);
            self.postMessage({ type: 'CACHE_STATUS', status });
            break;

        default:
            console.warn('[PrefetchWorker] Unknown message type:', type);
    }
});

async function prefetchGSAP() {
    console.log('[PrefetchWorker] Starting GSAP prefetch');

    const startTime = performance.now();
    const results = [];

    if (typeof caches !== 'undefined') {
        try {
            const cache = await caches.open('ahy-gsap-v3');
            console.log('[PrefetchWorker] Cache opened: ahy-gsap-v3');

            await Promise.all(
                GSAP_FILES.map(async (url) => {
                    try {
                        const cached = await cache.match(url);

                        if (cached) {
                            console.log('[PrefetchWorker] Cache hit:', url);
                            results.push({ url, status: 'cached', size: 0 });
                            return;
                        }

                        console.log('[PrefetchWorker] Fetching:', url);

                        const response = await fetch(url, {
                            credentials: 'same-origin',
                            cache: 'no-cache'
                        });

                        if (!response.ok) {
                            console.warn('[PrefetchWorker] Fetch failed:', url, response.status);
                            results.push({ url, status: 'error' });
                            return;
                        }

                        await cache.put(url, response.clone());
                        const blob = await response.blob();

                        console.log('[PrefetchWorker] Cached:', url, `(${blob.size} bytes)`);

                        results.push({
                            url,
                            status: 'fetched',
                            size: blob.size
                        });
                    } catch (e) {
                        console.error('[PrefetchWorker] Error processing:', url, e);
                        results.push({ url, status: 'error', error: e.message });
                    }
                })
            );
        } catch (e) {
            console.error('[PrefetchWorker] Cache API failure:', e);
        }
    } else {
        console.warn('[PrefetchWorker] Cache API unavailable — warming HTTP cache only');

        await Promise.all(
            GSAP_FILES.map((url) =>
                fetch(url, { mode: 'no-cors' })
                    .then(() => console.log('[PrefetchWorker] Warmed HTTP cache:', url))
                    .catch(() => console.warn('[PrefetchWorker] Warm failed:', url))
            )
        );
    }

    const duration = Math.round(performance.now() - startTime);
    const totalSize = results.reduce((acc, r) => acc + (r.size || 0), 0);

    console.log('[PrefetchWorker] GSAP prefetch complete', {
        duration: `${duration}ms`,
        totalSize,
        results
    });

    self.postMessage({
        type: 'PREFETCH_COMPLETE',
        assetType: 'gsap',
        results,
        duration,
        totalSize
    });

    isPrefetching = false;
}

async function prefetchComponents(priority) {
    console.log('[PrefetchWorker] Prefetching components, priority:', priority);

    if (priority === 'low' && 'requestIdleCallback' in self) {
        console.log('[PrefetchWorker] Waiting for idle time');
        await new Promise((resolve) => {
            self.requestIdleCallback(resolve, { timeout: 5000 });
        });
    }

    const results = await Promise.all(
        COMPONENT_ASSETS.map(async (url) => {
            try {
                console.log('[PrefetchWorker] Fetching component:', url);
                const response = await fetch(url, { credentials: 'same-origin' });
                return { url, status: response.ok ? 'fetched' : 'error' };
            } catch (e) {
                console.error('[PrefetchWorker] Component fetch error:', url, e);
                return { url, status: 'error' };
            }
        })
    );

    console.log('[PrefetchWorker] Component prefetch complete:', results);

    self.postMessage({
        type: 'PREFETCH_COMPLETE',
        assetType: 'components',
        results
    });
}

async function checkCacheStatus() {
    if (typeof caches === 'undefined') {
        console.warn('[PrefetchWorker] Cache API not available');
        return { available: false };
    }

    try {
        const cache = await caches.open('ahy-gsap-v3');
        const keys = await cache.keys();
        const cachedUrls = keys.map((req) => req.url);

        const status = {
            available: true,
            cached: GSAP_FILES.filter((f) =>
                cachedUrls.some((url) => url.endsWith(f))
            ),
            missing: GSAP_FILES.filter((f) =>
                !cachedUrls.some((url) => url.endsWith(f))
            )
        };

        return status;
    } catch (e) {
        console.error('[PrefetchWorker] Cache status error:', e);
        return { available: false, error: e.message };
    }
}
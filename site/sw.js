// Service Worker
// Strategy:
//   - HTML pages, app JS, CSS, and /components/  -> NETWORK FIRST
//     (a deploy is visible on the next normal reload; cache is only an offline fallback)
//   - GSAP libs, fonts, images, video            -> CACHE FIRST + background revalidate
//     (heavy, rarely-changing assets stay fast)
//
// Bump CACHE_VERSION on every deploy so old caches are deleted on activate.

const CACHE_VERSION = "v7";
const CACHE_NAME = `ahy-cache-${CACHE_VERSION}`;
const GSAP_CACHE_NAME = `ahy-gsap-${CACHE_VERSION}`;

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

// Heavy, rarely-changing assets that are safe to serve cache-first.
// NOTE: JS/CSS are intentionally NOT here — they must be network-first so edits show up.
function isStaticAsset(url) {
    return /\.(png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|mp4|webm)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
    self.skipWaiting();

    // Only precache the heavy static libs; HTML/JS/CSS are fetched fresh at runtime.
    event.waitUntil(
        caches.open(GSAP_CACHE_NAME).then(async (cache) => {
            await Promise.all(
                GSAP_FILES.map(async (url) => {
                    try {
                        const response = await fetch(url, { redirect: "follow" });
                        if (response.ok) await cache.put(url, response);
                    } catch (e) {
                        console.log("[SW] Failed to precache:", url);
                    }
                })
            );
        })
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Delete every cache that isn't the current version.
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== GSAP_CACHE_NAME)
                        .map((name) => caches.delete(name))
                )
            ),
        ])
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (!url.protocol.startsWith("http")) return;
    if (event.request.method !== "GET") return;

    // LCP blob images: let the browser handle with native priority.
    if (url.pathname.includes("/assets/blobs-")) return;

    // GSAP libs: cache-first + background revalidate.
    if (GSAP_FILES.some((path) => url.pathname.endsWith(path))) {
        event.respondWith(cacheFirstRevalidate(event.request, GSAP_CACHE_NAME));
        return;
    }

    // Images / fonts / video, and anything under /assets/: cache-first + background revalidate.
    if (isStaticAsset(url) || url.pathname.includes("/assets/")) {
        event.respondWith(cacheFirstRevalidate(event.request, CACHE_NAME));
        return;
    }

    // HTML, CSS, JS and /components/ are intentionally NOT handled by the service
    // worker. They go straight to the network (freshness is handled by versioned
    // URLs in the component loader), so a deploy is visible on a normal reload.
    return;
});

/* ===============================
   Caching Strategies
   =============================== */

// Cache-first with background revalidation: instant load, refreshed for next time.
async function cacheFirstRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        fetch(request, { redirect: "follow" })
            .then((response) => {
                if (response && response.ok) cache.put(request, response);
            })
            .catch(() => {});
        return cached;
    }

    try {
        const response = await fetch(request, { redirect: "follow" });
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        return new Response("Offline", { status: 503 });
    }
}

/* ===============================
   Message Handler
   =============================== */

self.addEventListener("message", async (event) => {
    if (event.data && event.data.type === "PREFETCH_GSAP") {
        const cache = await caches.open(GSAP_CACHE_NAME);
        const results = await Promise.all(
            GSAP_FILES.map(async (url) => {
                const cached = await cache.match(url);
                if (cached) return { url, status: "cached" };
                try {
                    const response = await fetch(url, { redirect: "follow" });
                    if (response.ok) {
                        await cache.put(url, response);
                        return { url, status: "fetched" };
                    }
                    return { url, status: "error" };
                } catch (e) {
                    return { url, status: "error", error: e.message };
                }
            })
        );

        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({ type: "PREFETCH_COMPLETE", results });
        });
    }

    // Manual cache clear.
    if (event.data && event.data.type === "CLEAR_CACHE") {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));

        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({ type: "CACHE_CLEARED" });
        });
    }
});

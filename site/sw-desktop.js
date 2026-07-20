// sw-desktop.js
// The service worker caches ONLY heavy, rarely-changing assets:
//   - images, fonts, video, and anything under /assets/  -> CACHE FIRST + background revalidate
// HTML, CSS, JS and /components/ are NOT handled here — they go straight to the
// network so a deploy is visible on a normal reload (freshness for those is
// handled by versioned URLs in the component loader).
// Bump CACHE_VERSION on every deploy so old caches are deleted on activate.

const CACHE_VERSION = "v5";
const CACHE_NAME = `ahy-cache-desktop-${CACHE_VERSION}`;

function isStaticAsset(url) {
    return /\.(png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|mp4|webm)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
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

    // Images / fonts / video, and anything under /assets/: cache-first + background revalidate.
    if (isStaticAsset(url) || url.pathname.includes("/assets/")) {
        event.respondWith(cacheFirstRevalidate(event.request, CACHE_NAME));
        return;
    }

    // HTML, CSS, JS and /components/ are intentionally NOT handled — straight to network.
    return;
});

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

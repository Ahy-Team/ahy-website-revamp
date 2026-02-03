const CACHE_NAME = "ahy-cache-v3"; // ✅ Bump version to force cache refresh
const PRECACHE_URLS = [
    "/",
    "/index.html",
];

self.addEventListener("install", (event) => {
    // Install immediately
    self.skipWaiting();

    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
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

    // Skip non-http requests
    if (!url.protocol.startsWith("http")) return;

    // 1. Cache First for Static Assets & Components
    //    ✅ NOW CACHES THE FINAL RESPONSE AFTER REDIRECTS
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|mp4|webm|avif|webp)$/) || 
        url.pathname.includes("/components/") || 
        url.pathname.includes("/assets/")) {
        
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // ✅ Follow redirects automatically
                return fetch(event.request, {
                    redirect: 'follow'
                }).then((networkResponse) => {
                    // ✅ Cache the FINAL response (after all redirects)
                    if (!networkResponse || networkResponse.status !== 200) {
                        return networkResponse;
                    }

                    // Clone and cache
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(err => {
                    console.error('Fetch failed for:', event.request.url, err);
                    // Return from cache if network fails
                    return caches.match(event.request);
                });
            }),
        );
        return;
    }

    // 2. Stale-While-Revalidate for HTML Pages
    //    Provides instant load (if cached) while updating in background
    if (event.request.mode === "navigate" && !url.pathname.includes("/components/")) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request, {
                    redirect: 'follow'  // ✅ Follow redirects for HTML too
                })
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch((err) => {
                        console.log("Network fetch failed for page", err);
                        return cachedResponse; // Fallback to cache
                    });

                return cachedResponse || fetchPromise;
            }),
        );
        return;
    }

    // 3. Network First for everything else (API calls, etc.)
    event.respondWith(fetch(event.request));
});
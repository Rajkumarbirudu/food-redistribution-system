const CACHE_NAME = "aura-food-pwa-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico"
];

// Install: Cache essential assets and immediately take over
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching latest app shell assets for v2...");
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

// Activate: Purge ALL previous caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[SW] Purging old cache:", name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler: Network-first for HTML, Stale-While-Revalidate for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache API or dynamic endpoints
  if (url.pathname.startsWith("/api") || url.port === "8000" || url.hostname.includes("onrender.com")) {
    return;
  }

  // Network-First for Navigation / HTML pages to ensure users always get the latest layout
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match("/index.html") || caches.match("/"))
    );
    return;
  }

  // Stale-While-Revalidate for other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});

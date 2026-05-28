// Mira service worker — static-first for /_next/static, network-first for documents,
// with offline fallback. Cache name is versioned for easy invalidation.

const CACHE_VERSION = "mira-static-v1";
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isDocument(req) {
  return req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/uploads/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isDocument(req)) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // opportunistically cache successful HTML responses (small)
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (_) {
          const cached = await caches.match(req);
          if (cached) return cached;
          return (await caches.match(OFFLINE_URL)) || new Response("offline", { status: 503 });
        }
      })()
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch (_) {
          return (await caches.match(OFFLINE_URL)) || new Response("offline", { status: 503 });
        }
      })()
    );
  }
});

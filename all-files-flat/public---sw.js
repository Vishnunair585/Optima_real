const CACHE_NAME = "airank-cache-v1";
const STATIC_CACHE = "airank-static-v1";
const IMAGE_CACHE = "airank-images-v1";
const API_CACHE = "airank-api-v1";

const PRECACHE_URLS: string[] = [];

const API_CACHE_REGEX = /^\/api\//;
const IMAGE_REGEX = /\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/;
const STATIC_REGEX = /\.(js|css|woff2?|ttf|json)$/;

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE && key !== IMAGE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (STATIC_REGEX.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 86400));
    return;
  }

  if (IMAGE_REGEX.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 604800));
    return;
  }

  if (API_CACHE_REGEX.test(url.pathname)) {
    event.respondWith(networkFirst(request, API_CACHE, 60));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHE_NAME, 0));
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAME, 60));
});

async function cacheFirst(request: Request, cacheName: string, maxAgeSeconds: number): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cacheAge = getCacheAge(cached);
    if (cacheAge < maxAgeSeconds) return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      cache.put(request, cloned);
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request: Request, cacheName: string, maxAgeSeconds: number): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cacheAge = getCacheAge(cached);
      if (maxAgeSeconds === 0 || cacheAge < maxAgeSeconds) return cached;
    }
    if (request.mode === "navigate") {
      return caches.match("/offline.html") || new Response("Offline", { status: 503 });
    }
    return new Response("Offline", { status: 503 });
  }
}

function getCacheAge(response: Response): number {
  const date = response.headers.get("date");
  if (!date) return 0;
  return (Date.now() - new Date(date).getTime()) / 1000;
}

export {};

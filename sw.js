const CACHE = "ud-assets-v1";
const SCOPE = self.registration.scope;
const STATIC = /\.(webp|avif|png|jpe?g|svg|woff2?)$/i;
const DATA = /\/(characters|maps)\.json$|\/guides\//;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit);
  return hit || fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin || !url.href.startsWith(SCOPE)) return;
  if (STATIC.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (DATA.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

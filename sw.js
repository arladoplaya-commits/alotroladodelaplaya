/* Service worker mínimo: red primero, caché de respaldo (offline) */
const CACHE = "aolp-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["./", "./images/logo.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches
          .open(CACHE)
          .then((cache) => cache.put(req, copy))
          .catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});

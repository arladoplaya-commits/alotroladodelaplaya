/* Service worker mínimo: red primero, caché de respaldo (offline) */
const CACHE = "aolp-v2";

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
  // Solo archivos del propio sitio: Supabase, GitHub, etc. siempre a la red
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // No guardar errores (404/500) ni respuestas parciales
        if (res.ok && res.status === 200) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});

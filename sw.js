/* Service worker: la web abre rápido y funciona sin conexión
   · Fotos, fuentes y archivos de la web (_next): se muestran al instante
     desde el teléfono y se actualizan por detrás para la próxima visita.
   · Páginas y datos (menu.json…): red primero, caché si no hay conexión. */
const CACHE = "aolp-v3";

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

function save(req, res) {
  // No guardar errores (404/500) ni respuestas parciales
  if (res.ok && res.status === 200) {
    const copy = res.clone();
    caches
      .open(CACHE)
      .then((cache) => cache.put(req, copy))
      .catch(() => {});
  }
  return res;
}

function isStatic(url) {
  return (
    /\/_next\/static\//.test(url.pathname) ||
    /\.(?:jpe?g|png|webp|gif|svg|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith("http")) return;
  const url = new URL(req.url);
  // Solo archivos del propio sitio: Supabase, GitHub, etc. siempre a la red
  if (url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    // Caché al instante + actualización en segundo plano
    event.respondWith(
      caches.match(req).then((hit) => {
        const fresh = fetch(req)
          .then((res) => save(req, res))
          .catch(() => hit || Response.error());
        if (hit) {
          event.waitUntil(fresh.catch(() => {}));
          return hit;
        }
        return fresh;
      })
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => save(req, res))
      .catch(() =>
        caches
          .match(req)
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("./") : undefined))
          .then((hit) => hit || Response.error())
      )
  );
});

# 🌊 Al Otro Lado de la Playa — carta digital del shack

Carta web del restaurante de playa: menú con capas de ingredientes, pedidos por
WhatsApp, reseñas, clientes registrados con avisos (apertura, cierre, productos
nuevos) y panel de administración oculto.

Stack: **Next.js 16 + TypeScript + Tailwind 4 + Zustand (localStorage)** —
funciona sin servidor; la nube (Supabase) y las fotos en GitHub son opcionales.

---

## 📱 Lo que ve el cliente

| Sección | Cómo se llega |
|---|---|
| 🌊 Menú | barra inferior «Menú» · buscador, categorías, destacados, reseñas, galería |
| ❤️ Favoritos | barra inferior «Favoritos» o la píldora ❤️ — se guardan en el teléfono |
| 🛒 Carrito | barra inferior «Carrito» — nombre, dirección y confirmación por WhatsApp |
| 🔔 Avisos | campanita: apertura/cierre del local y productos nuevos (opt-in) |
| 🌙 Modo atardecer | botón luna/sol del encabezado (tema oscuro cálido, persistente) |
| 👤 Cliente de la marea | «Hazte cliente»: nombre, gustos guardados, nº de socio |

Los avisos funcionan en 3 niveles, según lo que actives:

1. **Campanita (siempre)**: el aviso queda guardado en la bandeja de la app.
2. **Notificación del navegador**: botón «Activar notificaciones» del perfil.
3. **Web Push real (opcional)**: si configuraste Supabase + VAPID, llega aunque
   la carta esté cerrada. Ver «Supabase» más abajo.

## 🔒 Acceso al panel de administración

> **Toca el logo 3 veces seguidas** (en menos de ~1 segundo entre toques).

- Contraseña inicial: `playa2026` (cámbiala en Ajustes).
- También puedes abrir `#/admin` en la URL.
- El panel gestiona: abierto/cerrado, «¿hay hoy?», productos, agregos,
  pedidos, reseñas, avisos a clientes, publicación en GitHub y ajustes.

## 🗂️ Estructura

```
src/
  app/            layout, página con enrutado por hash (#/ y #/admin)
  components/
    menu/         carta, secciones favoritos/carrito, cliente, avisos…
    admin/        panel (Hoy, Productos, Agregos, Pedidos, Reseñas,
                  Publicar, Ajustes)
  lib/            stores zustand, supabase (REST), push (VAPID), pedidos
  data/seed.json  menú inicial (30 productos · 7 categorías)
public/
  images/         logo, fotos de productos, fotos del shack, iconos PWA
  sw.js           service worker (offline + preparado para push)
```

## 📸 Fotos: GitHub

Las fotos viven en `public/images/` y se suben con el repo:

1. Crea el repo en GitHub y sube el proyecto (sin `node_modules` ni `.next`).
2. **Cambiar fotos**: reemplaza los JPG en
   `public/images/products/` (productos) y `public/images/shack/` (galería),
   manteniendo el mismo nombre de archivo. Nada más que editar.
3. **Datos de la carta en GitHub**: el panel (Publicar) puede guardar el
   `menu.json` en un repo con la GitHub Contents API (token con permiso
   `repo`). Así todos los dispositivos cargan la misma versión del menú.
4. **Sitio público gratis**: GitHub Pages / Vercel / Netlify funcionan igual,
   porque la app es estática y guarda todo en el navegador del cliente.

## ☁️ Supabase: datos guardados y notificaciones push

La carta funciona 100% sin nube. Cuando quieras compartir datos entre
dispositivos (pedidos, reseñas, clientes, avisos):

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Abre el panel de la app (3 toques en el logo) → **Reseñas → Conectar nube**
   y pega la URL del proyecto y la `anon public` key.
3. En Supabase → **SQL Editor**, ejecuta el SQL completo que la misma app te
   muestra ahí (botón «Ver SQL»). Crea estas tablas:

   | Tabla | Para qué |
   |---|---|
   | `reviews` | reseñas de clientes |
   | `orders` | pedidos confirmados |
   | `panel_pass` | contraseña del panel con bcrypt |
   | `customers` | **clientes registrados** (nombre, socio, gustos) |
   | `push_subscriptions` | suscripciones Web Push de cada teléfono |
   | `announcements` | **avisos**: apertura, cierre, producto nuevo |

4. **Avisar a los clientes**: panel → **Hoy → 📣 Avisos a los clientes**:
   «Avisar que abrimos», «Avisar que cerramos» o anunciar un producto nuevo.
   Los clientes lo reciben en la campanita y como notificación del navegador.

### Push real (opcional, recomendado)

Las notificaciones del navegador solo llegan con la carta abierta. Para push
de verdad:

1. Genera las claves: `npx web-push generate-vapid-keys`
2. Pega la clave **pública** en `.env` como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   (o pégala en el dispositivo con
   `localStorage.setItem("aol-vapid-key", "...")`).
3. Despliega la app (Vercel/Netlify/Pages). Cuando un cliente toque
   «Activar notificaciones», su suscripción se guarda en
   `push_subscriptions` de Supabase.
4. Para **enviar** el push desde `announcements` necesitas un pequeño
   servidor/edge function con la clave privada + `web-push`
   (Supabase Edge Functions es la opción más simple).

## 🧪 Desarrollo

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
bunx tsc --noEmit
```

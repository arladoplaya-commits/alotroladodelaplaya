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

- Contraseña de fábrica: `playa2026`. **Cámbiala en Ajustes nada más ejecutar el
  SQL de Supabase**: se guarda cifrada en la nube y es la misma en todos los
  teléfonos. Sin conexión solo se puede entrar en un teléfono que ya entró antes.
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

> **Ya conectado:** la carta trae la nube del negocio en `src/lib/cloud-config.ts`
> (URL + clave `sb_publishable_…`), así que todos los teléfonos guardan pedidos
> y reseñas solos. Solo falta ejecutar el SQL (paso 3) **una vez**.
> Para cambiar de proyecto: edita ese archivo o define
> `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY` en Netlify.
> Nunca pongas ahí la clave *secret* / *service_role*.

La carta funciona 100% sin nube. Cuando quieras compartir datos entre
dispositivos (pedidos, reseñas, clientes, avisos):

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Abre el panel de la app (3 toques en el logo) → **Reseñas → Conectar nube**
   y pega la URL del proyecto y la clave pública (`sb_publishable_…`, o la antigua `anon` que empieza por `eyJ`).
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

## ✨ Novedades (septiembre 2026)

### Para el cliente
- **Quitar ingredientes**: al armar un pedido, «¿Le quitamos algo?» →
  *Sin mostaza*, *Sin ketchup*… Se ve en el carrito y llega a WhatsApp en
  MAYÚSCULAS para que la cocina no lo pase por alto. Solo se quitan salsas,
  vegetales y toppings (la base del plato no).
- **Recuerda sus gustos**: si la última vez pidió sin mostaza, la próxima vez
  ese producto ya sale sin mostaza (puede desmarcarlo).
- **Entrega por zonas y forma de pago**: a domicilio (elige zona, se suma la
  mensajería) o recogida en el local; paga en efectivo, Transfermóvil,
  EnZona… Los datos de pago (tarjeta, teléfono) se copian con un toque.
- **Combos y ofertas** con «Ahorras $X», **Menú del día** arriba de la carta
  y productos **«Se acabó hoy»** que se actualizan solos cada ~90 s.
- **Horario visible**: «Cierra a las 11:30 pm» / «Abrimos hoy a las 7 pm (en 2 h)».
- **Modo Noche de playa** (interruptor ☀️/🌙 de la postal): cielo añil, luna,
  luciérnagas y mar que brilla.
- **Modo ligero automático**: la carta mira el teléfono y la conexión. Si puede,
  va con todas las animaciones; se aligera sola con «Ahorro de datos», 2G/3G,
  teléfonos de ≤2 GB de RAM o 2 núcleos, batería <20 % sin cargar, o si en el
  primer segundo va a menos de 40 cuadros/s. Solo entonces aparece la etiqueta
  «⚡ Modo ligero · motivo · ver animaciones».
- **Abierto/cerrado según el horario** (Entrega y pago → Horario): la etiqueta
  de la carta y los avisos «¡Abrimos!/Cerramos» a los clientes registrados
  siguen el horario solos. En **Hoy**, el interruptor sirve para *cerrar hoy*
  aunque sea horario.
- Precios en **MN**.

### Para el negocio (panel)
| Pestaña | Qué configuras |
|---|---|
| **Hoy** | abierto/cerrado, ¿hay hoy?, **🍽️ Menú del día** (título, nota, productos) |
| **Combos** | crear/editar combos: productos, cantidades y precio (te dice cuánto ahorra el cliente) |
| **Entrega y pago** | domicilio y/o recogida, **zonas con precio de mensajería**, **formas de pago** con sus datos, **horario semanal** automático |
| **Publicar** | **Código QR** de la carta + cartel PNG para imprimir; publicar el menú |
| **Ajustes** | nombre, **número de WhatsApp**, contraseña… |

> Todo se guarda al momento en el teléfono del panel. Para que lo vean los
> clientes: **Publicar → Publicar menú ahora**.
> La contraseña del panel **ya no se publica** en `menu.json`.

## ☁️ Guardado automático en GitHub

Una vez puestos en **Publicar** el usuario, el repo y el token de GitHub, cada
cambio del panel (precios, agotados, combos, horario…) **se sube solo** unos
15 segundos después de dejar de editar. Varios cambios seguidos se suben
juntos. En la cabecera del panel se ve el estado: *Cambios sin subir…* →
*Guardado en GitHub* (o *No se pudo guardar · Reintentar*). Se puede apagar en
**Publicar → Guardado automático**. Cada subida redespliega la web en Netlify
(~1 min), por eso se agrupan los cambios.

## 📄 Carta en PDF (una hoja A4)

Solo en el panel: **Publicar → 📄 Carta en PDF**:
muestra la hoja con la estética de la web (postal, colores, fuentes, 3 columnas,
combos, agregos, QR, mensajería y pagos). La letra se ajusta sola para que todo
quepa en **una sola hoja**. «Descargar PDF» abre la ventana de imprimir: elige
**Guardar como PDF** (en el móvil: Compartir/Imprimir → Guardar como PDF).

## 🚀 Publicar en Vercel (y el QR)

1. Sube este proyecto a un repo de GitHub (sin `node_modules` ni `.next`).
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el
   repo → **Deploy** (Vercel detecta Next.js solo; no hace falta configurar).
3. Abre `https://tu-proyecto.vercel.app/#/admin` (o 3 toques al logo).
4. **Publicar**: pon tu usuario/repo de GitHub y un token para que el panel
   guarde `public/data/menu.json`. Cada publicación actualiza la carta de
   todos en ~1 minuto (se lee de GitHub y, tras el redeploy, del propio sitio).
5. **Código QR**: en **Publicar → Código QR** el QR ya apunta a tu dirección
   de Vercel. Descarga el **cartel para imprimir**. Si luego compras un
   dominio propio, escríbelo en el campo y vuelve a descargar el QR.

## 🧪 Desarrollo

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint
bunx tsc --noEmit
```

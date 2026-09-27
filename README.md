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
- También puedes abrir `/admin` directo en la URL. Es una ruta propia:
  su código nunca se descarga en la carta pública que abren los clientes.
- El panel gestiona: abierto/cerrado, «¿hay hoy?», productos, agregos,
  pedidos, reseñas, avisos a clientes, publicación en GitHub y ajustes.

## 🗂️ Estructura

```
src/
  app/            layout, página de la carta (/) y ruta propia del panel (/admin)
  app/producto/[slug]  página de cada producto (enlace directo + SEO)
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

## 🏷️ Promos, idioma y pedidos rápidos

- **¿Te lo acompañamos?** — al añadir comida, la carta sugiere hasta 3 bebidas o papas disponibles que aún no están en el carrito.
- **Repetir mi último pedido** — en Favoritos y en el carrito vacío. Se rearma con los precios de hoy; lo agotado se salta y se avisa.
- **Tarjeta de fidelidad** (panel → *Promos*, apagada por defecto) — cada pedido enviado suma un sello; al completar la tarjeta el WhatsApp llega con «🎁 PREMIO FIDELIDAD». Los sellos viven en el teléfono del cliente.
- **Cupones** (panel → *Promos*) — código, % o importe fijo, pedido mínimo, encender/apagar. El descuento sale en el carrito y en el WhatsApp. Los códigos viajan con la carta publicada: son para promos, no secretos.
- **Carta en inglés** — botón ES/EN en la postal (se elige solo si el teléfono está en inglés). Nombres y descripciones en inglés se editan en cada producto («🇬🇧 En inglés»). El pedido a la cocina siempre llega en español.

## 🔗 Páginas propias por producto y SEO

- Cada antojo tiene su propia dirección: **`/producto/<nombre-del-antojo>`** (ej. `/producto/la-orilla`). Se puede compartir, tiene su título, descripción y foto para redes/buscadores, y datos estructurados (`schema.org/Product`) para que Google pueda mostrar precio y disponibilidad en el buscador.
- El botón «🛒 Pedir en la carta» de esa página abre el personalizador de ese producto en la app de siempre (no es una tienda aparte: es la misma carta).
- Botón «Compartir este antojo» (y el icono 🔗 en cada tarjeta de la carta) copian o comparten ese enlace directo.
- `/sitemap.xml` y `/robots.txt` se generan solos con todos los productos. Para que las URLs salgan completas (no relativas), pon la dirección del sitio en **panel → Publicar → QR** (el mismo campo que ya usa el QR) o en la variable de entorno `NEXT_PUBLIC_SITE_URL` del hosting.
- La página de producto se sirve directo del archivo `public/data/menu.json` que publicas desde el panel (sin llamadas a la nube): siempre está al día con la carta real, incluso si el producto se agotó o cambió de precio hoy.

## 💳 Minutos/créditos de build gastándose rápido (Netlify)

Cada vez que tocas **«Publicar»** en el panel, la app sube solo
`public/data/menu.json` a GitHub (precios, agotados, horario…). La carta
ya lee ese archivo directo de `raw.githubusercontent.com` al minuto, **sin
esperar ningún despliegue**. Pero por defecto Netlify (y Vercel) reconstruyen
*todo el sitio* con cada push al repositorio, aunque lo único que cambió sea
ese JSON — eso gasta minutos de build de tu plan gratis por algo que no
hacía falta reconstruir.

Ya incluí `netlify.toml` con la regla que le dice a Netlify que se salte el
build cuando el único archivo que cambió es `public/data/menu.json` (si
además subes código de verdad, el build se dispara como siempre). Para que
funcione: sube ese archivo a tu repositorio (va en la raíz del proyecto,
junto a `package.json`) y vuelve a desplegar una vez a mano; de ahí en
adelante, publicar cambios de carta no gasta build.

Si el aviso de Netlify dice que el equipo se quedó sin créditos, esa parte
la controla Netlify, no el código: esperas al próximo ciclo de facturación,
actualizas el plan del equipo, o mientras tanto despliegas esta misma carpeta
en Vercel (ver «Hosting» más abajo) — el sitio funciona igual en cualquiera
de los dos.

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

## 🚀 Publicar gratis, para siempre y sin sustos: GitHub Pages

Desde esta versión la carta se genera como **export estático** (`output:
"export"` en `next.config.ts`): todo el sitio son archivos, sin servidor Node
detrás. Por eso funciona perfecto en **GitHub Pages**, que es gratis para
cualquier uso —incluido comercial—, sin límite de minutos de build ni
sistema de «créditos» que se pueda atascar (a diferencia de lo que pasó con
Netlify).

1. Sube este proyecto a tu repositorio de GitHub (rama `main`).
2. En el repo: **Settings → Pages → Source → GitHub Actions** (una sola vez).
3. El workflow ya incluido (`.github/workflows/deploy-pages.yml`) construye
   y publica la carta solo cuando cambia código de verdad — los «Publicar»
   del panel (que solo tocan `public/data/menu.json`) no disparan un build
   nuevo, porque la carta ya lee ese archivo al instante desde
   `raw.githubusercontent.com`.
4. Con eso, cada `git push` a `main` deja la carta lista en unos 2 minutos en
   `https://<tu-usuario>.github.io/<tu-repo>/`.
5. La subcarpeta (`/<tu-repo>/`) se detecta y aplica sola —el workflow
   pregunta a GitHub Pages si tienes dominio propio o no (`configure-pages`)
   y ajusta todos los enlaces (logo, panel, fotos, compartir, QR) para que
   funcionen igual en cualquiera de los dos casos. Si más adelante añades un
   dominio propio en Settings → Pages, el siguiente `git push` ya sirve la
   carta en la raíz, sin subcarpeta, sin tocar nada más.
6. **Publicar** en el panel: pon tu usuario/repo de GitHub y un token —
   igual que antes, esto no cambió.
7. **Código QR**: pon tu dirección final (con o sin dominio propio) en
   **Publicar → Código QR** y descarga el cartel.

### Otras opciones

- **Netlify**: sigue funcionando (ver más abajo el aviso de créditos) y
  también admite export estático sin cambios.
- **Vercel**: el plan **Hobby es solo para uso no comercial** — no vale para
  una carta de restaurante real. Si prefieres Vercel, hace falta su plan de
  pago (Pro).
- **Cloudflare Pages/Workers**: uso comercial permitido y sin sistema de
  créditos, pero requiere un adaptador distinto (OpenNext/vinext) y no
  admite Turbopack ni leer archivos del disco en cada visita — más trabajo
  de por medio que GitHub Pages. Si lo prefieres, se puede adaptar.

## 🧪 Desarrollo

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # genera el sitio estático en out/
bun run lint
bunx tsc --noEmit
```

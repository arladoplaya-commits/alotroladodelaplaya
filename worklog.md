# Worklog

---
Task ID: 1
Agent: Super Z (main agent)
Task: Continuar con el preview anterior (Al Otro Lado de la Playa) tras reinicio de sesión: recuperar el proyecto del preview antiguo y reconstruirlo en el entorno nuevo.

Work Log:
- Detecté que la sesión arrancó con entorno vacío; el preview anterior (chat-7e693349) seguía activo.
- Extraje del bundle del preview antiguo: seed.json completo (4 categorías, 18 productos con ingredientes, 6 agregos, settings, github sync), mensajes de UI, arquitectura (hash routing #/ y #/admin, Supabase por REST/PostgREST con RPC y bcrypt, outbox offline, GitHub Pages sync, PWA).
- Descargué y restauré todos los assets: logo, 3 iconos PWA, og.jpg, sw.js, 18 fotos de productos → public/.
- Inicialicé entorno fullstack (init-fullstack.sh) con Next.js 16 + Tailwind 4 + shadcn/ui.
- Reconstruí la app completa:
  - src/lib/: types, store (zustand persist aol-menu-v1), cart (aol-cart-v1), reviews (local + caché + outbox + rate limit 45s + seeds), orders (códigos PB-XXXX, outbox), supabase (RPC helpers + SQL_SETUP completo en español).
  - src/components/menu/: menu-view (banderines, sello HECHO AL OTRO LADO, marquee, pills, destacados, barra carrito), customizer-sheet (agregos + notas), exploded-view con ingredient-layers (SVG art para 27 tipos de capa + layerKindFor + KIND_EMOJI), cart-sheet (mensaje WhatsApp idéntico al original), review-sheet (validaciones), reviews-section (promedio, ver todas), beach-scene (palmera, cangrejo, concha, olas, tabla, carrito), pwa-register.
  - src/components/admin/: admin-view (PasswordGate playa2026 + sesión), tab-hoy (¿Hay hoy?, abiertos/cerrados), tab-productos, tab-agregos, tab-pedidos (nuevo→confirmado→entregado/cancelado), tab-resenas (moderación + conectar Supabase + contraseña nube), tab-publicar (GitHub contents API), tab-ajustes (restaurar fábrica).
  - layout con next/font (Lilita One, Epilogue, Plus Jakarta Sans), metadata es_CU, manifest.webmanifest, sw.js network-first.
- Corregí 6 errores de lint (setState en effects → useSyncExternalStore / lazy init).
- Verifiqué con agent-browser: menú, personalizador (capas + agregos $1,200+$250+$400=$1,850), carrito, reseña enviada OK, admin login + tabs Hoy/Reseñas/Ajustes/Publicar, móvil iPhone 14, manifest/sw/ imágenes 200, consola sin errores.

Stage Summary:
- App reconstruida fielmente y verificada end-to-end. Lint limpio (0 errores). Servidor 200 OK.
- Datos idénticos al preview anterior; contraseña del panel: playa2026; WhatsApp pendiente de configurar en Ajustes (como estaba).
- Pendiente para el usuario: decidir siguientes mejoras (nuevo número WhatsApp, más productos, conectar Supabase real, etc.).

---
Task ID: 2
Agent: Super Z (main agent)
Task: Usuario envió 5 capturas para mejorar diseños (no llegaron al servidor: upload/ vacío). Se hizo auditoría de diseño propia con agent-browser y se aplicaron mejoras.

Work Log:
- Verifiqué que las capturas NO llegaron al servidor (upload/ vacío tras múltiples chequeos; mount ossfs sin archivos).
- Auditoría visual completa con agent-browser: menú móvil (390px), desktop (1440px), customizer, carrito, reseñas, admin login. Capturas en audit/.
- BUG encontrado: en ProductRow el texto absoluto "Toca para ver sus capas 👀" se superponía con el badge del precio en TODAS las tarjetas (móvil y desktop).
- Fixes en src/components/menu/menu-view.tsx:
  - Eliminado el texto superpuesto; ahora hay chip "Ver Capas" (icono Layers) sobre la foto, con whitespace-nowrap; en <sm dice "Capas", en sm+ "Ver Capas".
  - Contenedor: sm:max-w-2xl → también lg:max-w-4xl; grid de productos lg:grid-cols-2 (desktop mucho más lleno).
  - Marquesina de fotos más alta en sm+ (h-28 w-44); destacados con imagen sm:h-32.
  - Decoración ambiental fija (fixed, pointer-events-none, hidden lg:block) con palmera, tabla de surf, cangrejo (crab-walk), conchas y carrito a opacidades 0.12-0.18.
  - Barra de carrito lg:max-w-2xl para acompañar el ancho nuevo.
- Sheets (cart-sheet.tsx y customizer-sheet.tsx): padding inferior pb-[calc(1.5rem+env(safe-area-inset-bottom))] — el texto final del carrito ya no se corta.
- Verificado con tsc (sin errores nuevos; los de examples/skills/admin son preexistentes) + eslint limpio + capturas de navegador post-fix (audit/20-25) + consola sin errores.

Stage Summary:
- Diseño móvil más limpio (sin superposición precio/hint) y desktop renovado: 2 columnas, decoración playera ambiental, fotos más grandes.
- Capturas del usuario siguen pendientes: si reenvía, alinear mejoras específicas con su feedback.

---
Task ID: 3
Agent: Super Z (main agent)
Task: Petición del usuario: (1) tema playero de agua en el fondo de las tarjetas de producto, (2) agregar apartado de bebidas (refrescos y malta, jugos y batidos, café) con 12 productos y precios. La captura subida (Screenshot 2026-09-26 023918.png) NO llegó al servidor de nuevo.

Work Log:
- Generé 12 fotos de bebidas con z-ai image CLI (scripts/gen-drinks.sh, estilo fotografía playera consistente) y las convertí a JPG 640px q84 (scripts/convert-drinks.py) → public/images/products/p-{refrescos,malta,cerveza,jugos,malteada,batidos,maracuya,limonada,limonada-brasilena,espresso,cortado,bombon}.jpg.
- seed.json: versión 2→3; +3 categorías (bebidas-refrescos 🥤, bebidas-jugos 🧃, bebidas-cafe ☕) y +12 productos con ingredientes ordenados (el último = vaso como base). Precios: refrescos 600, malta 650, cerveza 650, jugos 700, malteada 850, batidos 900, maracuyá 900, limonada 700, limonada brasileña 850, espresso 250, cortado 350, bombón 450. Total 30 productos.
- store.ts: merge() versionado — si el localStorage es de versión anterior, une categorías/productos nuevos del seed SIN pisar ediciones del negocio.
- ingredient-layers.tsx: +9 tipos de capa de bebida (glass, ice, liquidSoda, liquidJuice, milk, coffee, foam, citrus, fruits) con artes SVG y emojis; layerKindFor con mapeo para vaso/taza/botella, hielo, gaseosa/malta/cerveza, leche/malteada/condensada, café, espuma/crema, jugo/limonada/batido/maracuyá, limón/naranja/menta, frutas/semillas.
- menu-view.tsx: WaterBackdrop (SVG olitas aqua 0.10-0.17 + burbujas) al fondo de cada ProductRow; tarjeta con degradado blanco→#eef9fc y sombra hover aqua; contenido con relative para quedar sobre el agua; sello "Recomendado Chef" con z-10. Marquesina ahora incluye 4 fotos de bebidas.
- customizer-sheet.tsx: bebidas (category empieza con "bebidas-") no muestran agregos de comida; en su lugar chip aqua "🧊 Bebida bien fría · puedes pedirnos el hielo aparte en las notas".
- exploded-view.tsx: texto "Base del vaso 🥤" cuando el último ingrediente es vaso/taza.
- Verificado: eslint 0 errores, tsc sin errores nuevos en archivos tocados, navegador móvil+desktop (audit/30-39): pills con 7 categorías, tarjetas con agua, customizer de bebida sin agregos, vista explotada de Refrescos (limón/gaseosa/hielo/vaso), carrito con 1× Refrescos $600, consola sin errores.

Stage Summary:
- Menú ampliado a 30 productos en 7 categorías con fotos IA playeras; tarjetas con tema de agua; flujo de bebidas sin agregos de comida.
- Pendiente: captura del usuario sigue sin llegar (2º intento); ajustes finos si la reenvía.

---
Task ID: 4
Agent: Super Z (main agent)
Task: Usuario reporta que en modo teléfono se pierden las palmeras y decoración playera. Revisar, dar ideas de mejoras y entregar ZIP actualizado.

Work Log:
- Causa encontrada: en menu-view.tsx la decoración ambiental fija estaba con "hidden lg:block" (solo escritorio) y las siluetas del encabezado con "hidden sm:block" (desaparecen <640px).
- beach-scene.tsx: nuevo componente SunSol/SunSilhouette (sol con rayos SVG #f2c230).
- menu-view.tsx:
  - Encabezado: palmera y tabla de surf ahora visibles en móvil (h-16/h-20, opacity-25) y como antes en sm+ (h-28/h-32, opacity-90).
  - Nueva capa ambiental fija para móvil/tablet ("lg:hidden", pointer-events-none, z-0): sol arriba a la izquierda (0.30), palmera asomando a la derecha (0.13), tabla inclinada a la izquierda (0.14), 2 conchas en los bordes (0.30-0.40) y cangrejo caminante abajo a la derecha (0.16, crab-walk).
- Verificado: eslint 0 errores en archivos tocados; tsc sin errores nuevos (reviews.ts preexistente); capturas móvil 390x844 (audit/40-42) y desktop 1440 (audit/43); consola sin errores; desktop sin regresión.
- ZIP entregado: download/al-otro-lado-playa-2026-09-27.zip (3.8 MB, 153 archivos: src, public, prisma, db, scripts, configs, worklog; .env portable con file:../db/custom.db; excluye node_modules/.next/.git/audit/skills/examples/tests/mini-services).

Stage Summary:
- La playa ya no desaparece en el teléfono: sol, palmera, tabla, conchas y cangrejo presentes en todo el scroll móvil sin estorbar la lectura.
- Ideas de mejoras propuestas al usuario (búsqueda, modo noche, compartir por WhatsApp, toasts, fotos reales, contador de favoritos) pendientes de su elección.

---
Task ID: 5
Agent: Super Z (main agent)
Task: "Vamos con todas las mejoras" + sistema de cliente registrado con notificaciones (apertura/cierre, productos nuevos), gustos guardados y opción de activar notificaciones.

Work Log:
- Nuevos archivos:
  - src/lib/customer.ts: store zustand persist aol-customer-v1 (perfil con nº de socio, favoritos, bandeja de hasta 40 avisos, orderCounts como gustos, visitas, prefs con tema día/atardecer y toggles de avisos) + helpers showSystemNotification (Notification API), buzz (vibración), waitEstimate (heurística por hora pico), normalizeText.
  - src/components/menu/notification-watcher.tsx: vigía que lee localStorage aol-menu-v1 cada 15 s + evento storage; detecta apertura/cierre y productos nuevos (comparando con seenProducts), deja aviso en la campanita y dispara Notification API si hay permiso. BUG corregido durante pruebas: zustand persist guarda settings/products directo en state (no en state.data).
  - src/components/menu/customer-sheet.tsx: CustomerSheet (registro con nombre + WhatsApp opcional, tarjeta de socio, stats favoritos/pedidos/visitas, "Tus gustos" top 3, preferencias con switches, activar notificaciones del navegador, borrar mis datos) e InboxSheet (bandeja con no leídos, marcar leído, vaciar).
- beach-scene.tsx: WaveBand (olas SVG en bucle sin costuras con wave-drift) para el fondo del encabezado.
- globals.css: keyframes wave-drift + .animate-wave(-slow); tema atardecer completo vía [data-theme="sunset"] con clases semánticas (aol-page/title/sub/h/chip/navbar/pill/card/price/tag/featured/empty/closing/waves/reviews). Sheets quedan claras a propósito.
- menu-view.tsx: buscador (acentos-insensible, oculta pills mientras busca), filtro ❤️ Favoritos + corazón en cada foto, fila de acciones (Hazte cliente/Hola {nombre}, campanita con badge, modo atardecer, compartir con navigator.share/clipboard), chip de espera estimada, galería "Así se vive el shack" (4 fotos IA en public/images/shack), olas animadas, CustomerSheet/InboxSheet/NotificationWatcher montados, data-theme en <html>.
- customizer-sheet.tsx: al agregar → toast sonner + vibración + bumpOrderCount (gustos). cart-sheet.tsx: nombre precargado del perfil. reviews-section.tsx: clases de tema.
- Infra: el dev server servía CSS viejo de Turbopack (touch no bastó); reiniciado con rm -rf .next/dev + bun run dev.
- Verificado con agent-browser (móvil 390 + desktop 1440, audit/50-60): registro "Marta" #927, badge campanita al simular cierre, bandeja con aviso "Cerramos por hoy 🌙", búsqueda "limo" 3 resultados, favoritos persistentes, atardecer persistente, toast "Clásica al carrito", gustos {p-clasica:1}, consola sin errores, eslint 0, tsc limpio en archivos nuevos (queda 1 error preexistente en admin/tab-resenas).

Stage Summary:
- 8 mejoras implementadas + sistema de cliente de la marea completo, todo local (localStorage), sin backend.
- Notificaciones: funcionan en la app/página abierta (y como PWA instalada); aviso del navegador requiere permiso del usuario. Push real con servidor queda como futuro.
- ZIP entregado: download/al-otro-lado-playa-2026-09-27-v2.zip (4.4 MB, 163 archivos, .env portable).

---
Task ID: 6
Agent: Super Z (main agent)
Task: Preparar el proyecto para GitHub (fotos/datos) + Supabase (datos guardados y push); añadir sección Carrito y sección Favoritos; acceso al admin tocando 3 veces el logo.

Work Log:
- Arquitectura nube (opcional, la carta sigue funcionando 100% local):
  - supabase.ts: SQL_SETUP ampliado con tablas customers (registro de clientes), push_subscriptions (Web Push VAPID) y announcements (avisos de apertura/cierre/producto nuevo) + RPC admin_announce y admin_customers; helpers REST sbUpsertCustomer, sbInsertPushSubscription, sbDeletePushSubscription, sbFetchAnnouncements, sbAdminAnnounce, sbAdminCustomers.
  - cloud.ts (nuevo): subscribeToPush/unsubscribeFromPush (service worker + VAPID desde env NEXT_PUBLIC_VAPID_PUBLIC_KEY o localStorage aol-vapid-key), syncCustomerToCloud (upsert del perfil + gustos). Todo no-op silencioso sin Supabase.
  - customer.ts: seenAnnouncements + syncSeenAnnouncements.
  - notification-watcher.tsx: además del vigía local, consulta announcements de Supabase cada 60 s y los entrega en campanita/notificación respetando preferencias; sincroniza el cliente a la nube al visitar.
  - customer-sheet.tsx: al registrarse → syncCustomerToCloud (toast si quedó en nube); al activar notificaciones → subscribeToPush (mensaje distinto si push real activo).
- Secciones nuevas en la carta (barra de navegación inferior fija con 3 tabs: Menú / Favoritos / Carrito, badges con contadores y total en Carrito; reemplaza a la antigua barra flotante):
  - favorites-section.tsx (nuevo): favoritos con ProductRow + tarjeta «Tus gustos de la marea» (top 3 por orderCounts + total armado) + estados vacíos.
  - cart-section.tsx (nuevo, sustituye a cart-sheet.tsx que se eliminó): pedido completo como sección (items con +/-/quitar, nombre precargado del perfil, dirección, totales, WhatsApp, vaciar).
  - product-row.tsx (nuevo): ProductRow + WaterBackdrop extraídos para reutilizar sin dependencia circular.
  - menu-view.tsx: view state menu|favoritos|carrito con scroll-to-top; contenido del menú extraído a MenuHome; buscador intacto; píldora ❤️ ahora lleva a la sección; logo ahora es botón con TRIPLE TOQUE → toast 🔑 y hash #/admin (el enlace visible del pie se retiró, pie con guiño «El secreto del shack vive en el logo»).
- Admin: tab Hoy incluye tarjeta «📣 Avisos a los clientes»: avisar apertura/cierre (textos playeros fijos) o anunciar producto nuevo (select de productos con precio) → sbAdminAnnounce con contraseña de nube; errores explicados con explain().
- globals.css: tema atardecer para .aol-nav (barra inferior) y .aol-tastes (tarjeta de gustos) con textos legibles.
- README.md (nuevo): guía completa — acceso admin (3 toques, playa2026), fotos en GitHub (public/images + Publicar con Contents API), Supabase paso a paso (SQL, tablas, avisos), push real con VAPID y Edge Functions; .env.example con placeholder VAPID.
- BUG corregidos durante pruebas: syntax error en cloud.ts (as en línea partida → BufferSource variable); SupaCreds importado desde types; caché CSS de Turbopack sirviendo estilos viejos tras editar globals.css (requirió reiniciar servidor con rm -rf .next/dev y luego rm -rf .next).
- Verificado: tsc solo con 2 errores preexistentes (tab-resenas, reviews.ts) y 0 en archivos nuevos/tocados; eslint 0; agent-browser móvil 390 (menú, favoritos con gustos, carrito con nombre precargado, triple toque → admin, toast 2 toques, aviso de cierre simulado con badge y bandeja, búsqueda "limo" 3 resultados) y desktop 1440 (menú, carrito, atardecer); consola limpia tras recarga fresca; capturas en audit/60-75.

Stage Summary:
- Secciones Carrito y Favoritos como vistas de primera clase con navegación inferior; admin oculto tras triple toque en el logo.
- Camino a producción listo: GitHub para fotos/carta (repo + tab Publicar), Supabase para clientes/pedidos/reseñas/avisos y Web Push (solo falta pegar credenciales y ejecutar el SQL; documentado en README).
- ZIP entregado: download/al-otro-lado-playa-2026-09-27-v3.zip con README y .env.example incluidos.

---
Task ID: 7
Agent: Super Z (main agent)
Task: Arreglos de diseño reportados por el usuario con capturas (las capturas no llegaron al servidor otra vez; se trabajó con la descripción): 1) nombres de categoría centrados, más pronunciados y legibles; 2) buscador dentro de un cuadrado negro (modo atardecer); 3) agua del hero se ve mal; 4) sol debajo de la palma y con tono marrón, debe ser atardecer.

Work Log:
- beach-scene.tsx:
  - SunSilhouette rediseñado como sol de atardecer: disco con radialGradient (#ffefad→#ffc766→#ff9550→#f0654a), doble halo suave y rayos coral #ff8a4e (antes dorado plano #f2c230 que con opacidad se veía marrón apagado).
  - WaveBand rehecho: 4 capas (back #a9ddec / mid #7ccadb / front #54b7cf / espuma blanco por stroke) que cuelgan del borde superior y terminan en orilla ondulada (antes cortaban recto al acabar el bloque h-24 y se veían como manchas translúcidas); WaveLayer admite stroke para la línea de espuma; orden apilado: la más honda (orilla clara) detrás, la más superficial delante.
  - WaveRule (nuevo): ondulación decorativa para acompañar títulos.
- globals.css:
  - Mar de atardecer por capas: wave-front #7b55a8 (violeta) → wave-mid #b25a80 (rosa malva) → wave-back #e0885c (coral) + espuma #ffd9ae (antes TODO marrón #c46a3a por el override genérico .aol-waves svg path).
  - Navbar atardecer: de losa opaca rgba(43,29,17,.95) a cristal cálido translúcido (gradiente rgba(70,45,28,.82)→rgba(52,34,21,.78)) con borde inferior suave, esquinas inferiores redondeadas y sombra → adiós «cuadrado negro».
  - Buscador en atardecer: .aol-search translúcido cálido con texto #f8ecd4, placeholder #b08d5f, focus con halo coral; .aol-search-icon y .aol-search-clear adaptados.
  - Títulos de categoría: .aol-cat (#a8431f + text-shadow blanco en día; #ffcda6 con glow oscuro en atardecer) y .aol-cat-rule para las ondulaciones.
- section-title.tsx (nuevo): componente CatTitle — centrado, font-display 2xl/3xl, font-black, UPPERCASE, tracking-wide, emoji grande y WaveRule a cada lado. Aplicado a: destacados, resultados de búsqueda, TODAS las categorías, galería del shack (menu-view), favoritos (favorites-section) y carrito (cart-section). Reseñas mantiene su layout con botón de refresco.
- menu-view.tsx: sol de atardecer subido a la esquina superior izquierda detrás de la copa de la palmera en móvil (antes top-16 = justo DEBAJO de la palma del header); sol añadido a la capa ambiental desktop (right-10% top-12, h-24, opacidad 30%); input de búsqueda con clases aol-search/aol-search-icon/aol-search-clear.
- FIX de sintaxis: comilla curva dentro de literal JS en CatTitle de resultados ("resultados”} para") detectada por errores de consola de Next; corregida a {" "} para “{query.trim()}”.
- Verificado: tsc 0 errores en archivos tocados (persisten los 2 preexistentes de reviews.ts/admin), eslint 0, agent-browser 390x844 día+atardecer (sticky navbar incluido) y 1440x900 día+atardecer, consola limpia tras recarga fresca; capturas en audit/fix-*.png.

Stage Summary:
- Categorías centradas y pronunciadas en todas las secciones; buscador sin cuadrado negro (cristal cálido en atardecer); mar del hero con orilla ondulada día (aguas claras) y atardecer (violeta→rosa→coral); sol de atardecer con gradiente cálido arriba de la palmera en móvil y presente en desktop.
- ZIP entregado: download/al-otro-lado-playa-2026-09-27-v4.zip (mismas exclusiones, .env portable file:../db/custom.db).

---
Task ID: 8
Agent: Super Z (main agent)
Task: Tarjetas con sombra flotante; admin con subida de fotos reales de productos y del local (guardadas para todos); botón instalar como PWA; ideas de nombres temáticos (sugerencias al chat).

Work Log:
- Sombras flotantes: clase .aol-float en globals.css (3 capas: contacto + difusa azulada + profunda cálida; hover levanta 2px; variante atardecer más oscura). Aplicada a ProductRow, destacados, galería del shack y tarjeta de cierre.
- lib/gh.ts (nuevo): putFileToGitHub (extraído de tab-publicar), uploadPhotoToGitHub (comprime en navegador con canvas a ~900px JPEG 0.82 y sube por Contents API a public/images/products|local/), compressImage, getGhToken/setGhToken.
- Fotos de productos: tab-productos.tsx — botón ImagePlus en cada fila + botón "Subir foto real (cámara o galería)" en el diálogo de edición con miniatura de la foto actual; al subir se asigna al campo image del producto y recuerda publicar; sin token/repo explica cómo configurarlo.
- Fotos del local: types.ts añade GalleryItem y settings.gallery (opcional); store con setGallery; tab-publicar.tsx con sección "Fotos del local 📸" (subida múltiple secuencial a public/images/local/, miniaturas, leyendas editables, quitar, guardar); menu-view.tsx usa settings.gallery si existe y si no DEFAULT_GALLERY (extraída a gallery-data.ts).
- PWA: install-prompt.tsx (nuevo) — captura beforeinstallprompt, botón ⤓ en la fila de acciones del encabezado, guía para iPhone (Compartir → Añadir a pantalla de inicio), se oculta si ya está instalada (display-mode standalone / appinstalled). El manifest y sw.js ya existían.
- Verificado: tsc 0 en tocados (persisten 2 preexistentes), eslint 0, capturas audit/float-*.png (móvil día/atardecer, desktop atardecer), botón ⤓ visible, admin Productos con botón de foto por fila, diálogo con miniatura + subir, galería del local con 4 fotos de serie y leyendas; consola limpia.

Stage Summary:
- Tarjetas flotan con sombra de tres capas en ambos temas.
- Fotos reales: productos (por fila y en edición) y local (galería configurable) subidas desde el admin a GitHub, visibles para todos al publicar la carta.
- Instalable como app (PWA) con botón en el encabezado; manifest + SW + iconos ya completaban los requisitos.
- ZIP entregado: download/al-otro-lado-playa-2026-09-27-v5.zip.

---
Task ID: 9
Agent: Claude Code
Task: Pasar al proyecto real las mejoras del preview (quitar ingredientes, recordar gustos, modo noche de playa, buscador, modo ligero) y hacer configurable en el panel: entrega por zonas y formas de pago, menú del día, agotados en tiempo real, horario, combos y QR. Precios solo en MN.

Work Log:
- types.ts: Settings con deliveryEnabled, pickupEnabled, zones, payments, schedule, daily, publicUrl; MenuData.combos; CartItem.removed/comboId; Order items con removed.
- seed.json v4: zonas (Vedado, Centro Habana, Plaza, Playa), pagos (Efectivo, Transfermóvil, EnZona apagado), horario 12:00-23:30 (auto apagado), menú del día apagado y 3 combos de ejemplo.
- store.ts: normalizeMenu (datos viejos o menu.json antiguo se completan con los de fábrica), refreshRemote (raw.githubusercontent → /data/menu.json → GitHub Pages; solo aplica si es más nuevo, conserva contraseña y config de GitHub locales), saveCombo/deleteCombo, openStateFor + prettyHour (horario con cruces de medianoche).
- lib/ingredients.ts (canRemoveIngredient, removableOf, sinText); customer.ts: removedPrefs + setRemovedPref.
- customizer-sheet: «¿Le quitamos algo?», recordar gustos, capas quitadas apagadas en exploded-view.
- cart-section: domicilio/recogida, zona con mensajería, forma de pago con datos copiables, validaciones, bloqueo fuera de horario, mensaje WhatsApp con SIN …, contenido de combos, subtotal + mensajería, total en MN.
- menu-view: reloj de 30 s (horario) y refresco de la carta publicada cada ~90 s y al volver a la pestaña; chip de horario; aviso de cerrado con la próxima apertura; DailySection y CombosSection (specials.tsx); product-row muestra «Se acabó hoy».
- Admin: pestañas Combos (tab-combos) y Entrega y pago (tab-servicio: zonas, pagos, horario); DailyCard en Hoy; QrCard en Publicar (qrcode-generator, cartel PNG). Publicar ya no incluye adminPassword en menu.json.
- globals.css: modo Noche de playa (añil + brasas + luciérnagas .aol-glow), buscador flotante con anillo degradado, pastillas con contador, modo ligero (html.lite) y pausa con la pestaña oculta (html.aol-paused).
- night-glow.tsx: NightGlow + LiteModeButton (auto con Save-Data / 2G / 3G).
- Verificado: tsc solo con los 2 errores preexistentes, eslint 0, next build OK, Playwright 390 px día/noche: quitar mostaza/ketchup, recuerdo de gustos, combo al carrito, zona+pago, mensaje de WhatsApp completo, panel (menú del día, combos, entrega y pago, QR) sin desbordes.

---
Task ID: 10
Agent: Claude Code
Task: El proyecto real debe verse como el preview aprobado y no revelar el acceso al panel.

Work Log:
- hero-postcard.tsx + estilos .pc-*: postal del preview (cielo, sol que se pone en el mar, luna, estrellas, nubes, palmeras, olas, banderines, campanita/compartir e interruptor ☀️/🌙 con transición circular). Logo grande apoyado sobre la postal.
- Se quitó el mar antiguo (WaveBand) y la decoración lateral en móvil; el modo ligero pasa a chip «⚡ Modo ligero».
- Hoja «Armar pedido» con foto grande, nombre y precio; carrito con fotos; reseñas con resumen (nota, barras) y tarjetas deslizables.
- Pie sin «El secreto del shack vive en el logo» y sin el aviso «Un toque más…» al tocar el logo 2 veces.
- SunSilhouette con id de degradado único (el sol salía gris); sello oscuro en modo noche.

---
Task ID: 11
Agent: Claude Code
Task: Capas del antojo con el estilo de franjas de colores del preview y nombres centrados.

Work Log:
- layer-stack.tsx (nuevo): una franja de color por ingrediente con emoji y nombre centrado; pan de arriba en cúpula y base (pan, vaso, taza) redondeada abajo; agregos como capa con «+»; ✕ en la esquina para quitar (↺ para volver a poner); «Juntar/Separar capas».
- customizer-sheet usa LayerStack; se quitan los botones duplicados de «¿Le quitamos algo?» (queda el resumen «Sin …», «Ponerlo todo» y «Recordar mis gustos»).
- Borrados exploded-view.tsx e ingredient-layers.tsx (ya sin uso).

---
Task ID: 12
Agent: Claude Code
Task: Conectar la nube Supabase del negocio (clave nueva sb_publishable_…).

Work Log:
- supabase.ts: sbAuth() — las claves nuevas «sb_publishable_…» se envían solo en `apikey`; las antiguas «eyJ…» también en Authorization. Probado con servidor simulado (ambos formatos).
- BUG corregido: la config de la nube solo existía en el teléfono donde se pegaba en el panel, así que los teléfonos de los clientes nunca guardaban pedidos/reseñas en Supabase. Ahora cloud-config.ts trae la URL + clave pública del negocio (sobrescribible con NEXT_PUBLIC_SUPABASE_URL/KEY) y reviews.ts la usa por defecto en todos los dispositivos.
- Panel → Reseñas acepta y explica ambos formatos de clave.
- No se pudo probar contra el proyecto real desde el entorno de trabajo (red bloqueada): falta ejecutar el SQL en Supabase y hacer un pedido de prueba.

---
Task ID: 13
Agent: Claude Code
Task: Carta en PDF de una sola hoja con la estética de la web + guardado automático en GitHub.

Work Log:
- pdf-menu.tsx: hoja A4 (794×1123) con postal, logo, datos rápidos, categorías en 3 columnas con líneas de puntos y precio, agregos, combos, pie con QR, mensajería y pagos. Auto-ajuste de letra (--fs) hasta que cabe en una hoja. Descarga con window.print + CSS @page A4 sin márgenes y colores exactos; título del documento = nombre del PDF. Verificado: PDF de 1 página A4 con toda la carta (letra ajustada a 11.25 px).
- autopublish.ts: publishMenu/publicMenuJson compartidos (sin contraseña), guardado automático con agrupación de 15 s, reintento al minuto, subida al esconder la app; no re-sube lo que ya vino publicado.
- autosave-status.tsx: estado en la cabecera del panel. Publicar: interruptor «Guardado automático».
- BUG corregido: «Guardar datos» con el campo del token vacío borraba el token guardado.
- Verificado con GitHub simulado: 2 cambios seguidos = 1 subida, Authorization correcto, adminPassword vacío.

---
Task ID: 14
Agent: Claude Code
Task: PDF solo en el panel; contraseña del panel igual en todos los teléfonos y sin pista; nombres playeros.

Work Log:
- PDF: fuera de la carta pública; tarjeta «📄 Carta en PDF» en Panel → Publicar.
- Contraseña: SQL check_panel_pass (bcrypt); panel-auth.ts verifica en la nube al entrar (se recuerda en el teléfono para entrar sin red solo si ya entró antes); Ajustes cambia la contraseña en la nube con change_panel_pass (mínimo 6 caracteres). Quitada la pista «Contraseña inicial: playa2026» de la pantalla de entrada.
- Nombres playeros (seed v5): La Orilla, Marea Alta, El Arrecife, Doble Ola, La Gran Marejada, El Salvavidas, El Surfista, Cayo Piña, Brisa Verde, Puesta de Sol, El Muelle, Perlas de Cerdo/Pollo, Croquetas del Malecón, Fajitas del Velero, Papas de Arena, Papischis Tiburón, Alitas del Faro, Ola Fría, Malta Marinera, Cerveza Horizonte, Jugo Tropical, Espuma de Mar, Batido Coral, Maracuyá Atardecer, Limonada Brisa, Limonada Copacabana, Espresso Marinero, Cortado Amanecer, Bombón de Arena. Migración: solo se renombra lo que seguía con el nombre de fábrica antiguo (lo editado por el negocio se respeta) y se publica solo.
- Verificado: pass de fábrica rechazada con nube, pass correcta entra, teléfono nuevo sin red no entra, teléfono verificado sin red entra; carta sin botón PDF; migración respeta nombres editados.

---
Task ID: 15
Agent: Claude Code
Task: Modo ligero automático según conexión/teléfono; abierto/cerrado y avisos según el horario.

Work Log:
- night-glow.tsx: detección automática (saveData, 2G/3G, deviceMemory ≤2, ≤2 núcleos, batería <20 % sin cargar, prueba de fluidez <40 fps a los 2,5 s solo para esa visita; se revisa al cambiar la conexión). La etiqueta solo aparece en modo ligero, con el motivo y «ver animaciones» para quitarlo.
- Horario automático por defecto (seed v6) y migración para datos guardados; notification-watcher calcula abierto/cerrado con openStateFor (horario + interruptor), así los avisos «¡Abrimos!/Cerramos» llegan solos a la hora.
- Pestaña Hoy: el interruptor explica «Según el horario: ABIERTO/CERRADO ahora · apágalo para cerrar hoy».
- Verificado: 4G/teléfono bueno = animaciones; 3G, ahorro de datos y 2 GB RAM = modo ligero con motivo; 10 am «Abrimos hoy a las 12 pm (en 2 h)», 8 pm «Cierra a las 11:30 pm», 1 am cerrado; aviso «¡Abrimos la marea!» a las 12:00 con reloj simulado.

---
Task ID: 16
Agent: Claude Code
Task: Optimizar animaciones para teléfonos de gama media/baja (Cuba).

Work Log:
- Medición previa (Playwright, 390×844, CPU ×6): scroll en modo noche 29–30 fps; día 49–51 fps.
- Luciérnagas: de 10–22 puntos con sombra flotando por TODA la página (capa fija) a 7 puntos sin sombra solo dentro de la postal y solo de noche.
- Cielo nocturno: de background-attachment: fixed (redibujo en cada scroll) a una capa fija body::before que se pinta una vez.
- Sin backdrop-filter en móvil: barra de búsqueda, barra inferior, botones de la postal y los 60 rótulos «Capas»/corazón de las tarjetas (fondos casi opacos).
- Sombras de tarjeta más ligeras en móvil; estrellas de 38 a 20.
- useOffscreenPause: la postal y la marquesina pausan sus animaciones al salir de pantalla.
- Probado content-visibility: empeoraba (8 tirones) → descartado.
- Medición final: scroll ~54 fps en día y noche con 0–2 tirones (antes noche 30 fps).

---
Task ID: 17
Agent: Claude Code
Task: Hojas (modales) en modo noche.

Work Log:
- Clase aol-sheet en Armar pedido, Hazte cliente, Avisos y Reseña; CSS nocturno que remapea fondos, textos, bordes, inputs y botones (incluido el precio sobre la foto y los botones −/+). Avisos emergentes oscuros de noche.
- Hazte cliente: textos honestos (el registro se guarda en la nube del shack; favoritos solo en el teléfono; para borrarse, pedirlo por WhatsApp) y «Modo noche de playa».
- Verificado: capturas de las 4 hojas de noche; rendimiento sin cambios (~52 fps con CPU ×6).

---
Task ID: 18
Agent: Claude
Task: Upsell, repetir pedido, fidelidad y cupones en el panel, carta en inglés

Work Log:
- src/lib/promos.ts: cupones (findCoupon/couponDiscount), fidelidad (loyaltyProgress), upsellFor, toLastOrder/rebuildOrder.
- promo-cards.tsx: RepeatLastOrderCard, LoyaltyCard, UpsellSheet. Carrito con cupón, sellos, último pedido y mensaje WhatsApp con descuento/premio.
- Panel: pestaña Promos (fidelidad + cupones), campos en inglés en el editor de productos.
- i18n: toda la carta del cliente en ES/EN; useLang respeta la hidratación (sin error #418).
- Verificado en navegador: upsell, cupón -10 % con mínimo, sello 1/5 en WhatsApp, repetir pedido, inglés día/noche, sin errores.

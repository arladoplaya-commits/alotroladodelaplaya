# Cambios de esta versión (GitHub + Supabase, como antes)

Supabase se mantiene tal cual: reseñas, clientes de la marea, avisos y pedidos en la nube,
y el menú publicado por GitHub.

## Sincronización del menú (bug "quito un producto y en otros teléfonos sigue")
- La carta vuelve a consultar el menú al volver a la app, al recuperar internet y cada 90 s.
- Consulta las 3 fuentes a la vez, con límite de 6 s, y usa la más reciente.
- Un teléfono sin cambios propios ya no se queda con una copia vieja.
- Service worker v9.

## Productos y SEO
- Borrar un producto lo quita del menú del día y desactiva los combos que lo usaban.
- Las páginas `/producto/...` se actualizan solas con `data/menu.json` (`aol-live.js`).
- `404.html` en español; los productos nuevos se dibujan desde el menú en vez de dar 404.
- Corregidos `canonical`, `og:image`, `twitter:image` y JSON-LD de las 30 páginas.
- `sitemap.xml` se regenera al publicar (`.github/workflows/sitemap.yml`).

## Fotos (panel)
- Al subir una foto se convierte a **WebP** (JPEG si el teléfono no sabe WebP), máx. 800 px, y se comprime
  hasta ~90 KB. Se corrige también la rotación de fotos del celular.
- Al subir una foto nueva a un producto, la **anterior se borra de GitHub** cuando publicas, siempre que
  ningún otro producto/foto la siga usando. No toca el logo ni los íconos.

## Categorías (panel → Productos)
- Nueva tarjeta **🗂️ Categorías**: añadir (emoji + nombre), renombrar, mostrar/ocultar, subir/bajar y borrar.
- No se puede borrar una categoría que tenga productos (primero muévelos o bórralos).
- Se publican solas junto con el resto de cambios.

## Supabase (opcional, recomendado)
- `supabase/seguridad.sql`: freno a adivinar la clave del panel, límite de tamaño y anti-spam.
  Ejecútalo en el SQL Editor después de `setup.sql`.

## Pendiente de TU parte
1. **Número de WhatsApp**: Panel → Ajustes → WhatsApp. Sin número nadie puede pedir.
2. **Clave del panel**: cambia `playa2026` (línea comentada al inicio de `seguridad.sql`).
3. Publica desde **un solo teléfono** con el token de GitHub ("Todo guardado en GitHub").

## Revisión (token y fotos)
- El token de GitHub se guarda en cuanto lo pegas (antes solo al pulsar «Publicar» o «Guardar datos») y también al subir fotos de la galería. El campo muestra «✓ Token guardado» y se pide almacenamiento persistente al navegador.
- Al eliminar un producto se borra su foto de GitHub en el próximo «Publicar» (si nadie más la usa).
- Al quitar una foto de la galería del local se borra igual (las 4 fotos por defecto `s-*` no se tocan).
- Las 36 fotos existentes se convirtieron a WebP (800 px máx.) y se actualizaron todas las referencias. Service worker v10.

## Dos cartas, modo navideño (v11)
- **Carta en PDF** (Publicar): pestañas «🍔 Comidas», «🥤 Líquidos» y «📄 Las 2 cartas» (2 hojas A4). Líquidos = categorías de bebidas; combos y agregos van en la de comidas.
- **🎄 Modo navideño**: interruptor en Hoy (y en Ajustes). Al activarlo y publicar, la web del cliente y el PDF se visten de Navidad (`aol-xmas.js`).
- Compresor de fotos revisado: genera WebP real (RIFF/WEBP), máx. 800 px, corrige rotación y pone fondo blanco a PNG transparentes. Service worker v11.

## v11b
- Las cartas PDF ajustan la letra solas para llenar la hoja A4 (más grande, menos espacio vacío).
- Modo navideño renovado: cielo nocturno con luna y estrellas, luces de colores, arbolitos, trineo, nieve, gorro de Santa en el logo, cuenta atrás a Navidad. El PDF lleva marco rojo/verde, copos y precios en verde.
- Limpieza de fotos: todas las referencias usan `.webp`; se borraron los `.jpg` duplicados y las fotos sin uso (32 archivos).

## v11c
- Al activar/desactivar 🎄 Modo navideño en Hoy se publica al instante en GitHub (aviso en pantalla). Si falta el token, avisa que hay que configurarlo en Publicar.
- Las páginas abiertas de clientes se ponen/quitan el modo navideño solas (cada 90 s o al volver a la app).

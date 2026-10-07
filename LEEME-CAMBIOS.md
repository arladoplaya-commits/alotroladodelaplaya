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

## Supabase (opcional, recomendado)
- `supabase/seguridad.sql`: freno a adivinar la clave del panel, límite de tamaño y anti-spam.
  Ejecútalo en el SQL Editor después de `setup.sql`.

## Pendiente de TU parte
1. **Número de WhatsApp**: Panel → Ajustes → WhatsApp. Sin número nadie puede pedir.
2. **Clave del panel**: cambia `playa2026` (línea comentada al inicio de `seguridad.sql`).
3. Publica desde **un solo teléfono** con el token de GitHub ("Todo guardado en GitHub").

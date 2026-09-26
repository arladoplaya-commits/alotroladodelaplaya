#!/bin/bash
# Genera las 4 fotos de la galería "El shack" · Al Otro Lado de la Playa
set -u
OUT="/home/z/my-project/public/images/shack"
TMP="/home/z/my-project/scripts/shack-tmp"
mkdir -p "$OUT" "$TMP"

STYLE="professional photography, tropical beach food shack, warm golden hour light, inviting atmosphere, vibrant but natural colors, high quality, detailed, no people, no text, no watermark"

declare -A P=(
  [s-carrito]="Charming small beach food shack cart on sandy shore at sunset, coral red and cream striped awning, warm string lights glowing, palm trees behind, gentle waves in background"
  [s-barra]="Rustic wooden beach cafe counter with blender, stacked paper baskets, tropical fruits, bamboo details and hanging string lights, cozy evening ambiance"
  [s-punto]="Havana Vedado neighborhood street corner at dusk, small friendly food stall with warm lights, classic Caribbean buildings, tropical trees, nostalgic warm tones"
  [s-atardecer]="Tropical beach sunset with palm tree silhouettes, a surfboard stuck upright in the sand, gentle aqua waves, orange and pink sky, relaxed vibe"
)

for key in "${!P[@]}"; do
  if [ -s "$OUT/$key.jpg" ]; then
    echo "SKIP $key (ya existe)"
    continue
  fi
  echo "Generando $key..."
  z-ai image -p "${P[$key]}, $STYLE" -o "$TMP/$key.png" -s 1024x1024 >/dev/null 2>&1 && echo "  ok $key" || echo "  FALLO $key"
done
echo "Listo. PNGs en $TMP"

#!/bin/bash
# Genera las 12 fotos de bebidas para el menú · Al Otro Lado de la Playa
set -u
OUT="/home/z/my-project/public/images/products"
TMP="/home/z/my-project/scripts/drink-tmp"
mkdir -p "$OUT" "$TMP"

STYLE="professional food photography, tropical beach cafe style, warm natural light, on rustic wooden table, refreshing condensation, vibrant colors, shallow depth of field, high quality, detailed, no text, no watermark"

declare -A P=(
  [p-refrescos]="Ice-cold sodas in glass bottles with condensation droplets, cola and orange soda, a tall glass with ice cubes and soda beside the bottles"
  [p-malta]="Caribbean malt beverage in a brown bottle, dark amber malt soda poured into a small glass with thick foam head, chilled"
  [p-cerveza]="Imported lager beer in a green bottle with droplets, golden beer poured into a frosty glass with thick white foam head"
  [p-jugos]="Fresh natural fruit juices in tall glasses, orange and papaya juice, surrounded by fresh tropical fruits"
  [p-malteada]="Creamy vanilla milkshake in a tall glass with whipped cream swirl on top, pink straw, frothy"
  [p-batidos]="Natural fruit smoothie with strawberry banana blend in a tall glass, fresh strawberries and banana slices as garnish"
  [p-maracuya]="Vibrant passion fruit juice in a glass, bright orange-yellow color, passion fruit cut in half showing seeds as garnish"
  [p-limonada]="Fresh homemade lemonade in a tall glass with ice, lemon slices and fresh mint leaves, bright yellow"
  [p-limonada-brasilena]="Brazilian creamy limeade, frothy blended lime drink in a glass with lime wheel garnish, creamy pale green color"
  [p-espresso]="Double espresso shot in small white porcelain cup with golden crema on top, coffee beans scattered"
  [p-cortado]="Cortado coffee in a small glass, layers of espresso and steamed milk, warm brown tones"
  [p-bombon]="Cafe bombon in a clear glass showing layers, sweet condensed milk at bottom and espresso on top, two-tone layers"
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

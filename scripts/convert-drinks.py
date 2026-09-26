#!/usr/bin/env python3
"""Convierte los PNG de bebidas a JPG optimizados en public/images/products/."""
import os
from PIL import Image

TMP = "/home/z/my-project/scripts/drink-tmp"
OUT = "/home/z/my-project/public/images/products"

NAMES = [
    "p-refrescos", "p-malta", "p-cerveza", "p-jugos", "p-malteada",
    "p-batidos", "p-maracuya", "p-limonada", "p-limonada-brasilena",
    "p-espresso", "p-cortado", "p-bombon",
]

ok = missing = 0
for name in NAMES:
    src = os.path.join(TMP, f"{name}.png")
    dst = os.path.join(OUT, f"{name}.jpg")
    if not os.path.exists(src):
        print(f"FALTA {name}.png")
        missing += 1
        continue
    img = Image.open(src).convert("RGB")
    img = img.resize((640, 640), Image.LANCZOS)  # se muestran a máx 112px; 640 sobra
    img.save(dst, "JPEG", quality=84, optimize=True, progressive=True)
    kb = os.path.getsize(dst) // 1024
    print(f"OK {name}.jpg ({kb} KB)")
    ok += 1

print(f"\nConvertidas: {ok} · Faltantes: {missing}")

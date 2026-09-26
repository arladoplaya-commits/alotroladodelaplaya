"""Convierte los PNGs de la galería del shack a JPG 800px q85."""
from pathlib import Path
from PIL import Image

SRC = Path("/home/z/my-project/scripts/shack-tmp")
OUT = Path("/home/z/my-project/public/images/shack")
OUT.mkdir(parents=True, exist_ok=True)

for png in sorted(SRC.glob("*.png")):
    dst = OUT / (png.stem + ".jpg")
    if dst.exists():
        print(f"SKIP {dst.name}")
        continue
    img = Image.open(png).convert("RGB")
    w = 800
    h = round(img.height * w / img.width)
    img = img.resize((w, h), Image.LANCZOS)
    img.save(dst, "JPEG", quality=85, optimize=True)
    print(f"OK {dst.name} ({dst.stat().st_size // 1024} KB)")

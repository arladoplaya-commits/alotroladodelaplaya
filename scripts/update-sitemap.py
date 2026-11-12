#!/usr/bin/env python3
"""Regenera sitemap.xml a partir de data/menu.json (solo productos que existen en la carta)."""
import json, re, unicodedata, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://arladoplaya-commits.github.io/alotroladodelaplaya"

def slugify(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

menu = json.loads((ROOT / "data" / "menu.json").read_text(encoding="utf-8"))
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
def add(loc, freq, prio):
    out.append(f"<url>\n<loc>{loc}</loc>\n<lastmod>{now}</lastmod>\n<changefreq>{freq}</changefreq>\n<priority>{prio}</priority>\n</url>")
add(BASE + "/", "daily", "1")
seen = set()
for p in menu.get("products", []):
    sl = slugify(p["name"])
    if sl and sl not in seen:
        seen.add(sl)
        add(f"{BASE}/producto/{sl}", "weekly", "0.7")
out.append("</urlset>\n")
new = "\n".join(out)
path = ROOT / "sitemap.xml"
old = path.read_text(encoding="utf-8") if path.exists() else ""
strip = lambda x: re.sub(r"<lastmod>[^<]*</lastmod>", "", x)
if strip(old) != strip(new):
    path.write_text(new, encoding="utf-8")
    print("sitemap.xml actualizado:", len(seen), "productos")
else:
    print("sitemap.xml sin cambios")

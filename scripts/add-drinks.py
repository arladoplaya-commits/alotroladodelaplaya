#!/usr/bin/env python3
"""Agrega categorías y bebidas al seed.json de Al Otro Lado de la Playa."""
import json

SEED = "/home/z/my-project/src/data/seed.json"

with open(SEED, encoding="utf-8") as f:
    data = json.load(f)

# --- categorías de bebidas (después de Raciones) ---
new_cats = [
    {"id": "bebidas-refrescos", "name": "Refrescos y Malta", "emoji": "🥤", "visible": True},
    {"id": "bebidas-jugos", "name": "Jugos y Batidos", "emoji": "🧃", "visible": True},
    {"id": "bebidas-cafe", "name": "Café", "emoji": "☕", "visible": True},
]
cat_ids = {c["id"] for c in data["categories"]}
for c in new_cats:
    if c["id"] not in cat_ids:
        data["categories"].append(c)

# --- productos ---
# ingredientes: orden visual de arriba hacia abajo; el último es la "base" (vaso)
new_products = [
    {
        "id": "p-refrescos", "name": "Refrescos",
        "description": "Gaseosas bien frías: cola, naranja o limón. El clásico de la arena.",
        "price": 600, "category": "bebidas-refrescos",
        "image": "/images/products/p-refrescos.jpg", "emoji": "🥤",
        "tags": ["Bien frío"], "available": True, "featured": False,
        "ingredients": ["Rodaja de limón", "Gaseosa bien fría", "Hielo", "Vaso alto"],
    },
    {
        "id": "p-malta", "name": "Malta",
        "description": "Malta bien helada con su espuma dorada. Energía playera.",
        "price": 650, "category": "bebidas-refrescos",
        "image": "/images/products/p-malta.jpg", "emoji": "🥃",
        "tags": ["Bien frío"], "available": True, "featured": False,
        "ingredients": ["Espuma de malta", "Malta bien fría", "Hielo", "Vaso"],
    },
    {
        "id": "p-cerveza", "name": "Cerveza Importada",
        "description": "Lager importada, helada hasta el último sorbo. Brindis al atardecer.",
        "price": 650, "category": "bebidas-refrescos",
        "image": "/images/products/p-cerveza.jpg", "emoji": "🍺",
        "tags": ["Importada"], "available": True, "featured": False,
        "ingredients": ["Espuma bien fría", "Cerveza importada", "Vaso helado"],
    },
    {
        "id": "p-jugos", "name": "Jugos Naturales",
        "description": "Jugos de frutas naturales del día: naranja, papaya o piña.",
        "price": 700, "category": "bebidas-jugos",
        "image": "/images/products/p-jugos.jpg", "emoji": "🧃",
        "tags": ["Natural"], "available": True, "featured": False,
        "ingredients": ["Rodaja de naranja", "Jugo natural", "Hielo", "Vaso alto"],
    },
    {
        "id": "p-malteada", "name": "Malteada",
        "description": "Malteada cremosa con crema batida. Dulce como la brisa.",
        "price": 850, "category": "bebidas-jugos",
        "image": "/images/products/p-malteada.jpg", "emoji": "🥛",
        "tags": ["Crema batida"], "available": True, "featured": False,
        "ingredients": ["Crema batida", "Malteada de leche bien cremosa", "Vaso alto"],
    },
    {
        "id": "p-batidos", "name": "Batidos de Frutas Naturales",
        "description": "Batidos de frutas naturales batidas al momento. Pura marea dulce.",
        "price": 900, "category": "bebidas-jugos",
        "image": "/images/products/p-batidos.jpg", "emoji": "🍓",
        "tags": ["Natural"], "available": True, "featured": False,
        "ingredients": ["Frutas naturales frescas", "Batido cremoso", "Vaso alto"],
    },
    {
        "id": "p-maracuya", "name": "Jugo de Maracuyá",
        "description": "Maracuyá bien fría, entre dulce y ácida. El favorito del cangrejo.",
        "price": 900, "category": "bebidas-jugos",
        "image": "/images/products/p-maracuya.jpg", "emoji": "🍹",
        "tags": ["Natural"], "available": True, "featured": False,
        "ingredients": ["Semillas de maracuyá", "Jugo de maracuyá", "Hielo", "Vaso alto"],
    },
    {
        "id": "p-limonada", "name": "Limonada Natural",
        "description": "Limonada natural con hielo y menta fresca. Sombra y frescura.",
        "price": 700, "category": "bebidas-jugos",
        "image": "/images/products/p-limonada.jpg", "emoji": "🍋",
        "tags": ["Bien frío"], "available": True, "featured": False,
        "ingredients": ["Menta fresca", "Limonada natural", "Hielo", "Vaso alto"],
    },
    {
        "id": "p-limonada-brasilena", "name": "Limonada Brasileña",
        "description": "La clásica brasileña: limón batido con crema, suave y helada.",
        "price": 850, "category": "bebidas-jugos",
        "image": "/images/products/p-limonada-brasilena.jpg", "emoji": "🍋",
        "tags": ["Crema de limón"], "available": True, "featured": False,
        "ingredients": ["Crema de limón", "Limonada brasileña", "Hielo", "Vaso alto"],
    },
    {
        "id": "p-espresso", "name": "Café Espresso",
        "description": "Espresso corto e intenso con su crema dorada. Chispa instantánea.",
        "price": 250, "category": "bebidas-cafe",
        "image": "/images/products/p-espresso.jpg", "emoji": "☕",
        "tags": [], "available": True, "featured": False,
        "ingredients": ["Espuma dorada", "Café espresso", "Taza caliente"],
    },
    {
        "id": "p-cortado", "name": "Café Cortado",
        "description": "Espresso cortado con un chorro de leche. Equilibrio perfecto.",
        "price": 350, "category": "bebidas-cafe",
        "image": "/images/products/p-cortado.jpg", "emoji": "☕",
        "tags": [], "available": True, "featured": False,
        "ingredients": ["Chorro de leche", "Café cortado", "Vasito de cristal"],
    },
    {
        "id": "p-bombon", "name": "Café Bombón",
        "description": "Espresso sobre leche condensada, en capas como un atardecer.",
        "price": 450, "category": "bebidas-cafe",
        "image": "/images/products/p-bombon.jpg", "emoji": "☕",
        "tags": ["Dulce"], "available": True, "featured": False,
        "ingredients": ["Café recién hecho", "Leche condensada", "Vasito de cristal"],
    },
]

prod_ids = {p["id"] for p in data["products"]}
added = 0
for p in new_products:
    if p["id"] not in prod_ids:
        data["products"].append(p)
        added += 1

data["version"] = 3
data["updatedAt"] = "2026-09-26T07:30:00.000Z"

with open(SEED, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"Categorías nuevas: {[c['id'] for c in new_cats]}")
print(f"Productos añadidos: {added} (total {len(data['products'])})")

"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useCustomerStore, type Lang } from "@/lib/customer";
import type { Category, Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Carta en español / inglés.                                         */
/*  · El idioma sale del teléfono (inglés si el teléfono está en        */
/*    inglés) y el cliente lo cambia con el botón ES/EN.                */
/*  · Los textos van en pares: tr("Armar pedido", "Build your order").  */
/*  · El pedido que llega por WhatsApp siempre va en español.           */
/* ------------------------------------------------------------------ */

function detectLang(): Lang {
  if (typeof navigator === "undefined") return "es";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const first = (langs[0] ?? "es").toLowerCase();
  return first.startsWith("en") ? "en" : "es";
}

const noopSubscribe = () => () => {};

/** El servidor pinta en español; tras hidratar se usa el idioma guardado
   (así React no se queja de textos distintos al cargar). */
export function useLang(): Lang {
  const pref = useCustomerStore((s) => s.prefs.lang);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!hydrated) return "es";
  return pref ?? detectLang();
}

export type Tr = (es: string, en: string) => string;

export function useTr(): Tr {
  const lang = useLang();
  return useCallback((es: string, en: string) => (lang === "en" ? en : es), [lang]);
}

export function productName(p: Pick<Product, "name" | "nameEn">, lang: Lang): string {
  return lang === "en" && p.nameEn ? p.nameEn : p.name;
}

export function productDesc(p: Pick<Product, "description" | "descriptionEn">, lang: Lang): string {
  return lang === "en" && p.descriptionEn ? p.descriptionEn : p.description;
}

export function categoryName(c: Pick<Category, "name" | "nameEn">, lang: Lang): string {
  return lang === "en" && c.nameEn ? c.nameEn : c.name;
}

/* Ingredientes y agregos más comunes (el resto se muestra en español) */
const INGREDIENTS_EN: Record<string, string> = {
  "pan de papa": "Potato bun",
  "pan de perro": "Hot dog bun",
  "pan baguette": "Baguette",
  "carne de pollo": "Chicken patty",
  "carne de cerdo": "Pork patty",
  "carne de res": "Beef patty",
  salchicha: "Sausage",
  salchichas: "Sausages",
  vegetales: "Veggies",
  ketchup: "Ketchup",
  mostaza: "Mustard",
  mayonesa: "Mayo",
  "chips de boniato": "Sweet potato chips",
  "queso gouda": "Gouda cheese",
  jamon: "Ham",
  "pina glaseada": "Glazed pineapple",
  cebolla: "Onion",
  huevo: "Egg",
  "lomo ahumado": "Smoked pork loin",
  albondigas: "Meatballs",
  croquetas: "Croquettes",
  "fajitas de pollo": "Chicken fajitas",
  "papas fritas": "French fries",
  "alitas de pollo": "Chicken wings",
  "salsa de la casa": "House sauce",
  hielo: "Ice",
  vaso: "Glass",
  "vaso alto": "Tall glass",
  "vaso helado": "Frosted glass",
  "vasito de cristal": "Small glass cup",
  "taza caliente": "Hot cup",
  "gaseosa bien fria": "Ice-cold soda",
  "malta bien fria": "Ice-cold malta",
  "espuma de malta": "Malta foam",
  "cerveza importada": "Imported beer",
  "espuma dorada": "Golden foam",
  "espuma bien fria": "Cold foam",
  "jugo natural": "Fresh juice",
  "frutas naturales frescas": "Fresh fruit",
  "batido cremoso": "Creamy smoothie",
  "malteada de leche bien cremosa": "Creamy milkshake",
  "crema batida": "Whipped cream",
  "jugo de maracuya": "Passion fruit juice",
  "semillas de maracuya": "Passion fruit seeds",
  "limonada natural": "Fresh lemonade",
  "limonada brasilena": "Brazilian lemonade",
  "crema de limon": "Lemon cream",
  "rodaja de limon": "Lemon slice",
  "rodaja de naranja": "Orange slice",
  "menta fresca": "Fresh mint",
  "cafe espresso": "Espresso",
  "cafe cortado": "Cortado",
  "cafe recien hecho": "Fresh coffee",
  "chorro de leche": "Splash of milk",
  "leche condensada": "Condensed milk",
};

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function ingredientName(name: string, lang: Lang): string {
  if (lang !== "en") return name;
  return INGREDIENTS_EN[norm(name)] ?? name;
}

/** «Sin mostaza y ketchup» / «No mustard or ketchup» */
export function withoutText(list: string[], lang: Lang): string {
  if (!list.length) return "";
  const names = list.map((n) => ingredientName(n, lang).toLowerCase());
  const last = names.pop();
  if (lang === "en") return `No ${names.length ? `${names.join(", ")} or ${last}` : last}`;
  return `Sin ${names.length ? `${names.join(", ")} y ${last}` : last}`;
}

/** Igual que useTr pero fuera de componentes (avisos, toasts sueltos) */
export function trNow(es: string, en: string): string {
  const lang = useCustomerStore.getState().prefs.lang ?? detectLang();
  return lang === "en" ? en : es;
}

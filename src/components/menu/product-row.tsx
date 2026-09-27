"use client";

import Image from "next/image";
import { Heart, Layers, ShoppingBag } from "lucide-react";
import { money } from "@/lib/store";
import type { Product } from "@/lib/types";
import { productDesc, productName, useLang, useTr } from "@/lib/i18n";

const TAGS_EN: Record<string, string> = {
  "Bien frío": "Ice cold",
  "Con vegetales": "With veggies",
  "Crema batida": "Whipped cream",
  "Crema de limón": "Lemon cream",
  Crujiente: "Crunchy",
  "Doble carne": "Double patty",
  Dulce: "Sweet",
  "Dulce-salado": "Sweet & salty",
  Importada: "Imported",
  Natural: "Fresh",
  "Para compartir": "To share",
  "Queso gouda": "Gouda cheese",
};

/** Fondo de olitas playeras para las tarjetas de producto */
export function WaterBackdrop() {
  return (
    <span
      aria-hidden="true"
      className="aol-water pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden rounded-b-3xl"
    >
      <svg
        viewBox="0 0 400 72"
        preserveAspectRatio="none"
        className="block h-11 w-full sm:h-12"
      >
        <path
          d="M0 34 C 55 20, 110 48, 175 38 S 300 16, 400 32 L400 72 L0 72 Z"
          fill="#59b7d4"
          opacity="0.10"
        />
        <path
          d="M0 48 C 65 34, 140 58, 220 46 S 340 32, 400 46 L400 72 L0 72 Z"
          fill="#2f9db8"
          opacity="0.11"
        />
        <path
          d="M0 60 C 75 50, 155 66, 235 58 S 355 48, 400 58 L400 72 L0 72 Z"
          fill="#7dd3e8"
          opacity="0.17"
        />
        <circle cx="70" cy="26" r="3" fill="#7dd3e8" opacity="0.22" />
        <circle cx="330" cy="22" r="2.4" fill="#7dd3e8" opacity="0.2" />
        <circle cx="255" cy="30" r="2" fill="#59b7d4" opacity="0.22" />
      </svg>
    </span>
  );
}

export function ProductRow({
  product,
  currency,
  onArm,
  fav,
  onFav,
}: {
  product: Product;
  currency: string;
  onArm: (p: Product) => void;
  fav: boolean;
  onFav: () => void;
}) {
  const tr = useTr();
  const lang = useLang();
  const name = productName(product, lang);
  return (
    <article
      className={`aol-card aol-float group relative flex gap-3.5 rounded-3xl border border-[#f0dfc0] bg-gradient-to-b from-white via-white to-[#eef9fc] p-3.5 ${
        product.available ? "" : "opacity-60 grayscale"
      }`}
    >
      <WaterBackdrop />
      {product.featured && (
        <span className="absolute -top-2.5 left-4 z-10 inline-flex rotate-[-4deg] items-center gap-1 rounded-full bg-[#f2c230] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#7a5410] shadow-sm">
          ⭐ {tr("Recomendado Chef", "Chef's pick")}
        </span>
      )}
      <div className="relative size-20 shrink-0 sm:size-24">
        <button
          type="button"
          onClick={() => product.available && onArm(product)}
          disabled={!product.available}
          className="absolute inset-0 overflow-hidden rounded-2xl bg-[#fdf3e0] ring-1 ring-[#f0dfc0]"
          aria-label={tr(`Ver capas de ${product.name}`, `See layers of ${name}`)}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              sizes="96px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-3xl" aria-hidden="true">
              {product.emoji}
            </span>
          )}
          <span className="pointer-events-none absolute inset-x-1 bottom-1 inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#4a3b28]/75 px-1.5 py-1 text-[10px] font-bold leading-none text-white transition group-hover:bg-[#4a3b28]/85">
            <Layers className="size-3 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{tr("Ver", "See")}&nbsp;</span>
            {tr("Capas", "Layers")}
          </span>
        </button>
        <button
          type="button"
          onClick={onFav}
          aria-pressed={fav}
          aria-label={
            fav
              ? tr(`Quitar ${product.name} de favoritos`, `Remove ${name} from favorites`)
              : tr(`Guardar ${product.name} en favoritos`, `Save ${name} to favorites`)
          }
          className="absolute right-1.5 top-1.5 z-10 grid size-7 place-items-center rounded-full bg-[#4a3b28]/60 text-white shadow-sm transition hover:bg-[#4a3b28]/80 active:scale-90"
        >
          <Heart
            className={`size-3.5 transition ${fav ? "scale-110 fill-[#ff8a7a] text-[#ff8a7a]" : "text-white"}`}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-[#4a3b28]">
            {name}
          </h3>
          <span className="aol-price shrink-0 rounded-full bg-[#fdf3e0] px-2.5 py-1 font-display text-sm text-[#c2542f] ring-1 ring-[#f0dfc0]">
            {money(currency, product.price)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#8a7350]">
          {productDesc(product, lang)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {product.tags.map((t) => (
            <span
              key={t}
              className="aol-tag rounded-full bg-[#e2574c]/10 px-2 py-0.5 text-[11px] font-bold text-[#c2542f]"
            >
              {lang === "en" ? (TAGS_EN[t] ?? t) : t}
            </span>
          ))}
          {product.available ? (
            <button
              type="button"
              onClick={() => onArm(product)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#e2574c] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-[0_5px_14px_-4px_rgba(226,87,76,0.55)] transition hover:bg-[#d34a40] active:scale-95"
            >
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              {tr("Armar", "Build")}
              <span className="-ml-0.5 hidden min-[381px]:inline">{tr("pedido", "order")}</span>
            </button>
          ) : (
            <span className="ml-auto rounded-full bg-[#8a7350] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white">
              {tr("Se acabó hoy", "Sold out today")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

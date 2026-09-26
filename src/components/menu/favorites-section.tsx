"use client";

import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { ProductRow } from "./product-row";
import { CatTitle } from "./section-title";

/* ------------------------------------------------------------------ */
/*  Sección Favoritos: lo que el cliente guardó con ❤️, más sus        */
/*  gustos (qué arma más seguido). Todo queda en su teléfono.          */
/* ------------------------------------------------------------------ */

export interface TasteEntry {
  product: Product;
  n: number;
}

interface FavoritesSectionProps {
  favorites: Product[];
  tastes: TasteEntry[];
  totalArmed: number;
  currency: string;
  onArm: (p: Product) => void;
  favProps: (p: Product) => { fav: boolean; onFav: () => void };
  onBrowse: () => void;
}

export function FavoritesSection({
  favorites,
  tastes,
  totalArmed,
  currency,
  onArm,
  favProps,
  onBrowse,
}: FavoritesSectionProps) {
  return (
    <section aria-label="Tus favoritos">
      <CatTitle emoji="❤️">Tus favoritos</CatTitle>
      <p className="aol-sub mb-4 text-sm font-semibold text-[#8a7350]">
        Guardaditos en este teléfono, listos para pedirlos otra vez.
      </p>

      {favorites.length === 0 ? (
        <div className="aol-empty flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-10 text-center">
          <span className="text-5xl" aria-hidden="true">
            🐚
          </span>
          <p className="font-display text-lg text-[#c2542f]">
            Aún no tienes favoritos
          </p>
          <p className="max-w-xs text-sm leading-snug text-[#8a7350]">
            Toca el corazón ❤️ en cualquier antojo de la carta y lo guardamos
            aquí para tu próxima marea.
          </p>
          <Button
            type="button"
            onClick={onBrowse}
            className="mt-2 rounded-full bg-[#e2574c] px-5 font-extrabold text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] hover:bg-[#d34a40]"
          >
            🌊 Explorar el menú
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {favorites.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              currency={currency}
              onArm={onArm}
              {...favProps(p)}
            />
          ))}
        </div>
      )}

      {/* Tus gustos: lo que armas más seguido */}
      <div className="aol-tastes mt-6 rounded-3xl border border-[#f0dfc0] bg-white/70 p-4 ring-1 ring-[#f0dfc0]">
        <p className="mb-1 flex items-center gap-1.5 font-display text-lg text-[#c2542f]">
          <span aria-hidden="true">🥥</span> Tus gustos de la marea
        </p>
        <p className="mb-3 text-xs leading-snug text-[#8a7350]">
          {totalArmed > 0
            ? `Has armado ${totalArmed} pedido${totalArmed === 1 ? "" : "s"}. Esto es lo que más te gusta:`
            : "Cada vez que armas un pedido lo apuntamos para conocerte mejor."}
        </p>
        {tastes.length > 0 ? (
          <ul className="grid gap-1.5 sm:grid-cols-3">
            {tastes.map(({ product, n }, i) => (
              <li
                key={product.id}
                className="flex items-center gap-2 rounded-2xl bg-[#fdf8ec] px-3 py-2"
              >
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[11px] font-black text-[#c2542f] ring-1 ring-[#f0dfc0]"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#4a3b28]">
                  {product.emoji} {product.name}
                </span>
                <span className="shrink-0 rounded-full bg-[#e2574c]/10 px-2 py-0.5 text-[11px] font-bold text-[#c2542f]">
                  {n}×
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-[#fdf8ec] px-3 py-2.5 text-sm text-[#8a7350]">
            Todavía no hay datos: arma tu primer pedido y empezamos la cuenta 🌊
          </p>
        )}
      </div>
    </section>
  );
}

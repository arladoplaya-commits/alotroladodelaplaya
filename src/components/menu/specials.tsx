"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { money } from "@/lib/store";
import { useCartStore } from "@/lib/cart";
import { buzz } from "@/lib/customer";
import type { Combo, MenuData, Product } from "@/lib/types";
import { CatTitle } from "./section-title";
import { ProductRow } from "./product-row";

/* ------------------------------------------------------------------ */
/*  Especiales configurables desde el panel: combos y menú del día     */
/* ------------------------------------------------------------------ */

interface ComboView {
  combo: Combo;
  products: { product: Product; qty: number }[];
  regular: number;
}

/** Combos activos cuyos productos existen y están disponibles hoy */
export function useActiveCombos(data: MenuData): ComboView[] {
  return useMemo(() => {
    const byId = new Map(data.products.map((p) => [p.id, p]));
    return data.combos
      .filter((c) => c.active && c.items.length > 0)
      .map((combo) => {
        const products = combo.items
          .map((it) => ({ product: byId.get(it.productId), qty: it.qty }))
          .filter((x): x is { product: Product; qty: number } => !!x.product);
        const regular = products.reduce((a, x) => a + x.product.price * x.qty, 0);
        return { combo, products, regular };
      })
      .filter(
        (v) =>
          v.products.length === v.combo.items.length &&
          v.products.every((x) => x.product.available)
      );
  }, [data.combos, data.products]);
}

export function CombosSection({ data }: { data: MenuData }) {
  const combos = useActiveCombos(data);
  const add = useCartStore((s) => s.add);
  const currency = data.settings.currency;

  if (!combos.length) return null;

  const addCombo = ({ combo }: ComboView) => {
    add({
      productId: combo.id,
      comboId: combo.id,
      name: combo.name,
      emoji: combo.emoji,
      qty: 1,
      unitPrice: combo.price,
      agregoIds: [],
      agregoNames: [],
      removed: [],
      notes: "",
    });
    buzz(35);
    toast.success(`${combo.emoji} ${combo.name} al carrito`, {
      description: "Combo listo para la marea 🌊",
    });
  };

  return (
    <section className="mt-6" aria-label="Combos y ofertas">
      <CatTitle emoji="🔥">Combos y ofertas</CatTitle>
      <div className="nice-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {combos.map((v) => {
          const save = v.regular - v.combo.price;
          const cover = v.products.find((x) => x.product.image)?.product.image;
          return (
            <article
              key={v.combo.id}
              className="aol-featured aol-float relative flex w-64 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#f0dfc0] sm:w-72"
            >
              <div className="relative h-32 w-full bg-[#fdf3e0]">
                {cover ? (
                  <Image src={cover} alt="" fill sizes="288px" className="object-cover" />
                ) : (
                  <span className="grid h-full place-items-center text-5xl" aria-hidden="true">
                    {v.combo.emoji}
                  </span>
                )}
                {save > 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-[#f2c230] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#7a5410] shadow-sm">
                    Ahorras {money(currency, save)}
                  </span>
                )}
                <span className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-white/90 text-2xl shadow-sm" aria-hidden="true">
                  {v.combo.emoji}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="font-display text-lg leading-tight text-[#4a3b28]">
                  {v.combo.name}
                </h3>
                <p className="text-xs leading-snug text-[#8a7350]">
                  {v.products.map((x) => `${x.qty}× ${x.product.name}`).join(" · ")}
                </p>
                {v.combo.description && (
                  <p className="text-xs italic leading-snug text-[#a58a5f]">
                    {v.combo.description}
                  </p>
                )}
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="leading-tight">
                    {save > 0 && (
                      <span className="block text-xs font-semibold text-[#a58a5f] line-through">
                        {money(currency, v.regular)}
                      </span>
                    )}
                    <span className="font-display text-xl text-[#c2542f]">
                      {money(currency, v.combo.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addCombo(v)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#e2574c] px-3.5 py-2 text-xs font-extrabold text-white shadow-[0_5px_14px_-4px_rgba(226,87,76,0.55)] transition hover:bg-[#d34a40] active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function DailySection({
  data,
  onArm,
  favProps,
}: {
  data: MenuData;
  onArm: (p: Product) => void;
  favProps: (p: Product) => { fav: boolean; onFav: () => void };
}) {
  const daily = data.settings.daily;
  const list = useMemo(
    () =>
      daily.productIds
        .map((id) => data.products.find((p) => p.id === id))
        .filter((p): p is Product => !!p && p.available),
    [daily.productIds, data.products]
  );
  if (!daily.active || !list.length) return null;
  return (
    <section
      className="aol-daily mt-6 rounded-3xl border-2 border-dashed border-[#e2574c]/40 bg-[#e2574c]/5 p-3 pt-4"
      aria-label={daily.title || "Menú del día"}
    >
      <CatTitle emoji="🍽️">{daily.title || "Menú del día"}</CatTitle>
      {daily.note && (
        <p className="aol-sub -mt-1 mb-3 text-center text-sm font-semibold text-[#8a7350]">
          {daily.note}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {list.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            currency={data.settings.currency}
            onArm={onArm}
            {...favProps(p)}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Ban, Flame, Minus, Plus, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCartStore, unitPriceFor } from "@/lib/cart";
import { money, useMenuStore } from "@/lib/store";
import { buzz, useCustomerStore } from "@/lib/customer";
import { removableOf } from "@/lib/ingredients";
import { ingredientName, productDesc, productName, useLang, useTr, withoutText } from "@/lib/i18n";
import type { Product } from "@/lib/types";
import { LayerStack } from "./layer-stack";

/* ------------------------------------------------------------------ */
/*  Personalizador: elige agregos, escribe notas y añade al carrito.   */
/* ------------------------------------------------------------------ */

interface CustomizerSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama después de añadir al carrito (para sugerir acompañantes) */
  onAdded?: (product: Product) => void;
}

export function CustomizerSheet({ product, open, onOpenChange, onAdded }: CustomizerSheetProps) {
  const tr = useTr();
  const lang = useLang();
  const agregos = useMenuStore((s) => s.data.agregos);
  const settings = useMenuStore((s) => s.data.settings);
  const add = useCartStore((s) => s.add);

  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const removedPrefs = useCustomerStore((s) => s.removedPrefs);
  const setRemovedPref = useCustomerStore((s) => s.setRemovedPref);
  /* Lo que el cliente quitó en esta visita; si aún no tocó nada, se usa
     lo que quitó la última vez (sus gustos recordados). */
  const [touched, setTouched] = useState<{ pid: string | null; list: string[] }>({
    pid: null,
    list: [],
  });
  const [remember, setRemember] = useState(true);

  const removable = useMemo(
    () => (product ? removableOf(product.ingredients) : []),
    [product]
  );
  const remembered = product
    ? (removedPrefs[product.id] ?? []).filter((x) => removable.includes(x))
    : [];
  const fromMemory = !!product && touched.pid !== product.id && remembered.length > 0;
  const removed = product && touched.pid === product.id ? touched.list : remembered;

  const toggleRemoved = (ing: string) => {
    if (!product) return;
    const next = removed.includes(ing)
      ? removed.filter((x) => x !== ing)
      : [...removed, ing];
    setTouched({ pid: product.id, list: next });
    buzz(12);
  };

  const availableAgregos = useMemo(
    () => agregos.filter((a) => a.available),
    [agregos]
  );

  // Las bebidas no llevan agregos de comida (queso, jamón...)
  const isDrink = product?.category.startsWith("bebidas-") ?? false;

  const chosen = useMemo(
    () => availableAgregos.filter((a) => selected.includes(a.id)),
    [availableAgregos, selected]
  );

  const unitPrice = useMemo(
    () => (product ? unitPriceFor(product, chosen) : 0),
    [product, chosen]
  );

  const totalCustom = unitPrice * qty;
  const ingredientLabel = (n: string) => ingredientName(n, lang);

  const reset = () => {
    setSelected([]);
    setQty(1);
    setNotes("");
    setTouched({ pid: null, list: [] });
  };

  const handleAdd = () => {
    if (!product) return;
    add({
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      qty,
      unitPrice,
      agregoIds: chosen.map((a) => a.id),
      agregoNames: chosen.map((a) => a.name),
      removed,
      notes: notes.trim().slice(0, 140),
    });
    if (remember && removable.length) setRemovedPref(product.id, removed);
    // Guardamos sus gustos y confirmamos con un toquecito
    useCustomerStore.getState().bumpOrderCount(product.id, qty);
    buzz(35);
    const shown = productName(product, lang);
    toast.success(tr(`${product.emoji} ${shown} al carrito`, `${product.emoji} ${shown} added`), {
      description:
        [
          chosen.length ? `${tr("Con", "With")} ${chosen.map((a) => ingredientLabel(a.name)).join(", ")}` : "",
          withoutText(removed, lang),
        ]
          .filter(Boolean)
          .join(" · ") || tr("Listo para la marea 🌊", "Ready for the tide 🌊"),
    });
    reset();
    onOpenChange(false);
    onAdded?.(product);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent
        side="bottom"
        className="aol-sheet max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        {product && (
          <>
            <SheetHeader className="gap-2 p-0 pt-3 text-left">
              {/* Foto grande con nombre y precio, como una postal */}
              <div className="relative h-48 overflow-hidden rounded-3xl bg-[#fdf3e0] sm:h-56">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 560px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-6xl" aria-hidden="true">
                    {product.emoji}
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#281a0e]/80 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
                  <SheetTitle className="font-display text-[26px] leading-none text-white">
                    {productName(product, lang)}
                  </SheetTitle>
                  <span className="shrink-0 rounded-full bg-white/95 px-3 py-1 font-display text-base text-[#c2542f]">
                    {money(settings.currency, product.price)}
                  </span>
                </div>
              </div>
              <SheetDescription className="text-sm text-[#8a7350]">
                {productDesc(product, lang)}
              </SheetDescription>
            </SheetHeader>

            {/* Capas: una franja por ingrediente (toca la ✕ para quitarla) */}
            <div className="my-4 rounded-3xl bg-[#fdf3e0]/70 p-4 ring-1 ring-[#f0dfc0]">
              <LayerStack
                ingredients={product.ingredients}
                extras={chosen.map((a) => a.name)}
                removed={removed}
                onToggle={toggleRemoved}
                name={product.name}
              />
            </div>

            {/* Quitar ingredientes */}
            {removable.length > 0 && (
              <div className="aol-remove mb-4">
                {removed.length > 0 && (
                  <div className="mb-2 flex items-center gap-2">
                    <Ban className="size-4 text-[#e2574c]" aria-hidden="true" />
                    <h3 className="text-sm font-extrabold text-[#4a3b28]">{tr("Tus cambios", "Your changes")}</h3>
                    <button
                      type="button"
                      onClick={() => setTouched({ pid: product.id, list: [] })}
                      className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#c2542f] hover:underline"
                    >
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      {tr("Ponerlo todo", "Put it all back")}
                    </button>
                  </div>
                )}
                {fromMemory && (
                  <p className="mb-2 rounded-xl bg-[#f2c230]/20 px-3 py-2 text-xs font-bold text-[#7a5410]">
                    💾 {tr("Te lo dejamos como la última vez:", "Just like last time:")} {withoutText(removed, lang).toLowerCase()}
                  </p>
                )}
                {removed.length > 0 && (
                  <p className="aol-removed mb-1 text-sm font-extrabold text-[#c0392b]">
                    {withoutText(removed, lang)}
                  </p>
                )}
                <label className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-[#8a7350]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[#e2574c]"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  {tr("Recordar mis gustos para la próxima vez", "Remember my choices for next time")}
                </label>
              </div>
            )}

            {/* Agregos (solo comida) */}
            {!isDrink && (
              <>
                <div className="mb-2 mt-1 flex items-center gap-2">
                  <Flame className="size-4 text-[#e2574c]" aria-hidden="true" />
                  <h3 className="text-sm font-extrabold text-[#4a3b28]">
                    {tr("Agregos disponibles hoy", "Extras available today")}
                  </h3>
                </div>

                {availableAgregos.length === 0 ? (
                  <p className="rounded-xl bg-[#fdf3e0] px-3 py-2.5 text-sm text-[#8a7350]">
                    {tr("Hoy no hay agregos disponibles", "No extras available today")}
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {availableAgregos.map((a) => {
                      const checked = selected.includes(a.id);
                      return (
                        <li key={a.id}>
                          <label
                            className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3.5 py-2.5 transition ${
                              checked
                                ? "border-[#e2574c] bg-[#e2574c]/8"
                                : "border-[#f0dfc0] bg-white hover:border-[#e8c9a0]"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                className="size-4 accent-[#e2574c]"
                                checked={checked}
                                onChange={(e) =>
                                  setSelected((prev) =>
                                    e.target.checked
                                      ? [...prev, a.id]
                                      : prev.filter((id) => id !== a.id)
                                  )
                                }
                              />
                              <span className="text-sm font-semibold text-[#4a3b28]">
                                {ingredientLabel(a.name)}
                              </span>
                            </span>
                            <span className="text-sm font-bold text-[#c2542f]">
                              + {money(settings.currency, a.price)}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
            {isDrink && (
              <p className="mt-1 flex items-center gap-2 rounded-xl bg-[#eef9fc] px-3 py-2.5 text-sm font-semibold text-[#2b7a93] ring-1 ring-[#bfe3f2]">
                <span aria-hidden="true">🧊</span>
                {tr("Bebida bien fría · puedes pedirnos el hielo aparte en las notas", "Served ice-cold · ask for ice on the side in the notes")}
              </p>
            )}

            {/* Notas */}
            <div className="mt-4">
              <h3 className="mb-1.5 text-sm font-extrabold text-[#4a3b28]">
                {tr("Notas para la cocina 📝", "Notes for the kitchen 📝")}
              </h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 140))}
                placeholder={tr("Ej: sin cebolla, salsas aparte, bien dorado...", "E.g. no onion, sauces on the side, extra crispy...")}
                className="min-h-[64px] resize-none border-[#f0dfc0] bg-white text-sm placeholder:text-[#c4b08c] focus-visible:ring-[#e2574c]"
              />
              <p className="mt-1 text-right text-[11px] text-[#a58a5f]">
                {notes.length}/140
              </p>
            </div>

            <SheetFooter className="mt-2 flex-col gap-3 sm:flex-col">
              <div className="flex items-center justify-between">
                {/* Cantidad */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full border-[#f0dfc0] text-[#c2542f] hover:bg-[#fdf3e0]"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label={tr("Quitar uno", "One less")}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="min-w-6 text-center text-lg font-extrabold text-[#4a3b28]">
                    {qty}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-full border-[#f0dfc0] text-[#c2542f] hover:bg-[#fdf3e0]"
                    onClick={() => setQty((q) => Math.min(30, q + 1))}
                    aria-label={tr("Agregar uno", "One more")}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {/* Total */}
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a58a5f]">
                    {tr("Total personalizado", "Your total")}
                  </p>
                  <p className="font-display text-xl text-[#c2542f]">
                    {money(settings.currency, totalCustom)}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAdd}
                className="h-12 w-full rounded-2xl bg-[#e2574c] text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40] active:scale-[0.98]"
              >
                <ShoppingBag className="size-5" />
                {tr("Agregar al carrito", "Add to cart")} · {money(settings.currency, totalCustom)}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Flame, Minus, Plus, ShoppingBag } from "lucide-react";
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
import type { Product } from "@/lib/types";
import { ExplodedView } from "./exploded-view";

/* ------------------------------------------------------------------ */
/*  Personalizador: elige agregos, escribe notas y añade al carrito.   */
/* ------------------------------------------------------------------ */

interface CustomizerSheetProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomizerSheet({ product, open, onOpenChange }: CustomizerSheetProps) {
  const agregos = useMenuStore((s) => s.data.agregos);
  const settings = useMenuStore((s) => s.data.settings);
  const add = useCartStore((s) => s.add);

  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

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

  const reset = () => {
    setSelected([]);
    setQty(1);
    setNotes("");
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
      notes: notes.trim().slice(0, 140),
    });
    // Guardamos sus gustos y confirmamos con un toquecito
    useCustomerStore.getState().bumpOrderCount(product.id, qty);
    buzz(35);
    toast.success(`${product.emoji} ${product.name} al carrito`, {
      description: chosen.length
        ? `Con ${chosen.map((a) => a.name).join(", ")}`
        : "Listo para la marea 🌊",
    });
    reset();
    onOpenChange(false);
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
        className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        {product && (
          <>
            <SheetHeader className="items-center gap-1 pb-0 text-center sm:text-center">
              <SheetTitle className="font-display text-2xl text-[#c2542f]">
                {product.emoji} {product.name}
              </SheetTitle>
              <SheetDescription className="text-sm text-[#8a7350]">
                {product.description}
              </SheetDescription>
            </SheetHeader>

            {/* Vista explotada */}
            <div className="my-4 rounded-2xl bg-[#fdf3e0]/70 p-4 ring-1 ring-[#f0dfc0]">
              <ExplodedView
                ingredients={product.ingredients}
                emoji={product.emoji}
                name={product.name}
              />
            </div>

            {/* Agregos (solo comida) */}
            {!isDrink && (
              <>
                <div className="mb-2 mt-1 flex items-center gap-2">
                  <Flame className="size-4 text-[#e2574c]" aria-hidden="true" />
                  <h3 className="text-sm font-extrabold text-[#4a3b28]">
                    Agregos disponibles hoy
                  </h3>
                </div>

                {availableAgregos.length === 0 ? (
                  <p className="rounded-xl bg-[#fdf3e0] px-3 py-2.5 text-sm text-[#8a7350]">
                    Hoy no hay agregos disponibles
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
                                {a.name}
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
                Bebida bien fría · puedes pedirnos el hielo aparte en las notas
              </p>
            )}

            {/* Notas */}
            <div className="mt-4">
              <h3 className="mb-1.5 text-sm font-extrabold text-[#4a3b28]">
                Notas para la cocina 📝
              </h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 140))}
                placeholder="Ej: sin cebolla, salsas aparte, bien dorado..."
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
                    aria-label="Quitar uno"
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
                    aria-label="Agregar uno"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {/* Total */}
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a58a5f]">
                    Total personalizado
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
                Agregar al carrito · {money(settings.currency, totalCustom)}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

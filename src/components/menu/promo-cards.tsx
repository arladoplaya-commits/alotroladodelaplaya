"use client";

import Image from "next/image";
import { Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/cart";
import { buzz, useCustomerStore } from "@/lib/customer";
import { money, useMenuStore } from "@/lib/store";
import { loyaltyProgress, rebuildOrder } from "@/lib/promos";
import { productName, useLang, useTr, withoutText } from "@/lib/i18n";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tarjetas extra de la carta:                                        */
/*  · Repetir mi último pedido                                         */
/*  · Tarjeta de fidelidad (sellos)                                    */
/*  · ¿Te lo acompañamos? (sugerencias tras añadir comida)             */
/* ------------------------------------------------------------------ */

export function RepeatLastOrderCard({ onDone }: { onDone?: () => void }) {
  const lastOrder = useCustomerStore((s) => s.lastOrder);
  const data = useMenuStore((s) => s.data);
  const add = useCartStore((s) => s.add);
  const tr = useTr();
  const lang = useLang();
  if (!lastOrder?.items.length) return null;

  const when = new Date(lastOrder.at);
  const date = when.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
    day: "numeric",
    month: "short",
  });

  const repeat = () => {
    const { items, skipped } = rebuildOrder(lastOrder.items, data);
    if (!items.length) {
      toast.error(tr("Hoy no queda nada de tu último pedido 😔", "Nothing from your last order is available today 😔"));
      return;
    }
    for (const it of items) add(it);
    buzz(35);
    toast.success(tr("🔁 Tu pedido de siempre está en el carrito", "🔁 Your usual order is in the cart"), {
      description: skipped.length
        ? tr(`Hoy no hay: ${skipped.join(", ")}`, `Not available today: ${skipped.join(", ")}`)
        : tr("Con los precios de hoy 🌊", "With today's prices 🌊"),
    });
    onDone?.();
  };

  return (
    <div className="aol-card rounded-3xl border border-[#f0dfc0] bg-white p-4 text-left">
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-[#eef9fc] text-lg" aria-hidden="true">
          🔁
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-tight text-[#c2542f]">
            {tr("Repetir mi último pedido", "Repeat my last order")}
          </p>
          <p className="text-xs text-[#8a7350]">{tr(`Lo pediste el ${date}`, `You ordered it on ${date}`)}</p>
        </div>
      </div>
      <ul className="mb-3 grid gap-1 text-sm text-[#4a3b28]">
        {lastOrder.items.slice(0, 5).map((it, i) => {
          const p = data.products.find((x) => x.id === it.productId);
          const name = p && !it.comboId ? productName(p, lang) : it.name;
          return (
            <li key={i} className="truncate">
              {it.emoji} {it.qty}× <b>{name}</b>
              {it.removed.length > 0 && (
                <span className="text-xs font-bold text-[#c0392b]"> · {withoutText(it.removed, lang)}</span>
              )}
            </li>
          );
        })}
        {lastOrder.items.length > 5 && (
          <li className="text-xs text-[#8a7350]">
            {tr(`y ${lastOrder.items.length - 5} más…`, `and ${lastOrder.items.length - 5} more…`)}
          </li>
        )}
      </ul>
      <button
        type="button"
        onClick={repeat}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#e2574c] text-sm font-extrabold text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] transition hover:bg-[#d34a40] active:scale-[0.98]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {tr("Pedirlo otra vez", "Order it again")}
      </button>
    </div>
  );
}

/** Tarjeta de sellos. `pending` = este carrito suma un sello al enviarse */
export function LoyaltyCard({ pending = false }: { pending?: boolean }) {
  const loyalty = useMenuStore((s) => s.data.settings.loyalty);
  const stamps = useCustomerStore((s) => s.stamps);
  const tr = useTr();
  if (!loyalty.enabled) return null;
  const { goal, filled, rewardReady } = loyaltyProgress(stamps, loyalty.stamps);

  return (
    <div className="aol-card rounded-3xl border border-[#f0dfc0] bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-display text-lg text-[#c2542f]">
          ⭐ {tr("Tarjeta de la orilla", "Beach loyalty card")}
        </p>
        <span className="text-xs font-bold text-[#8a7350]">
          {filled}/{goal}
        </span>
      </div>
      <ol className="mb-2 flex flex-wrap gap-1.5" aria-label={tr(`${filled} de ${goal} sellos`, `${filled} of ${goal} stamps`)}>
        {Array.from({ length: goal }, (_, i) => {
          const done = i < filled;
          const last = i === goal - 1;
          const next = pending && i === filled;
          return (
            <li
              key={i}
              className={`aol-stamp grid size-9 place-items-center rounded-full text-base ring-2 transition ${done ? "is-done" : ""} ${
                done
                  ? "bg-[#f2c230] ring-[#e0a13a]"
                  : next
                    ? "animate-pulse bg-[#f2c230]/35 ring-[#f2c230]"
                    : "bg-[#fdf8ec] ring-[#f0dfc0]"
              }`}
              aria-hidden="true"
            >
              {last ? "🎁" : done ? "🐚" : ""}
            </li>
          );
        })}
      </ol>
      <p className="text-xs font-semibold leading-snug text-[#8a7350]">
        {rewardReady
          ? tr(
              `¡Tu próximo pedido completa la tarjeta! Premio: ${loyalty.reward} 🎉`,
              `Your next order completes the card! Reward: ${loyalty.reward} 🎉`
            )
          : tr(
              `Cada pedido enviado suma un sello. Al pedido ${goal}: ${loyalty.reward}.`,
              `Every order sent earns a stamp. On order ${goal}: ${loyalty.reward}.`
            )}
      </p>
    </div>
  );
}

export function UpsellSheet({
  base,
  suggestions,
  onClose,
}: {
  base: Product | null;
  suggestions: Product[];
  onClose: () => void;
}) {
  const currency = useMenuStore((s) => s.data.settings.currency);
  const add = useCartStore((s) => s.add);
  const tr = useTr();
  const lang = useLang();
  const open = !!base && suggestions.length > 0;

  const addSide = (p: Product) => {
    add({
      productId: p.id,
      name: p.name,
      emoji: p.emoji,
      qty: 1,
      unitPrice: p.price,
      agregoIds: [],
      agregoNames: [],
      removed: [],
      notes: "",
    });
    useCustomerStore.getState().bumpOrderCount(p.id, 1);
    buzz(30);
    toast.success(tr(`${p.emoji} ${productName(p, lang)} al carrito`, `${p.emoji} ${productName(p, lang)} added`));
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="aol-sheet rounded-t-3xl border-[#f0dfc0] bg-[#fffcf4] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="p-0 pt-3 text-left">
          <SheetTitle className="font-display text-2xl text-[#c2542f]">
            {tr("¿Te lo acompañamos? 🥤", "Something on the side? 🥤")}
          </SheetTitle>
          <SheetDescription className="text-sm text-[#8a7350]">
            {base
              ? tr(
                  `${base.emoji} ${productName(base, lang)} ya está en tu carrito. Así queda redondo:`,
                  `${base.emoji} ${productName(base, lang)} is in your cart. Make it complete:`
                )
              : ""}
          </SheetDescription>
        </SheetHeader>
        <ul className="mt-3 grid gap-2">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addSide(p)}
                className="aol-card flex w-full items-center gap-3 rounded-2xl border border-[#f0dfc0] bg-white p-2.5 text-left transition active:scale-[0.98]"
              >
                {p.image ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#fdf3e0]">
                    <Image src={p.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#fdf3e0] text-2xl" aria-hidden="true">
                    {p.emoji}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#4a3b28]">{productName(p, lang)}</span>
                  <span className="block text-sm font-bold text-[#c2542f]">{money(currency, p.price)}</span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e2574c] text-white" aria-hidden="true">
                  <Plus className="size-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-11 w-full rounded-2xl text-sm font-bold text-[#8a7350] ring-1 ring-[#f0dfc0]"
        >
          {tr("No, gracias", "No, thanks")}
        </button>
      </SheetContent>
    </Sheet>
  );
}

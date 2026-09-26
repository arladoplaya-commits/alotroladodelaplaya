"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Minus, Plus, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartTotals, money, useMenuStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart";
import { useCustomerStore } from "@/lib/customer";
import { buildOrder, saveOrder } from "@/lib/orders";
import { useReviewsStore } from "@/lib/reviews";

/* ------------------------------------------------------------------ */
/*  Sección Carrito: revisa el pedido, pon nombre y dirección, y       */
/*  confirma por WhatsApp. Además queda registrado en la nube.         */
/* ------------------------------------------------------------------ */

interface CartSectionProps {
  /** Volver al menú (botón del estado vacío) */
  onBrowse: () => void;
}

export function CartSection({ onBrowse }: CartSectionProps) {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const settings = useMenuStore((s) => s.data.settings);

  const [customerName, setCustomerName] = useState(() => {
    const profileName = useCustomerStore.getState().profile?.name;
    if (profileName) return profileName;
    try {
      return localStorage.getItem("aol-customer-name") ?? "";
    } catch {
      return "";
    }
  });
  const [customerAddress, setCustomerAddress] = useState(() => {
    try {
      return localStorage.getItem("aol-customer-address") ?? "";
    } catch {
      return "";
    }
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      if (customerName) localStorage.setItem("aol-customer-name", customerName);
      else localStorage.removeItem("aol-customer-name");
      if (customerAddress)
        localStorage.setItem("aol-customer-address", customerAddress);
      else localStorage.removeItem("aol-customer-address");
    } catch {
      /* sin localStorage */
    }
  }, [customerName, customerAddress]);

  const { subtotal, total } = useMemo(
    () => cartTotals(items, 0),
    [items]
  );

  const buildWhatsAppMessage = (code?: string): string => {
    const lines: string[] = [];
    lines.push("¡Hola! Pedido desde la otra orilla 🌊");
    lines.push(`🌊 *Nuevo Pedido ${code ?? ""} · ${settings.businessName}*`);
    if (customerName.trim()) lines.push(`👤 Nombre: ${customerName.trim()}`);
    if (customerAddress.trim())
      lines.push(`📍 Dirección: ${customerAddress.trim()}`);
    lines.push("━━━━━━━━━━━━━━━━━━");
    for (const it of items) {
      lines.push(
        `▸ ${it.qty}× ${it.name} — ${money(settings.currency, it.unitPrice * it.qty)}`
      );
      if (it.agregoNames.length) {
        lines.push(`   ↳ + ${it.agregoNames.join(", ")}`);
      }
      if (it.notes) lines.push(`   ↳ 📝 ${it.notes}`);
    }
    lines.push("━━━━━━━━━━━━━━━━━━");
    lines.push(`*TOTAL: ${money(settings.currency, total)}*`);
    return lines.join("\n");
  };

  /** Guarda el pedido en la nube en segundo plano (nunca bloquea WhatsApp) */
  const persistOrder = async (order: ReturnType<typeof buildOrder>) => {
    const result = await saveOrder(order);
    if (result === "cloud") {
      toast.success(`Pedido ${order.code} registrado en la nube 📦`, {
        description: "Aparece en el panel → Pedidos.",
      });
    } else if (result === "queued") {
      toast.info(`Pedido ${order.code} en cola 📶`, {
        description:
          "Sin internet ahora mismo: se enviará solo cuando vuelva la conexión.",
      });
    }
  };

  const handleConfirm = () => {
    if (!items.length) return;
    if (
      !settings.whatsapp ||
      settings.whatsapp.replace(/\D/g, "").length < 8
    ) {
      toast.error("Configura el número de WhatsApp en el panel admin → Ajustes");
      return;
    }
    setSending(true);
    const cloudOn =
      useReviewsStore.getState().config.provider === "supabase";
    const order = cloudOn
      ? buildOrder({
          name: customerName,
          address: customerAddress,
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            qty: it.qty,
            unitPrice: it.unitPrice,
            agregoNames: it.agregoNames,
            notes: it.notes,
          })),
          subtotal,
          total,
        })
      : null;
    // Primero WhatsApp: window.open debe ejecutarse en el gesto del usuario
    const url = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
      buildWhatsAppMessage(order?.code)
    )}`;
    window.open(url, "_blank");

    toast.success("¡Pedido enviado a WhatsApp! 🌴", {
      description: "Te confirmamos enseguida. Buen provecho.",
    });

    if (order) void persistOrder(order);
    clear();
    setSending(false);
  };

  return (
    <section aria-label="Mi pedido">
      <h2 className="aol-h mb-1 flex items-center gap-2 font-display text-2xl text-[#c2542f] sm:text-3xl">
        <span aria-hidden="true">🛒</span> Mi pedido playero
      </h2>
      <p className="aol-sub mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-[#8a7350]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {settings.deliveryPoint}
        </span>
        <span className="inline-flex items-center gap-1">
          <Timer className="size-3.5" aria-hidden="true" />
          {settings.deliveryTime}
        </span>
      </p>

      {items.length === 0 ? (
        <div className="aol-empty flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-10 text-center">
          <span className="text-5xl" aria-hidden="true">
            🛒
          </span>
          <p className="font-display text-lg text-[#c2542f]">
            Tu carrito está vacío
          </p>
          <p className="max-w-xs text-sm leading-snug text-[#8a7350]">
            Explora el menú, toca «Armar pedido» y tus antojos aparecerán aquí.
          </p>
          <Button
            type="button"
            onClick={onBrowse}
            className="mt-2 rounded-full bg-[#e2574c] px-5 font-extrabold text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] hover:bg-[#d34a40]"
          >
            🌊 Ver el menú
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          <ul className="grid gap-2.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="aol-card flex items-start gap-3 rounded-2xl border border-[#f0dfc0] bg-white p-3"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fdf3e0] text-xl"
                  aria-hidden="true"
                >
                  {it.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-[#4a3b28]">
                      {it.qty}× {it.name}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-[#c2542f]">
                      {money(settings.currency, it.unitPrice * it.qty)}
                    </p>
                  </div>
                  {it.agregoNames.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-[#8a7350]">
                      + {it.agregoNames.join(", ")}
                    </p>
                  )}
                  {it.notes && (
                    <p className="mt-0.5 truncate text-xs italic text-[#a58a5f]">
                      📝 {it.notes}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f] transition hover:bg-[#f6dfb2]"
                      onClick={() => setQty(it.id, it.qty - 1)}
                      aria-label={`Menos ${it.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f] transition hover:bg-[#f6dfb2]"
                      onClick={() => setQty(it.id, it.qty + 1)}
                      aria-label={`Más ${it.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#b3562e] transition hover:bg-[#fdeae7]"
                      onClick={() => remove(it.id)}
                      aria-label={`Quitar ${it.name}`}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid gap-2.5">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 60))}
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
            />
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value.slice(0, 160))}
              placeholder="Dirección de entrega"
              aria-label="Dirección de entrega"
              className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
            />
          </div>

          <div className="grid gap-1 rounded-2xl bg-[#fdf3e0] p-3.5 text-sm ring-1 ring-[#f0dfc0]">
            <div className="flex justify-between text-[#8a7350]">
              <span>Subtotal</span>
              <span className="font-semibold">
                {money(settings.currency, subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[#4a3b28]">
              <span>Total</span>
              <span className="font-display text-xl text-[#c2542f]">
                {money(settings.currency, total)}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              disabled={sending || !items.length}
              onClick={handleConfirm}
              className="h-13 w-full rounded-2xl bg-[#25d366] py-3.5 text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(37,211,102,0.5)] transition hover:bg-[#1fb857] active:scale-[0.98]"
            >
              Confirmar por WhatsApp · {money(settings.currency, total)}
            </Button>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8a7350]">
                Te confirmamos para el delivery 🌴
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-[#b3562e] transition hover:bg-[#fdeae7]"
                onClick={() => {
                  clear();
                  toast.info("Carrito vacío otra vez 🧹");
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

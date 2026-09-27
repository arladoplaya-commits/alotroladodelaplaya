"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Copy, MapPin, Minus, Plus, Tag, Timer, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartTotals, money, openStateFor, useMenuStore } from "@/lib/store";
import { sinText } from "@/lib/ingredients";
import { ingredientName, productName, useLang, useTr, withoutText } from "@/lib/i18n";
import { couponDiscount, couponLabel, findCoupon, loyaltyProgress, toLastOrder } from "@/lib/promos";
import { LoyaltyCard, RepeatLastOrderCard } from "./promo-cards";
import { useCartStore } from "@/lib/cart";
import { useCustomerStore } from "@/lib/customer";
import { buildOrder, saveOrder } from "@/lib/orders";
import { useReviewsStore } from "@/lib/reviews";
import { CatTitle } from "./section-title";

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
  const combos = useMenuStore((s) => s.data.combos);
  const products = useMenuStore((s) => s.data.products);
  const tr = useTr();
  const lang = useLang();
  const stamps = useCustomerStore((s) => s.stamps);
  const loyalty = settings.loyalty;
  const [couponDraft, setCouponDraft] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const coupon = findCoupon(settings.coupons, couponCode);
  const hasCoupons = settings.coupons.some((c) => c.active);
  /** Nombre en el idioma de la carta (el de WhatsApp siempre en español) */
  const shownName = (it: { productId: string; comboId?: string; name: string }) => {
    if (it.comboId) return it.name;
    const p = products.find((x) => x.id === it.productId);
    return p ? productName(p, lang) : it.name;
  };

  const zones = useMemo(() => settings.zones.filter((z) => z.active), [settings.zones]);
  const payments = useMemo(
    () => settings.payments.filter((p) => p.active),
    [settings.payments]
  );
  const canDeliver = settings.deliveryEnabled && zones.length > 0;
  const canPickup = settings.pickupEnabled || !canDeliver;

  const [modePref, setModePref] = useState<"domicilio" | "recoger">(() => {
    try {
      return localStorage.getItem("aol-delivery-mode") === "recoger" ? "recoger" : "domicilio";
    } catch {
      return "domicilio";
    }
  });
  const mode: "domicilio" | "recoger" = !canDeliver
    ? "recoger"
    : !canPickup
      ? "domicilio"
      : modePref;
  const [zoneId, setZoneId] = useState(() => {
    try {
      return localStorage.getItem("aol-delivery-zone") ?? "";
    } catch {
      return "";
    }
  });
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const [payId, setPayId] = useState(() => {
    try {
      return localStorage.getItem("aol-payment") ?? "";
    } catch {
      return "";
    }
  });
  const payment = payments.find((p) => p.id === payId) ?? (payments.length === 1 ? payments[0] : null);
  const fee = mode === "domicilio" && zone ? zone.fee : 0;

  /** Foto del producto (o del primer producto del combo) */
  const photoOf = (it: { productId: string; comboId?: string }): string | undefined => {
    const id = it.comboId
      ? combos.find((c) => c.id === it.comboId)?.items[0]?.productId
      : it.productId;
    return products.find((p) => p.id === id)?.image;
  };

  /** Qué trae un combo: «1× La Orilla, 1× Papas de Arena…» */
  const comboContents = (comboId?: string): string => {
    if (!comboId) return "";
    const c = combos.find((x) => x.id === comboId);
    if (!c) return "";
    return c.items
      .map((ci) => {
        const p = products.find((x) => x.id === ci.productId);
        return p ? `${ci.qty}× ${p.name}` : "";
      })
      .filter(Boolean)
      .join(", ");
  };

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
      localStorage.setItem("aol-delivery-mode", modePref);
      if (zoneId) localStorage.setItem("aol-delivery-zone", zoneId);
      if (payId) localStorage.setItem("aol-payment", payId);
    } catch {
      /* sin localStorage */
    }
  }, [customerName, customerAddress, modePref, zoneId, payId]);

  const { subtotal } = useMemo(() => cartTotals(items, 0), [items]);
  const discount = couponDiscount(coupon, subtotal);
  const total = subtotal - discount + fee;
  const couponShort =
    !!coupon && coupon.minTotal > 0 && subtotal < coupon.minTotal ? coupon.minTotal - subtotal : 0;
  const loyaltyNow = loyalty.enabled ? loyaltyProgress(stamps, loyalty.stamps) : null;

  const applyCoupon = () => {
    const found = findCoupon(settings.coupons, couponDraft);
    if (!found) {
      toast.error(tr("Ese cupón no existe o ya no está activo", "That coupon does not exist or has expired"));
      return;
    }
    setCouponCode(found.code);
    setCouponDraft("");
    toast.success(tr(`Cupón ${found.code} aplicado 🏷️`, `Coupon ${found.code} applied 🏷️`));
  };

  const buildWhatsAppMessage = (code?: string): string => {
    const lines: string[] = [];
    lines.push("¡Hola! Pedido desde la otra orilla 🌊");
    lines.push(`🌊 *Nuevo Pedido${code ? ` ${code}` : ""} · ${settings.businessName}*`);
    if (customerName.trim()) lines.push(`👤 Nombre: ${customerName.trim()}`);
    if (mode === "domicilio") {
      lines.push(`🛵 A domicilio · ${zone?.name ?? ""}`);
      if (customerAddress.trim())
        lines.push(`📍 Dirección: ${customerAddress.trim()}`);
    } else {
      lines.push(`🏖️ Recojo en el local · ${settings.deliveryPoint}`);
    }
    if (payment) lines.push(`${payment.emoji} Pago: ${payment.name}`);
    lines.push("━━━━━━━━━━━━━━━━━━");
    for (const it of items) {
      lines.push(
        `▸ ${it.qty}× ${it.name} — ${money(settings.currency, it.unitPrice * it.qty)}`
      );
      const inside = comboContents(it.comboId);
      if (inside) lines.push(`   ↳ 🍱 ${inside}`);
      if (it.agregoNames.length) {
        lines.push(`   ↳ + ${it.agregoNames.join(", ")}`);
      }
      if (it.removed?.length) lines.push(`   ↳ 🚫 *${sinText(it.removed).toUpperCase()}*`);
      if (it.notes) lines.push(`   ↳ 📝 ${it.notes}`);
    }
    lines.push("━━━━━━━━━━━━━━━━━━");
    if (fee || discount) lines.push(`Subtotal: ${money(settings.currency, subtotal)}`);
    if (coupon && discount)
      lines.push(`🏷️ Cupón ${coupon.code} (${couponLabel(coupon, "MN")}): -${money(settings.currency, discount)}`);
    if (fee) lines.push(`Mensajería (${zone?.name}): ${money(settings.currency, fee)}`);
    lines.push(`*TOTAL: ${money(settings.currency, total)} MN*`);
    if (loyaltyNow) {
      if (loyaltyNow.rewardReady)
        lines.push(`🎁 *PREMIO FIDELIDAD: ${loyalty.reward}* (pedido ${loyaltyNow.goal} de ${loyaltyNow.goal})`);
      else lines.push(`⭐ Tarjeta de fidelidad: sello ${loyaltyNow.filled + 1} de ${loyaltyNow.goal}`);
    }
    return lines.join("\n");
  };

  /** Guarda el pedido en la nube en segundo plano (nunca bloquea WhatsApp) */
  const persistOrder = async (order: ReturnType<typeof buildOrder>) => {
    const result = await saveOrder(order);
    if (result === "cloud") {
      toast.success(tr(`Pedido ${order.code} registrado 📦`, `Order ${order.code} saved 📦`));
    } else if (result === "queued") {
      toast.info(tr(`Pedido ${order.code} en cola 📶`, `Order ${order.code} queued 📶`), {
        description: tr(
          "Sin internet ahora mismo: se enviará solo cuando vuelva la conexión.",
          "No internet right now: it will be sent when the connection is back."
        ),
      });
    }
  };

  /* Se recalcula en cada visita a esta pestaña; si está cerrado lo decimos
     ya en el carrito, no solo cuando el cliente intenta confirmar. */
  const closedState = useMemo(() => {
    const s = openStateFor(settings, new Date(), lang);
    return s.open ? null : s;
  }, [settings, lang]);

  const handleConfirm = () => {
    if (!items.length) return;
    const state = openStateFor(settings, new Date(), lang);
    if (!state.open) {
      toast.error(tr("Ahora mismo no estamos tomando pedidos 🌙", "We're not taking orders right now 🌙"), {
        description: state.label,
      });
      return;
    }
    if (!customerName.trim()) {
      toast.error(tr("Escribe tu nombre para el pedido ✋", "Write your name for the order ✋"));
      return;
    }
    if (mode === "domicilio" && !zone) {
      toast.error(tr("Elige tu zona de entrega 🛵", "Choose your delivery area 🛵"));
      return;
    }
    if (mode === "domicilio" && customerAddress.trim().length < 5) {
      toast.error(tr("Escribe la dirección de entrega 📍", "Write the delivery address 📍"));
      return;
    }
    if (payments.length > 0 && !payment) {
      toast.error(tr("Elige cómo vas a pagar 💳", "Choose how you will pay 💳"));
      return;
    }
    if (
      !settings.whatsapp ||
      settings.whatsapp.replace(/\D/g, "").length < 8
    ) {
      toast.error(tr("El local aún no ha puesto su WhatsApp", "The shack has not set its WhatsApp yet"));
      return;
    }
    setSending(true);
    const cloudOn =
      useReviewsStore.getState().config.provider === "supabase";
    const order = cloudOn
      ? buildOrder({
          name: customerName,
          address: [
            mode === "domicilio"
              ? `🛵 ${zone?.name ?? ""} · ${customerAddress.trim()}`
              : "🏖️ Recoge en el local",
            payment ? `${payment.emoji} ${payment.name}` : "",
            coupon && discount ? `🏷️ ${coupon.code}` : "",
            loyaltyNow?.rewardReady ? `🎁 ${loyalty.reward}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
          items: items.map((it) => ({
            productId: it.productId,
            name: it.name,
            qty: it.qty,
            unitPrice: it.unitPrice,
            agregoNames: it.agregoNames,
            removed: it.removed ?? [],
            notes: [comboContents(it.comboId), it.notes].filter(Boolean).join(" · "),
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

    toast.success(tr("¡Pedido enviado a WhatsApp! 🌴", "Order sent to WhatsApp! 🌴"), {
      description: loyaltyNow?.rewardReady
        ? tr(`🎁 Te toca premio: ${loyalty.reward}`, `🎁 You earned: ${loyalty.reward}`)
        : tr("Te confirmamos enseguida. Buen provecho.", "We will confirm right away. Enjoy!"),
    });

    if (order) void persistOrder(order);
    const customer = useCustomerStore.getState();
    customer.setLastOrder(toLastOrder(items));
    if (loyalty.enabled) customer.setStamps(customer.stamps + 1);
    setCouponCode("");
    clear();
    setSending(false);
  };

  return (
    <section aria-label={tr("Mi pedido", "My order")}>
      <CatTitle emoji="🛒">{tr("Mi pedido playero", "My beach order")}</CatTitle>
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

      {closedState && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-[#eef0fb] px-4 py-3 text-sm font-semibold text-[#4a4a8a] ring-1 ring-[#d8daf2]">
          <span className="text-lg" aria-hidden="true">
            🌙
          </span>
          <p>
            {tr(
              "Ahora mismo no se puede confirmar: el shack está cerrado.",
              "Orders can't be confirmed right now: the shack is closed."
            )}{" "}
            {closedState.label}{" "}
            {tr(
              "Tu carrito queda guardado en este teléfono; vuelve cuando abramos y lo confirmas.",
              "Your cart stays saved on this phone; come back when we open and confirm it."
            )}
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <div className="aol-empty flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-10 text-center">
          <span className="text-5xl" aria-hidden="true">
            🛒
          </span>
          <p className="font-display text-lg text-[#c2542f]">
            {tr("Tu carrito está vacío", "Your cart is empty")}
          </p>
          <p className="max-w-xs text-sm leading-snug text-[#8a7350]">
            {tr(
              "Explora el menú, toca «Armar pedido» y tus antojos aparecerán aquí.",
              "Browse the menu, tap “Build order” and your cravings will show up here."
            )}
          </p>
          <Button
            type="button"
            onClick={onBrowse}
            className="mt-2 rounded-full bg-[#e2574c] px-5 font-extrabold text-white shadow-[0_6px_18px_-4px_rgba(226,87,76,0.55)] hover:bg-[#d34a40]"
          >
            {tr("🌊 Ver el menú", "🌊 See the menu")}
          </Button>
          <div className="mt-4 grid w-full max-w-md gap-3">
            <RepeatLastOrderCard />
            <LoyaltyCard />
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <ul className="grid gap-2.5">
            {items.map((it) => (
              <li
                key={it.id}
                className="aol-card flex items-start gap-3 rounded-2xl border border-[#f0dfc0] bg-white p-3"
              >
                {photoOf(it) ? (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-[#fdf3e0]">
                    <Image src={photoOf(it)!} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                ) : (
                  <span
                    className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#fdf3e0] text-2xl"
                    aria-hidden="true"
                  >
                    {it.emoji}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-[#4a3b28]">
                      {it.qty}× {shownName(it)}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-[#c2542f]">
                      {money(settings.currency, it.unitPrice * it.qty)}
                    </p>
                  </div>
                  {it.comboId && (
                    <p className="mt-0.5 text-xs text-[#8a7350]">
                      🍱 {comboContents(it.comboId)}
                    </p>
                  )}
                  {it.agregoNames.length > 0 && (
                    <p className="mt-0.5 truncate text-xs text-[#8a7350]">
                      + {it.agregoNames.map((n) => ingredientName(n, lang)).join(", ")}
                    </p>
                  )}
                  {!!it.removed?.length && (
                    <p className="aol-removed mt-0.5 text-xs font-bold text-[#c0392b]">
                      🚫 {withoutText(it.removed, lang)}
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
                      aria-label={tr(`Menos ${it.name}`, `One less ${shownName(it)}`)}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-full bg-[#fdf3e0] text-[#c2542f] transition hover:bg-[#f6dfb2]"
                      onClick={() => setQty(it.id, it.qty + 1)}
                      aria-label={tr(`Más ${it.name}`, `One more ${shownName(it)}`)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-[#b3562e] transition hover:bg-[#fdeae7]"
                      onClick={() => remove(it.id)}
                      aria-label={tr(`Quitar ${it.name}`, `Remove ${shownName(it)}`)}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      {tr("Quitar", "Remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="aol-card grid gap-3 rounded-2xl border border-[#f0dfc0] bg-white p-3.5">
            {canDeliver && canPickup && (
              <div
                className="aol-seg grid grid-cols-2 gap-1 rounded-full bg-[#fdf3e0] p-1"
                role="group"
                aria-label={tr("Forma de entrega", "Delivery method")}
              >
                {(["domicilio", "recoger"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setModePref(m)}
                    className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${
                      mode === m
                        ? "bg-white text-[#c2542f] shadow-sm"
                        : "text-[#8a7350]"
                    }`}
                  >
                    {m === "domicilio" ? tr("🛵 A domicilio", "🛵 Delivery") : tr("🏖️ Recojo en el local", "🏖️ Pick up")}
                  </button>
                ))}
              </div>
            )}

            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 60))}
              placeholder={tr("Tu nombre", "Your name")}
              aria-label={tr("Tu nombre", "Your name")}
              autoComplete="name"
              className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
            />

            {mode === "domicilio" ? (
              <>
                <label className="grid gap-1 text-xs font-extrabold uppercase tracking-wide text-[#8a7350]">
                  {tr("Zona de entrega", "Delivery area")}
                  <select
                    value={zone?.id ?? ""}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="h-11 rounded-md border border-[#f0dfc0] bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#4a3b28] focus:outline-none focus:ring-2 focus:ring-[#e2574c]"
                  >
                    <option value="" disabled>
                      {tr("Elige tu zona…", "Choose your area…")}
                    </option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} · {tr("mensajería", "delivery")} {z.fee ? money(settings.currency, z.fee) : tr("gratis", "free")}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value.slice(0, 160))}
                  placeholder={tr("Dirección: calle, número, entre calles…", "Address: street, number, between streets…")}
                  aria-label={tr("Dirección de entrega", "Delivery address")}
                  autoComplete="street-address"
                  className="h-11 border-[#f0dfc0] bg-white text-sm focus-visible:ring-[#e2574c]"
                />
              </>
            ) : (
              <p className="rounded-xl bg-[#fdf3e0] px-3 py-2.5 text-sm font-semibold text-[#8a7350]">
                📍 {tr("Recoges en", "Pick up at")} {settings.deliveryPoint}
              </p>
            )}

            {payments.length > 0 && (
              <div className="grid gap-1.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#8a7350]">
                  {tr("¿Cómo pagas?", "How will you pay?")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {payments.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={payment?.id === p.id}
                      onClick={() => setPayId(p.id)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition active:scale-95 ${
                        payment?.id === p.id
                          ? "bg-[#e2574c] text-white shadow-[0_6px_16px_-4px_rgba(226,87,76,0.55)]"
                          : "aol-chip bg-white text-[#4a3b28] ring-1 ring-[#f0dfc0]"
                      }`}
                    >
                      <span aria-hidden="true">{p.emoji}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
                {payment?.details && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#eef9fc] px-3 py-2 text-sm text-[#2b7a93] ring-1 ring-[#bfe3f2]">
                    <span className="min-w-0 flex-1 break-words font-semibold">
                      {payment.emoji} {payment.details}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(payment.details)
                          .then(() => toast.success(tr("Copiado 📋", "Copied 📋")))
                          .catch(() => undefined);
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#2b7a93]"
                      aria-label={tr("Copiar datos de pago", "Copy payment details")}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {hasCoupons && (
            <div className="aol-card grid gap-2 rounded-2xl border border-[#f0dfc0] bg-white p-3.5">
              {coupon ? (
                <div className="flex items-center gap-2 rounded-xl bg-[#e9f7ee] px-3 py-2 text-sm font-bold text-[#2f7a48] ring-1 ring-[#bfe5cc]">
                  <Tag className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    {coupon.code} · {couponLabel(coupon, settings.currency)}
                    {couponShort > 0 && (
                      <span className="block text-xs font-semibold text-[#8a7350]">
                        {tr(
                          `Te faltan ${money(settings.currency, couponShort)} para usarlo`,
                          `Add ${money(settings.currency, couponShort)} more to use it`
                        )}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCouponCode("")}
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-white"
                    aria-label={tr("Quitar cupón", "Remove coupon")}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCoupon();
                  }}
                >
                  <Input
                    value={couponDraft}
                    onChange={(e) => setCouponDraft(e.target.value.toUpperCase().slice(0, 20))}
                    placeholder={tr("¿Tienes un cupón?", "Got a coupon?")}
                    aria-label={tr("Código de cupón", "Coupon code")}
                    autoCapitalize="characters"
                    className="h-11 border-[#f0dfc0] bg-white text-sm font-bold tracking-wide focus-visible:ring-[#e2574c]"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!couponDraft.trim()}
                    className="h-11 shrink-0 rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f]"
                  >
                    {tr("Aplicar", "Apply")}
                  </Button>
                </form>
              )}
            </div>
          )}

          <LoyaltyCard pending />

          <div className="aol-totals grid gap-1 rounded-2xl bg-[#fdf3e0] p-3.5 text-sm ring-1 ring-[#f0dfc0]">
            <div className="flex justify-between text-[#8a7350]">
              <span>Subtotal</span>
              <span className="font-semibold">
                {money(settings.currency, subtotal)}
              </span>
            </div>
            {discount > 0 && coupon && (
              <div className="flex justify-between font-bold text-[#2f7a48]">
                <span>🏷️ {coupon.code}</span>
                <span>-{money(settings.currency, discount)}</span>
              </div>
            )}
            {mode === "domicilio" && (
              <div className="flex justify-between text-[#8a7350]">
                <span>{tr("Mensajería", "Delivery")}{zone ? ` · ${zone.name}` : ""}</span>
                <span className="font-semibold">
                  {zone ? (fee ? money(settings.currency, fee) : tr("Gratis", "Free")) : tr("Elige tu zona", "Choose your area")}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#4a3b28]">
              <span>Total</span>
              <span className="font-display text-xl text-[#c2542f]">
                {money(settings.currency, total)}{" "}
                <span className="text-sm">MN</span>
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              disabled={sending || !items.length || !!closedState}
              onClick={handleConfirm}
              className="h-13 w-full rounded-2xl bg-[#25d366] py-3.5 text-base font-extrabold text-white shadow-[0_8px_24px_-4px_rgba(37,211,102,0.5)] transition hover:bg-[#1fb857] active:scale-[0.98] disabled:opacity-60"
            >
              {closedState
                ? tr("🌙 Cerrado ahora", "🌙 Closed now")
                : `${tr("Confirmar por WhatsApp", "Confirm on WhatsApp")} · ${money(settings.currency, total)}`}
            </Button>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8a7350]">
                {tr("Te confirmamos para el delivery 🌴", "We confirm your order on WhatsApp 🌴")}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-[#b3562e] transition hover:bg-[#fdeae7]"
                onClick={() => {
                  clear();
                  toast.info(tr("Carrito vacío otra vez 🧹", "Cart emptied 🧹"));
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                {tr("Vaciar carrito", "Empty cart")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

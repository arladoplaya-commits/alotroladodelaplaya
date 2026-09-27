import { unitPriceFor } from "@/lib/cart";
import type { LastOrderItem } from "@/lib/customer";
import type { CartItem, Coupon, MenuData, Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Cupones, tarjeta de fidelidad, «¿Te lo acompañamos?» y «Repetir   */
/*  mi último pedido». Todo se calcula en el teléfono del cliente.     */
/* ------------------------------------------------------------------ */

export function normCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** Cupón activo con ese código (sin distinguir mayúsculas) */
export function findCoupon(coupons: Coupon[], code: string): Coupon | null {
  const c = normCode(code);
  if (!c) return null;
  return coupons.find((x) => x.active && normCode(x.code) === c) ?? null;
}

/** Descuento en MN que da el cupón sobre el subtotal (0 si no llega al mínimo) */
export function couponDiscount(coupon: Coupon | null, subtotal: number): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.minTotal > 0 && subtotal < coupon.minTotal) return 0;
  const raw =
    coupon.kind === "percent"
      ? Math.round((subtotal * Math.min(100, Math.max(0, coupon.value))) / 100)
      : Math.max(0, coupon.value);
  return Math.min(subtotal, raw);
}

export function couponLabel(coupon: Coupon, currency: string): string {
  return coupon.kind === "percent" ? `-${coupon.value}%` : `-${coupon.value} ${currency}`.trim();
}

/** Sellos que se muestran en la tarjeta (el premio cae al completar la fila) */
export function loyaltyProgress(stamps: number, goal: number) {
  const g = Math.max(2, goal);
  const filled = stamps % g;
  return { goal: g, filled, rewardReady: stamps > 0 && filled === g - 1 };
}

/* ---------------------- ¿Te lo acompañamos? ---------------------- */

const SIDE_PREFS = ["p-refrescos", "p-papas-fritas", "p-limonada", "p-malta", "p-cerveza"];

/** Hasta 3 acompañantes disponibles que aún no están en el carrito */
export function upsellFor(product: Product, data: MenuData, cart: CartItem[]): Product[] {
  if (product.category.startsWith("bebidas-")) return [];
  const inCart = new Set(cart.map((it) => it.productId));
  const isSide = (p: Product) =>
    p.available &&
    p.id !== product.id &&
    !inCart.has(p.id) &&
    (p.category.startsWith("bebidas-") || /papas|chips/i.test(`${p.id} ${p.name}`));
  const preferred = SIDE_PREFS.map((id) => data.products.find((p) => p.id === id)).filter(
    (p): p is Product => !!p && isSide(p)
  );
  const rest = data.products.filter((p) => isSide(p) && !preferred.includes(p));
  const pick = [...preferred, ...rest];
  // si no pidió bebida todavía, que la primera sugerencia sea una bebida
  const hasDrink = cart.some((it) => it.productId && data.products.find((p) => p.id === it.productId)?.category.startsWith("bebidas-"));
  if (!hasDrink) pick.sort((a, b) => Number(b.category.startsWith("bebidas-")) - Number(a.category.startsWith("bebidas-")));
  return pick.slice(0, 3);
}

/* ---------------------- Repetir mi último pedido ---------------------- */

export function toLastOrder(items: CartItem[]): LastOrderItem[] {
  return items.map((it) => ({
    productId: it.productId,
    comboId: it.comboId,
    name: it.name,
    emoji: it.emoji,
    qty: it.qty,
    agregoIds: it.agregoIds,
    removed: it.removed ?? [],
    notes: it.notes,
  }));
}

/** Vuelve a armar el pedido con los precios de hoy; lo agotado se salta */
export function rebuildOrder(
  last: LastOrderItem[],
  data: MenuData
): { items: Omit<CartItem, "id">[]; skipped: string[] } {
  const items: Omit<CartItem, "id">[] = [];
  const skipped: string[] = [];
  for (const it of last) {
    if (it.comboId) {
      const combo = data.combos.find((c) => c.id === it.comboId);
      const ok =
        combo?.active &&
        combo.items.every((ci) => data.products.find((p) => p.id === ci.productId)?.available);
      if (!combo || !ok) {
        skipped.push(it.name);
        continue;
      }
      items.push({
        productId: combo.id,
        comboId: combo.id,
        name: combo.name,
        emoji: combo.emoji,
        qty: it.qty,
        unitPrice: combo.price,
        agregoIds: [],
        agregoNames: [],
        removed: [],
        notes: it.notes,
      });
      continue;
    }
    const product = data.products.find((p) => p.id === it.productId);
    if (!product?.available) {
      skipped.push(it.name);
      continue;
    }
    const agregos = data.agregos.filter((a) => a.available && it.agregoIds.includes(a.id));
    items.push({
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      qty: it.qty,
      unitPrice: unitPriceFor(product, agregos),
      agregoIds: agregos.map((a) => a.id),
      agregoNames: agregos.map((a) => a.name),
      removed: it.removed.filter((r) => product.ingredients.includes(r)),
      notes: it.notes,
    });
  }
  return { items, skipped };
}

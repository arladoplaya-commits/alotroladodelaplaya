"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/store";
import type { CartItem, Product } from "@/lib/types";

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((st) => ({ items: [...st.items, { ...item, id: uid("ci") }] })),
      remove: (id) =>
        set((st) => ({ items: st.items.filter((it) => it.id !== id) })),
      setQty: (id, qty) =>
        set((st) => ({
          items: st.items.map((it) =>
            it.id === id ? { ...it, qty: Math.max(1, qty) } : it
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "aol-cart-v1" }
  )
);

/** Precio unitario = producto + agregos elegidos */
export function unitPriceFor(
  product: Product,
  agregos: { id: string; price: number }[]
): number {
  return product.price + agregos.reduce((acc, a) => acc + a.price, 0);
}

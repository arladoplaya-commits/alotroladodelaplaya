"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import seedRaw from "@/data/seed.json";
import type {
  Agrego,
  CartItem,
  Category,
  GalleryItem,
  GitHubSync,
  MenuData,
  Product,
  Settings,
} from "@/lib/types";

export const SEED = seedRaw as unknown as MenuData;

const STORAGE_KEY = "aol-menu-v1";

/* ------------------------------ helpers ------------------------------ */

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function money(currency: string, value: number): string {
  const rounded = Math.round(value);
  return `${currency}${rounded.toLocaleString("es-CU")}`;
}

export function cartTotals(items: CartItem[], deliveryFee = 0) {
  // unitPrice ya incluye el precio de los agregos elegidos
  const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  return { subtotal, total: subtotal + (deliveryFee || 0) };
}

/** Precio total de un ítem del carrito (producto + agregos) */
export function lineTotal(it: CartItem): number {
  return it.unitPrice * it.qty;
}

/* ------------------------------- store ------------------------------- */

interface MenuState {
  data: MenuData;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  saveProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  saveAgrego: (a: Agrego) => void;
  deleteAgrego: (id: string) => void;
  saveCategories: (cats: Category[]) => void;
  saveSettings: (s: Settings) => void;
  setGallery: (items: GalleryItem[]) => void;
  saveGitHub: (g: GitHubSync) => void;
  setAllAvailable: (available: boolean) => void;
  setAllAgregosAvailable: (available: boolean) => void;
  resetToFactory: () => void;
  exportJson: () => MenuData;
}

interface PersistedShape {
  version: number;
  updatedAt: string;
  categories: Category[];
  products: Product[];
  agregos: Agrego[];
  settings: Settings;
  github: GitHubSync;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      data: clone(SEED),
      hydrated: false,

      hydrate: async () => {
        if (get().hydrated) return;
        // El persist middleware ya restauró localStorage en create().
        // Intenta mejorar con el menu.json publicado en GitHub Pages,
        // solo si hay config de repo guardada.
        const cfg = get().data.github;
        if (cfg?.owner && cfg?.repo) {
          try {
            const base =
              `https://${cfg.owner}.github.io/${cfg.repo}/` +
              (cfg.path || "public/data/menu.json").replace(/^public\//, "");
            const res = await fetch(base, { cache: "no-store" });
            if (res.ok) {
              const remote = (await res.json()) as MenuData;
              if (remote?.products?.length) {
                set({ data: remote, hydrated: true });
                return;
              }
            }
          } catch {
            /* sin internet o repo: seguimos con lo local */
          }
        }
        set({ hydrated: true });
      },

      saveProduct: (p) =>
        set((st) => {
          const products = [...st.data.products];
          const i = products.findIndex((x) => x.id === p.id);
          if (i >= 0) products[i] = p;
          else products.push(p);
          return {
            data: { ...st.data, products, updatedAt: new Date().toISOString() },
          };
        }),

      deleteProduct: (id) =>
        set((st) => ({
          data: {
            ...st.data,
            products: st.data.products.filter((p) => p.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      saveAgrego: (a) =>
        set((st) => {
          const agregos = [...st.data.agregos];
          const i = agregos.findIndex((x) => x.id === a.id);
          if (i >= 0) agregos[i] = a;
          else agregos.push(a);
          return {
            data: { ...st.data, agregos, updatedAt: new Date().toISOString() },
          };
        }),

      deleteAgrego: (id) =>
        set((st) => ({
          data: {
            ...st.data,
            agregos: st.data.agregos.filter((a) => a.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      saveCategories: (cats) =>
        set((st) => ({
          data: { ...st.data, categories: cats, updatedAt: new Date().toISOString() },
        })),

      saveSettings: (s) =>
        set((st) => ({
          data: { ...st.data, settings: s, updatedAt: new Date().toISOString() },
        })),

      setGallery: (items) =>
        set((st) => ({
          data: {
            ...st.data,
            settings: { ...st.data.settings, gallery: items },
            updatedAt: new Date().toISOString(),
          },
        })),

      saveGitHub: (g) =>
        set((st) => ({
          data: { ...st.data, github: g, updatedAt: new Date().toISOString() },
        })),

      setAllAvailable: (available) =>
        set((st) => ({
          data: {
            ...st.data,
            products: st.data.products.map((p) => ({ ...p, available })),
            updatedAt: new Date().toISOString(),
          },
        })),

      setAllAgregosAvailable: (available) =>
        set((st) => ({
          data: {
            ...st.data,
            agregos: st.data.agregos.map((a) => ({ ...a, available })),
            updatedAt: new Date().toISOString(),
          },
        })),

      resetToFactory: () => set({ data: clone(SEED) }),

      exportJson: () => clone(get().data),
    }),
    {
      name: STORAGE_KEY,
      partialize: (st): PersistedShape => ({
        version: st.data.version,
        updatedAt: st.data.updatedAt,
        categories: st.data.categories,
        products: st.data.products,
        agregos: st.data.agregos,
        settings: st.data.settings,
        github: st.data.github,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedShape> | undefined;
        if (!p || !p.products?.length) return current;
        const seedVersion = SEED.version ?? 1;
        if ((p.version ?? 1) >= seedVersion) {
          return {
            ...current,
            data: {
              ...clone(SEED),
              ...p,
            } as MenuData,
          };
        }
        // Datos de una versión anterior: incorporamos las categorías y
        // productos nuevos del seed SIN pisar las ediciones del negocio.
        const persistedIds = new Set(p.products.map((x) => x.id));
        const products = [
          ...p.products,
          ...SEED.products.filter((x) => !persistedIds.has(x.id)),
        ];
        const catIds = new Set((p.categories ?? []).map((c) => c.id));
        const categories = [
          ...(p.categories ?? []),
          ...SEED.categories.filter((c) => !catIds.has(c.id)),
        ];
        return {
          ...current,
          data: {
            ...clone(SEED),
            ...p,
            products,
            categories,
            version: seedVersion,
          } as MenuData,
        };
      },
    }
  )
);

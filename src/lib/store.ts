"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import seedRaw from "@/data/seed.json";
import type {
  Agrego,
  CartItem,
  Category,
  Combo,
  GalleryItem,
  GitHubSync,
  MenuData,
  Product,
  Settings,
} from "@/lib/types";

export const SEED = seedRaw as unknown as MenuData;

const STORAGE_KEY = "aol-menu-v1";

/**
 * Nombres de fábrica anteriores a la carta playera (v5). Si el negocio no
 * los había cambiado, al actualizar se renombran con los nombres playeros.
 */
const OLD_DEFAULT_NAMES: Record<string, string> = {
  "p-clasica": "Clásica",
  "p-cerdo": "De Cerdo",
  "p-res": "De Res",
  "p-doble": "Doble",
  "p-doble-mixta": "Doble Mixta",
  "p-perro-clasico": "Clásico",
  "p-perro-crispy": "El Crispy",
  "p-perro-isleno": "El Isleño",
  "p-perro-saludable": "El Saludable",
  "p-perro-cheesy": "El Cheesy",
  "p-baguette-rustico": "Rústico",
  "p-albondiga-cerdo": "Albóndiga de Cerdo",
  "p-albondiga-pollo": "Albóndiga de Pollo",
  "p-croquetas": "Croquetas",
  "p-fajitas-pollo": "Fajitas de Pollo",
  "p-papas-fritas": "Papas Fritas",
  "p-papischis": "Papischis",
  "p-alitas-pollo": "Alitas de Pollo",
  "p-refrescos": "Refrescos",
  "p-malta": "Malta",
  "p-cerveza": "Cerveza Importada",
  "p-jugos": "Jugos Naturales",
  "p-malteada": "Malteada",
  "p-batidos": "Batidos de Frutas Naturales",
  "p-maracuya": "Jugo de Maracuyá",
  "p-limonada": "Limonada Natural",
  "p-limonada-brasilena": "Limonada Brasileña",
  "p-espresso": "Café Espresso",
  "p-cortado": "Café Cortado",
  "p-bombon": "Café Bombón",
};

/**
 * Completa con los valores de fábrica lo que falte (datos guardados de una
 * versión anterior o un menu.json publicado antes de estas funciones).
 */
export function normalizeMenu(raw: Partial<MenuData>): MenuData {
  const seed = clone(SEED);
  const s = { ...seed.settings, ...(raw.settings ?? {}) } as Settings;
  const sched = s.schedule ?? seed.settings.schedule;
  s.schedule = {
    auto: !!sched.auto,
    days: Array.from({ length: 7 }, (_, i) => ({
      ...seed.settings.schedule.days[i],
      ...(sched.days?.[i] ?? {}),
    })),
  };
  s.daily = { ...seed.settings.daily, ...(s.daily ?? {}) };
  s.zones = Array.isArray(s.zones) ? s.zones : seed.settings.zones;
  s.payments = Array.isArray(s.payments) ? s.payments : seed.settings.payments;
  s.publicUrl = s.publicUrl ?? "";
  return {
    ...seed,
    ...raw,
    combos: Array.isArray(raw.combos) ? raw.combos : seed.combos,
    settings: s,
  } as MenuData;
}

/** ¿El menú remoto es más nuevo que el que tenemos? */
function isNewer(remote: MenuData, local: MenuData): boolean {
  const r = Date.parse(remote.updatedAt || "") || 0;
  const l = Date.parse(local.updatedAt || "") || 0;
  return r > l;
}

/**
 * Fuentes del menú publicado, de la más rápida en actualizarse a la más lenta:
 * 1) raw.githubusercontent (se ve al minuto de pulsar «Publicar»)
 * 2) el propio sitio (/data/menu.json tras el redeploy de Vercel)
 * 3) GitHub Pages (versión anterior del proyecto)
 */
function remoteSources(cfg: GitHubSync): string[] {
  const path = cfg.path || "public/data/menu.json";
  const list: string[] = [];
  if (cfg.owner && cfg.repo) {
    list.push(
      `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch || "main"}/${path}`
    );
  }
  list.push(`/${path.replace(/^public\//, "")}`);
  if (cfg.owner && cfg.repo) {
    list.push(`https://${cfg.owner}.github.io/${cfg.repo}/${path.replace(/^public\//, "")}`);
  }
  return list;
}

async function fetchRemoteMenu(cfg: GitHubSync): Promise<MenuData | null> {
  for (const url of remoteSources(cfg)) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const remote = (await res.json()) as MenuData;
      if (remote?.products?.length) return normalizeMenu(remote);
    } catch {
      /* sin internet o archivo inexistente: probamos la siguiente */
    }
  }
  return null;
}

/* ------------------------------ horario ------------------------------ */

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/** 19:30 → «7:30 pm» */
export function prettyHour(hhmm: string): string {
  const mins = minutesOf(hhmm);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${suffix}`;
}

export interface OpenState {
  open: boolean;
  /** Frase corta para el cliente: «Cierra a las 11:30 pm» */
  label: string;
}

/**
 * Estado real del local: el interruptor manual del panel manda; si el
 * horario automático está activo, además hay que estar dentro de horario.
 */
export function openStateFor(settings: Settings, now = new Date()): OpenState {
  if (!settings.ordersOpen) {
    return { open: false, label: "Cerrado por hoy" };
  }
  const sched = settings.schedule;
  if (!sched?.auto) return { open: true, label: "" };
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = sched.days[day];
  const yesterday = sched.days[(day + 6) % 7];
  // horario que cruza la medianoche (ej. 19:00 → 01:00)
  if (yesterday && !yesterday.closed && minutesOf(yesterday.close) < minutesOf(yesterday.open) && mins < minutesOf(yesterday.close)) {
    return { open: true, label: `Cierra a las ${prettyHour(yesterday.close)}` };
  }
  if (today && !today.closed) {
    const o = minutesOf(today.open);
    const c = minutesOf(today.close);
    const crosses = c <= o;
    if (mins >= o && (crosses || mins < c)) {
      return { open: true, label: `Cierra a las ${prettyHour(today.close)}` };
    }
    if (mins < o) {
      const diff = o - mins;
      const inTxt = diff < 60 ? `en ${diff} min` : `en ${Math.round(diff / 60)} h`;
      return { open: false, label: `Abrimos hoy a las ${prettyHour(today.open)} (${inTxt})` };
    }
  }
  for (let i = 1; i <= 7; i++) {
    const d = sched.days[(day + i) % 7];
    if (d && !d.closed) {
      const when = i === 1 ? "mañana" : `el ${DAY_NAMES[(day + i) % 7]}`;
      return { open: false, label: `Abrimos ${when} a las ${prettyHour(d.open)}` };
    }
  }
  return { open: false, label: "Cerrado por ahora" };
}

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
  /** Vuelve a mirar el menú publicado (agotados, precios…) sin recargar */
  refreshRemote: () => Promise<boolean>;
  saveCombo: (c: Combo) => void;
  deleteCombo: (id: string) => void;
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
  combos: Combo[];
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
        // Si hay una carta publicada más nueva, la usamos.
        await get().refreshRemote();
        set({ hydrated: true });
      },

      refreshRemote: async () => {
        const remote = await fetchRemoteMenu(get().data.github);
        if (remote && isNewer(remote, get().data)) {
          // conservamos la config de GitHub y la contraseña de este
          // dispositivo (la contraseña nunca viaja en el menú público)
          const local = get().data;
          // lo que viene publicado ya está en GitHub: no hay que re-subirlo
          try {
            localStorage.setItem("aol-last-published", remote.updatedAt);
          } catch {
            /* noop */
          }
          set({
            data: {
              ...remote,
              github: local.github.owner ? local.github : remote.github,
              settings: {
                ...remote.settings,
                adminPassword: local.settings.adminPassword || SEED.settings.adminPassword,
              },
            },
          });
          return true;
        }
        return false;
      },

      saveCombo: (c) =>
        set((st) => {
          const combos = [...st.data.combos];
          const i = combos.findIndex((x) => x.id === c.id);
          if (i >= 0) combos[i] = c;
          else combos.push(c);
          return { data: { ...st.data, combos, updatedAt: new Date().toISOString() } };
        }),

      deleteCombo: (id) =>
        set((st) => ({
          data: {
            ...st.data,
            combos: st.data.combos.filter((c) => c.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

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

      resetToFactory: () => set({ data: normalizeMenu(clone(SEED)) }),

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
        combos: st.data.combos,
        settings: st.data.settings,
        github: st.data.github,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedShape> | undefined;
        if (!p || !p.products?.length) return current;
        const seedVersion = SEED.version ?? 1;
        if ((p.version ?? 1) >= seedVersion) {
          return { ...current, data: normalizeMenu(p) };
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
        // nombres playeros: solo donde seguía el nombre de fábrica antiguo
        let renamed = false;
        const seedById = new Map(SEED.products.map((x) => [x.id, x]));
        const products2 = products.map((x) => {
          const fresh = seedById.get(x.id);
          if (fresh && OLD_DEFAULT_NAMES[x.id] === x.name && fresh.name !== x.name) {
            renamed = true;
            return { ...x, name: fresh.name };
          }
          return x;
        });
        return {
          ...current,
          data: normalizeMenu({
            ...p,
            products: products2,
            categories,
            version: seedVersion,
            // si hubo cambios, cuentan como edición nueva (se publican solos)
            ...(renamed ? { updatedAt: new Date().toISOString() } : {}),
          }),
        };
      },
    }
  )
);

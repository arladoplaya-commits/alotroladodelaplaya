"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Cliente de la marea: perfil local, favoritos, gustos y avisos.     */
/*  Todo vive en este navegador (localStorage); cuando el negocio       */
/*  conecta Supabase, los avisos y el push llegan de la nube.           */
/* ------------------------------------------------------------------ */

export type NotifKind = "open" | "close" | "new-product" | "system";

export interface InboxNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  whatsapp: string;
  joinedAt: string;
  memberNo: number;
}

export type ThemeMode = "day" | "sunset";

export interface CustomerPrefs {
  theme: ThemeMode;
  notifyOpenClose: boolean;
  notifyNewProducts: boolean;
  /** Permiso real del navegador para notificaciones del sistema */
  systemPermission: "default" | "granted" | "denied" | "unsupported";
}

interface CustomerState {
  profile: CustomerProfile | null;
  prefs: CustomerPrefs;
  /** ids de productos marcados con ❤️ */
  favorites: string[];
  /** bandeja de avisos (más nuevo al final) */
  inbox: InboxNotification[];
  /** ids de productos que el cliente ya conoce (para detectar nuevos) */
  seenProducts: string[];
  /** ids de avisos de la nube ya recibidos (para no duplicar) */
  seenAnnouncements: string[];
  /** cuántas veces armó cada producto → sus gustos */
  orderCounts: Record<string, number>;
  visits: number;
  lastVisit: string | null;
  /** apertura/cierre conocido por el watcher para detectar cambios */
  lastKnownOpen: boolean | null;

  register: (name: string, whatsapp: string) => void;
  updateProfile: (patch: Partial<Pick<CustomerProfile, "name" | "whatsapp">>) => void;
  forgetMe: () => void;
  setTheme: (t: ThemeMode) => void;
  setPref: <K extends keyof CustomerPrefs>(k: K, v: CustomerPrefs[K]) => void;
  toggleFavorite: (productId: string) => void;
  pushNotification: (n: { kind: NotifKind; title: string; body: string }) => void;
  markAllRead: () => void;
  clearInbox: () => void;
  syncSeenProducts: (ids: string[]) => { added: string[] };
  syncSeenAnnouncements: (ids: string[]) => void;
  bumpOrderCount: (productId: string, qty: number) => void;
  noteVisit: () => void;
  setLastKnownOpen: (open: boolean) => void;
}

const MAX_INBOX = 40;

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      profile: null,
      prefs: {
        theme: "day",
        notifyOpenClose: true,
        notifyNewProducts: true,
        systemPermission: "default",
      },
      favorites: [],
      inbox: [],
      seenProducts: [],
      seenAnnouncements: [],
      orderCounts: {},
      visits: 0,
      lastVisit: null,
      lastKnownOpen: null,

      register: (name, whatsapp) =>
        set((st) => ({
          profile: {
            id: uid("cli"),
            name: name.trim().slice(0, 40),
            whatsapp: whatsapp.replace(/[^\d+]/g, "").slice(0, 20),
            joinedAt: new Date().toISOString(),
            memberNo: Math.floor(100 + Math.random() * 900),
          },
          visits: st.visits + 1,
        })),

      updateProfile: (patch) =>
        set((st) =>
          st.profile
            ? {
                profile: {
                  ...st.profile,
                  ...patch,
                  name: (patch.name ?? st.profile.name).trim().slice(0, 40),
                  whatsapp: (patch.whatsapp ?? st.profile.whatsapp)
                    .replace(/[^\d+]/g, "")
                    .slice(0, 20),
                },
              }
            : {}
        ),

      forgetMe: () =>
        set((st) => ({
          profile: null,
          inbox: [],
          favorites: [],
          orderCounts: {},
          seenProducts: [],
          seenAnnouncements: [],
          prefs: { ...st.prefs, notifyOpenClose: true, notifyNewProducts: true },
        })),

      setTheme: (theme) => set((st) => ({ prefs: { ...st.prefs, theme } })),

      setPref: (k, v) => set((st) => ({ prefs: { ...st.prefs, [k]: v } })),

      toggleFavorite: (productId) =>
        set((st) => ({
          favorites: st.favorites.includes(productId)
            ? st.favorites.filter((id) => id !== productId)
            : [...st.favorites, productId],
        })),

      pushNotification: ({ kind, title, body }) =>
        set((st) => ({
          inbox: [
            ...st.inbox.slice(-MAX_INBOX + 1),
            {
              id: uid("ntf"),
              kind,
              title,
              body,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ],
        })),

      markAllRead: () =>
        set((st) => ({
          inbox: st.inbox.map((n) => (n.read ? n : { ...n, read: true })),
        })),

      clearInbox: () => set({ inbox: [] }),

      syncSeenProducts: (ids) => {
        const known = new Set(get().seenProducts);
        const added = ids.filter((id) => !known.has(id));
        if (added.length) set({ seenProducts: [...ids] });
        else if (known.size !== ids.length) set({ seenProducts: [...ids] });
        return { added };
      },

      syncSeenAnnouncements: (ids) =>
        set({ seenAnnouncements: ids.slice(-100) }),

      bumpOrderCount: (productId, qty) =>
        set((st) => ({
          orderCounts: {
            ...st.orderCounts,
            [productId]: (st.orderCounts[productId] ?? 0) + qty,
          },
        })),

      noteVisit: () =>
        set((st) => ({
          visits: st.visits + 1,
          lastVisit: new Date().toISOString(),
        })),

      setLastKnownOpen: (open) => set({ lastKnownOpen: open }),
    }),
    { name: "aol-customer-v1" }
  )
);

/** Cantidad de avisos sin leer (para la campanita) */
export function unreadCount(inbox: InboxNotification[]): number {
  return inbox.filter((n) => !n.read).length;
}

/**
 * Notificación del sistema (si el navegador lo permite) + vibración.
 * Devuelve true si se mostró la notificación del sistema.
 */
export function showSystemNotification(title: string, body: string): boolean {
  try {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission !== "granted") return false;
    new Notification(title, {
      body,
      icon: "/images/icon-192.png",
      badge: "/images/icon-192.png",
      tag: "aol-shack",
    });
    return true;
  } catch {
    return false;
  }
}

/** Vibración corta de confirmación (móviles) */
export function buzz(pattern: number | number[] = 35): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* sin soporte */
  }
}

/**
 * Estimación amable de espera según la hora local (heurística playera):
 * mediodía y noche son hora pico en el shack.
 */
export function waitEstimate(open: boolean): string {
  if (!open) return "Abrimos esta noche 🌙";
  const h = new Date().getHours();
  const peak = (h >= 19 && h <= 22) || (h >= 12 && h <= 13);
  return peak ? "⏱️ Espera hoy ~20-30 min" : "⏱️ Espera hoy ~15 min";
}

/** Quita acentos y pasa a minúsculas para buscar sin complicaciones */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

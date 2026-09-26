"use client";

import { create } from "zustand";
import type { Review, SupaCreds, SyncConfig } from "@/lib/types";
import {
  sbAdminDeleteReview,
  sbAdminReviews,
  sbAdminSetReviewHidden,
  sbFetchReviews,
  sbInsertReview,
} from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Reseñas: modo local (localStorage) o nube (Supabase).              */
/*  · Bandeja de salida con reenvío automático cuando hay internet.    */
/*  · Límite anti-spam: 45 s entre reseñas del mismo dispositivo.      */
/*  · Sondeo de la nube cada 45 s para refrescar la lista.             */
/* ------------------------------------------------------------------ */

const LOCAL_KEY = "aol-reviews-v1"; // reseñas en modo local
const CACHE_KEY = "aol-reviews-cache-v1"; // caché de la nube (offline)
const OUTBOX_KEY = "aol-reviews-outbox-v1"; // envíos pendientes
const LAST_POST_KEY = "aol-rev-last-v1"; // límite anti-spam
const SEEDS_OFF_KEY = "aol-seeds-off-v1"; // semillas quitadas por el admin
const CONFIG_KEY = "aol-sync-override-v1"; // config de este dispositivo

const DEFAULT_SYNC: SyncConfig = { provider: "none", url: "", anonKey: "" };

/** Intervalo mínimo entre reseñas del mismo dispositivo (ms) */
const RATE_LIMIT_MS = 45_000;
/** Intervalo de sondeo de la nube (ms) */
const POLL_MS = 45_000;

export const SEED_REVIEWS: Review[] = [
  {
    id: "seed-mariana",
    name: "Mariana G.",
    place: "Vedado",
    rating: 5,
    text: "La Doble Mixta es otro nivel: jugosa y con ese toque dulce de las chips de boniato. Brutal.",
    createdAt: "2026-08-20T19:40:00.000Z",
  },
  {
    id: "seed-yasiel",
    name: "Yasiel R.",
    place: "El Vedado",
    rating: 5,
    text: "Pedí por WhatsApp y en 20 minutos llegó todo calientico a la puerta. 10/10.",
    createdAt: "2026-08-28T21:10:00.000Z",
  },
  {
    id: "seed-camila",
    name: "Camila & Leo",
    place: "Centro Habana",
    rating: 5,
    text: "El Crispy con esos chips no lo encuentras ni en la playa. Repetimos seguro.",
    createdAt: "2026-09-05T20:05:00.000Z",
  },
];

/* ----------------------------- helpers ----------------------------- */

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

function sortNew(list: Review[]): Review[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function seedsOff(): boolean {
  return readJson<boolean>(SEEDS_OFF_KEY) === true;
}

function credsOf(): SupaCreds | null {
  const cfg = readJson<SyncConfig>(CONFIG_KEY);
  if (!cfg || cfg.provider !== "supabase") return null;
  if (!cfg.url || cfg.anonKey.trim().length < 20) return null;
  return { url: cfg.url, anonKey: cfg.anonKey };
}

/* ------------------------------- store ------------------------------- */

interface ReviewsState {
  reviews: Review[];
  adminList: Review[];
  adminStatus: string;
  config: SyncConfig;
  lastSync: string | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  submit: (input: {
    name: string;
    place: string;
    rating: number;
    text: string;
  }) => Promise<{ ok: boolean; error?: string; queued?: boolean }>;
  loadAdmin: (pass: string) => Promise<void>;
  setHidden: (id: string, hidden: boolean, pass: string) => Promise<void>;
  adminDelete: (id: string, pass: string) => Promise<void>;
  removeSeed: () => void;
  restoreSeeds: () => void;
  connect: (cfg: SyncConfig) => void;
  disconnect: () => void;
  publishConfigTo: (gh: { owner: string; repo: string; branch: string; path: string; token: string }) => Promise<{ ok: boolean; error?: string }>;
}

/** Publica la config de Supabase en el menu.json del repo para que todos los dispositivos sincronicen */
async function publishConfig(
  gh: { owner: string; repo: string; branch: string; path: string; token: string },
  cfg: SyncConfig
): Promise<{ ok: boolean; error?: string }> {
  const API = "https://api.github.com";
  const headers = {
    Authorization: `Bearer ${gh.token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
  const filePath = (gh.path || "public/data/menu.json").replace(/^\/+/, "");
  const base = `${API}/repos/${gh.owner}/${gh.repo}/contents/${filePath}`;
  try {
    let sha: string | undefined;
    const res = await fetch(`${base}?ref=${encodeURIComponent(gh.branch)}`, {
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      sha = json.sha;
    } else if (res.status !== 404) {
      return {
        ok: false,
        error: `No se pudo leer el archivo (${res.status}). Revisa owner/repo/rama y el permiso del token.`,
      };
    }
    // Descarga el menu.json actual para no perder el menú
    let menu: Record<string, unknown> | null = null;
    try {
      const m = await fetch(
        `https://${gh.owner}.github.io/${gh.repo}/${filePath.replace(/^public\//, "")}`,
        { cache: "no-store" }
      );
      if (m.ok) menu = await m.json();
    } catch {
      /* si no existe, seguimos */
    }
    if (menu) {
      (menu as { sync?: SyncConfig }).sync = cfg;
    }
    const content = btoa(
      JSON.stringify(
        menu ?? { sync: cfg },
        null,
        2
      )
    );
    const put = await fetch(base, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "chore: publicar config de sincronización",
        content,
        branch: gh.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!put.ok) {
      const j = await put.json().catch(() => ({}));
      if (put.status === 401) return { ok: false, error: "Token inválido o expirado (401)." };
      if (put.status === 403) return { ok: false, error: "El token no tiene permiso de escritura (403)." };
      if (put.status === 404) return { ok: false, error: "Repositorio o rama no encontrada (404)." };
      return { ok: false, error: (j as { message?: string }).message ?? `Error de GitHub (${put.status})` };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof TypeError)
      return { ok: false, error: "Sin conexión con GitHub. Verifica tu internet." };
    return { ok: false, error: "Error inesperado al publicar" };
  }
}

export const useReviewsStore = create<ReviewsState>()((set, get) => ({
  reviews: [],
  adminList: [],
  adminStatus: "",
  config: DEFAULT_SYNC,
  lastSync: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const cfg = readJson<SyncConfig>(CONFIG_KEY) ?? DEFAULT_SYNC;
    const local = readJson<Review[]>(LOCAL_KEY) ?? [];
    const cache = readJson<Review[]>(CACHE_KEY) ?? [];
    set({ config: cfg, hydrated: true });
    if (cfg.provider === "supabase") {
      set({ reviews: cache.length ? cache : sortNew(local) });
      void get().refresh();
      // Reenvía lo que quedó en cola
      const creds = credsOf();
      if (creds) void get().refresh();
    } else {
      const base = seedsOff() ? [] : SEED_REVIEWS;
      set({ reviews: sortNew([...base, ...local]) });
    }
    // Sondeo periódico solo en modo nube
    if (cfg.provider === "supabase") {
      setInterval(() => {
        if (document.visibilityState === "visible") void get().refresh();
      }, POLL_MS);
    }
  },

  refresh: async () => {
    const creds = credsOf();
    if (!creds) return;
    const res = await sbFetchReviews(creds);
    if (res.ok && res.data) {
      const list = sortNew(res.data);
      writeJson(CACHE_KEY, list);
      set({ reviews: list, lastSync: new Date().toISOString() });
    }
  },

  submit: async (input) => {
    const cfg = get().config;
    const now = Date.now();
    const last = readJson<number>(LAST_POST_KEY) ?? 0;
    if (now - last < RATE_LIMIT_MS) {
      return {
        ok: false,
        error: "Respira las olas: espera unos segundos entre reseñas 🌊",
      };
    }
    const review: Review = {
      id: `rev-${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      name: input.name.trim().slice(0, 24),
      place: input.place.trim().slice(0, 24),
      rating: input.rating,
      text: input.text.trim().slice(0, 200),
      createdAt: new Date().toISOString(),
    };

    if (cfg.provider !== "supabase") {
      // Modo local: se guarda en este dispositivo
      const local = readJson<Review[]>(LOCAL_KEY) ?? [];
      local.unshift(review);
      writeJson(LOCAL_KEY, local);
      writeJson(LAST_POST_KEY, now);
      const base = seedsOff() ? [] : SEED_REVIEWS;
      set({ reviews: sortNew([...base, ...local]) });
      return { ok: true };
    }

    // Modo nube: inserta; si falla, encola
    const creds = credsOf();
    writeJson(LAST_POST_KEY, now);
    if (creds) {
      const res = await sbInsertReview(creds, review);
      if (res.ok) {
        void get().refresh();
        return { ok: true };
      }
    }
    const box = readJson<Review[]>(OUTBOX_KEY) ?? [];
    box.push(review);
    writeJson(OUTBOX_KEY, box);
    set({ reviews: sortNew([review, ...get().reviews]) });
    return { ok: true, queued: true };
  },

  loadAdmin: async (pass) => {
    const creds = credsOf();
    if (!creds) {
      // Modo local: el panel ve todo lo de este dispositivo
      const local = readJson<Review[]>(LOCAL_KEY) ?? [];
      const base = seedsOff() ? [] : SEED_REVIEWS;
      set({
        adminList: sortNew([...local, ...base]),
        adminStatus: "local",
      });
      return;
    }
    const res = await sbAdminReviews(creds, pass);
    if (!res.ok) {
      set({
        adminStatus: `La conexión falló: ${
          (res.body as { message?: string })?.message ?? `Error ${res.status}`
        }`,
      });
      return;
    }
    set({ adminList: sortNew(res.data ?? []), adminStatus: "cloud" });
  },

  setHidden: async (id, hidden, pass) => {
    const creds = credsOf();
    if (!creds) {
      // En modo local, las semillas se quitan definitivamente
      if (id.startsWith("seed-")) {
        get().removeSeed();
        set({
          adminList: get().adminList.filter((r) => r.id !== id),
        });
        return;
      }
      const local = readJson<Review[]>(LOCAL_KEY) ?? [];
      writeJson(LOCAL_KEY, local.filter((r) => r.id !== id));
      set({ adminList: get().adminList.filter((r) => r.id !== id) });
      return;
    }
    const prev = get().adminList;
    set({
      adminList: prev.map((r) => (r.id === id ? { ...r, hidden } : r)),
    });
    const res = await sbAdminSetReviewHidden(creds, pass, id, hidden);
    if (!res.ok) {
      set({ adminList: prev });
      throw new Error("No se pudo actualizar en la nube");
    }
  },

  adminDelete: async (id, pass) => {
    const creds = credsOf();
    if (!creds) {
      if (id.startsWith("seed-")) get().removeSeed();
      else {
        const local = readJson<Review[]>(LOCAL_KEY) ?? [];
        writeJson(LOCAL_KEY, local.filter((r) => r.id !== id));
      }
      set({ adminList: get().adminList.filter((r) => r.id !== id) });
      return;
    }
    const res = await sbAdminDeleteReview(creds, pass, id);
    if (!res.ok) throw new Error("No se pudo borrar en la nube");
    set({ adminList: get().adminList.filter((r) => r.id !== id) });
  },

  removeSeed: () => {
    writeJson(SEEDS_OFF_KEY, true);
    const local = readJson<Review[]>(LOCAL_KEY) ?? [];
    set({ reviews: sortNew(local) });
  },

  restoreSeeds: () => {
    writeJson(SEEDS_OFF_KEY, false);
    const local = readJson<Review[]>(LOCAL_KEY) ?? [];
    set({ reviews: sortNew([...SEED_REVIEWS, ...local]) });
  },

  connect: (cfg) => {
    writeJson(CONFIG_KEY, cfg);
    set({ config: cfg, reviews: [], hydrated: false });
    void get().hydrate();
  },

  disconnect: () => {
    writeJson(CONFIG_KEY, DEFAULT_SYNC);
    set({ config: DEFAULT_SYNC });
    const local = readJson<Review[]>(LOCAL_KEY) ?? [];
    const base = seedsOff() ? [] : SEED_REVIEWS;
    set({ reviews: sortNew([...base, ...local]) });
  },

  publishConfigTo: publishConfig,
}));

"use client";

import { create } from "zustand";
import { getGhToken, putFileToGitHub } from "@/lib/gh";
import type { MenuData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Publicación de la carta en GitHub                                  */
/*                                                                     */
/*  · publishMenu: sube menu.json (sin la contraseña del panel).       */
/*  · Guardado automático: cada cambio del panel se sube solo unos     */
/*    segundos después de dejar de editar. Varios cambios seguidos     */
/*    van en un único guardado (cada subida redespliega la web).       */
/* ------------------------------------------------------------------ */

const AUTO_KEY = "aol-autopublish"; // "0" = apagado
const LAST_KEY = "aol-last-published"; // updatedAt ya subido
const DEBOUNCE_MS = 15_000;
const RETRY_MS = 60_000;

/** JSON público de la carta: la contraseña del panel nunca se publica */
export function publicMenuJson(data: MenuData): string {
  return JSON.stringify(
    { ...data, settings: { ...data.settings, adminPassword: "" } },
    null,
    2
  );
}

export function githubReady(data: MenuData): boolean {
  return !!(data.github.owner && data.github.repo && getGhToken());
}

export async function publishMenu(
  data: MenuData,
  message = `chore: actualizar carta (${new Date().toISOString()})`
): Promise<{ ok: boolean; error?: string }> {
  const token = getGhToken();
  const g = data.github;
  if (!g.owner || !g.repo || !token) {
    return { ok: false, error: "Falta configurar GitHub (usuario, repo y token)" };
  }
  const res = await putFileToGitHub(
    { owner: g.owner, repo: g.repo, branch: g.branch || "main", path: g.path || "public/data/menu.json" },
    token,
    publicMenuJson(data),
    message
  );
  if (res.ok) {
    try {
      localStorage.setItem(LAST_KEY, data.updatedAt);
    } catch {
      /* noop */
    }
  }
  return res;
}

export function lastPublished(): string {
  try {
    return localStorage.getItem(LAST_KEY) ?? "";
  } catch {
    return "";
  }
}

export function autoPublishOn(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== "0";
  } catch {
    return true;
  }
}

export type SyncState = "off" | "idle" | "pending" | "saving" | "saved" | "error";

interface AutoPublishState {
  state: SyncState;
  savedAt: string | null;
  error: string;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  /** Llamar cuando cambia la carta: agenda el guardado */
  schedule: (getData: () => MenuData) => void;
  /** Guardar ya (botón «Publicar ahora» o al salir del panel) */
  flush: (getData: () => MenuData) => Promise<boolean>;
}

let timer: ReturnType<typeof setTimeout> | null = null;

export const useAutoPublish = create<AutoPublishState>()((set, get) => ({
  state: "idle",
  savedAt: null,
  error: "",
  enabled: true,

  setEnabled: (v) => {
    try {
      localStorage.setItem(AUTO_KEY, v ? "1" : "0");
    } catch {
      /* noop */
    }
    set({ enabled: v, state: v ? "idle" : "off" });
  },

  schedule: (getData) => {
    const data = getData();
    if (!get().enabled || !githubReady(data)) {
      set({ state: githubReady(data) ? "off" : "idle" });
      return;
    }
    if (data.updatedAt === lastPublished()) return;
    if (timer) clearTimeout(timer);
    set({ state: "pending", error: "" });
    timer = setTimeout(() => void get().flush(getData), DEBOUNCE_MS);
  },

  flush: async (getData) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const data = getData();
    if (!githubReady(data)) return false;
    if (data.updatedAt === lastPublished()) {
      set({ state: "saved" });
      return true;
    }
    set({ state: "saving" });
    const res = await publishMenu(data);
    if (res.ok) {
      set({ state: "saved", savedAt: new Date().toISOString(), error: "" });
      // si hubo cambios mientras subía, se agenda otra vuelta
      if (getData().updatedAt !== data.updatedAt) get().schedule(getData);
      return true;
    }
    set({ state: "error", error: res.error ?? "Error al guardar en GitHub" });
    timer = setTimeout(() => void get().flush(getData), RETRY_MS);
    return false;
  },
}));

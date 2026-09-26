"use client";

import { useReviewsStore } from "@/lib/reviews";
import { useCustomerStore } from "@/lib/customer";
import {
  sbDeletePushSubscription,
  sbInsertPushSubscription,
  sbUpsertCustomer,
} from "@/lib/supabase";
import type { SupaCreds } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Puente con la nube (Supabase):                                     */
/*  · Registro del cliente guardado en la tabla `customers`            */
/*  · Web Push real (VAPID) con la tabla `push_subscriptions`          */
/*  Todo es opcional: sin Supabase la carta sigue funcionando 100%.    */
/* ------------------------------------------------------------------ */

const VAPID_LS_KEY = "aol-vapid-key";

function cloudCreds(): SupaCreds | null {
  const cfg = useReviewsStore.getState().config;
  if (cfg.provider !== "supabase" || !cfg.url || !cfg.anonKey) return null;
  return { url: cfg.url, anonKey: cfg.anonKey };
}

/** Clave VAPID pública: variable de entorno o la puesta desde el panel */
export function getVapidKey(): string {
  try {
    const ls = localStorage.getItem(VAPID_LS_KEY);
    if (ls) return ls.trim();
  } catch {
    /* sin localStorage */
  }
  try {
    return (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").trim();
  } catch {
    return "";
  }
}

/** El negocio puede pegar aquí su clave VAPID sin recompilar */
export function setVapidKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(VAPID_LS_KEY, key.trim());
    else localStorage.removeItem(VAPID_LS_KEY);
  } catch {
    /* sin localStorage */
  }
}

export function pushSupported(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      typeof Notification !== "undefined" &&
      "PushManager" in window
    );
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export type PushResult =
  | "ok"
  | "no-support"
  | "no-permission"
  | "no-key"
  | "no-cloud"
  | "error";

/**
 * Suscribe este teléfono a Web Push y guarda la suscripción en Supabase.
 * Se llama justo después de que el cliente acepta las notificaciones.
 */
export async function subscribeToPush(): Promise<PushResult> {
  try {
    if (!pushSupported()) return "no-support";
    if (Notification.permission !== "granted") return "no-permission";
    const key = getVapidKey();
    if (!key) return "no-key";

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const appServerKey = urlBase64ToUint8Array(key) as BufferSource;
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      }));

    const creds = cloudCreds();
    if (!creds) return "no-cloud";

    const json = sub.toJSON() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth)
      return "error";

    const customerId = useCustomerStore.getState().profile?.id ?? null;
    const saved = await sbInsertPushSubscription(creds, {
      customerId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    return saved.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/** Da de baja la suscripción push de este teléfono (mejor esfuerzo) */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    const creds = cloudCreds();
    if (creds) await sbDeletePushSubscription(creds, endpoint);
  } catch {
    /* best effort */
  }
}

/** Guarda/actualiza el cliente en la nube (idempotente, nunca bloquea) */
export async function syncCustomerToCloud(): Promise<"ok" | "no-cloud" | "error"> {
  try {
    const creds = cloudCreds();
    const profile = useCustomerStore.getState().profile;
    if (!creds || !profile) return "no-cloud";
    const res = await sbUpsertCustomer(creds, {
      id: profile.id,
      member_no: profile.memberNo,
      name: profile.name,
      whatsapp: profile.whatsapp,
      tastes: useCustomerStore.getState().orderCounts,
      created_at: profile.joinedAt,
    });
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

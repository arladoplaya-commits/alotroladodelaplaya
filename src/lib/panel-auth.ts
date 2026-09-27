"use client";

import { cloudCreds } from "@/lib/reviews";
import { sbAdminSetPass, sbCheckPanelPass } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Contraseña del panel: la misma en todos los teléfonos.             */
/*                                                                     */
/*  · Con la nube (Supabase) se comprueba allí, cifrada con bcrypt.    */
/*  · Sin conexión solo se puede entrar en un teléfono que ya entró    */
/*    antes con la contraseña correcta (nunca con la de fábrica en un  */
/*    teléfono nuevo).                                                 */
/*  · Sin nube configurada se usa la de este teléfono (como antes).    */
/* ------------------------------------------------------------------ */

const VERIFIED_KEY = "aol-pass-verified";

function markVerified(): void {
  try {
    localStorage.setItem(VERIFIED_KEY, "1");
  } catch {
    /* noop */
  }
}

function wasVerified(): boolean {
  try {
    return localStorage.getItem(VERIFIED_KEY) === "1";
  } catch {
    return false;
  }
}

export type LoginResult =
  | { ok: true; via: "cloud" | "local" }
  | { ok: false; reason: "wrong" | "offline" };

export async function verifyPanelPass(pass: string, localPass: string): Promise<LoginResult> {
  const creds = cloudCreds();
  if (creds) {
    const r = await sbCheckPanelPass(creds, pass);
    if (r === "ok") {
      markVerified();
      return { ok: true, via: "cloud" };
    }
    if (r === "wrong") return { ok: false, reason: "wrong" };
    if (r === "offline") {
      if (wasVerified() && pass === localPass) return { ok: true, via: "local" };
      return { ok: false, reason: "offline" };
    }
    // "nosetup": la nube aún no tiene las tablas → contraseña de este teléfono
  }
  return pass === localPass ? { ok: true, via: "local" } : { ok: false, reason: "wrong" };
}

export type ChangeResult =
  | { ok: true; cloud: boolean }
  | { ok: false; error: string };

/** Cambia la contraseña para todos los teléfonos (si hay nube) */
export async function changePanelPass(oldPass: string, newPass: string): Promise<ChangeResult> {
  const creds = cloudCreds();
  if (!creds) return { ok: true, cloud: false };
  const res = await sbAdminSetPass(creds, oldPass, newPass);
  if (res.ok) {
    markVerified();
    return { ok: true, cloud: true };
  }
  if (res.status === 0) {
    return { ok: false, error: "Sin conexión: la contraseña no se cambió. Inténtalo con internet." };
  }
  const msg = String((res.body as { message?: string } | null)?.message ?? "");
  if (/incorrecta/i.test(msg)) {
    return { ok: false, error: "La contraseña actual no coincide con la de la nube. Sal y vuelve a entrar al panel." };
  }
  // la nube aún no tiene las tablas: se cambia solo en este teléfono
  return { ok: true, cloud: false };
}

"use client";

import { useEffect, useRef } from "react";
import { openStateFor, useMenuStore } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { useReviewsStore } from "@/lib/reviews";
import { sbFetchAnnouncements } from "@/lib/supabase";
import { syncCustomerToCloud } from "@/lib/cloud";
import {
  showSystemNotification,
  useCustomerStore,
  type NotifKind,
} from "@/lib/customer";
import { detectLang, productName, trNow } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Vigía del shack: detecta apertura/cierre y productos nuevos,       */
/*  deja el aviso en la campanita y avisa al sistema si hay permiso.   */
/*  Si el negocio conectó Supabase, además consulta los avisos         */
/*  publicados desde el panel (apertura, cierre, producto nuevo).      */
/* ------------------------------------------------------------------ */

type Snapshot = { open: boolean; productIds: string[] };

function readSnapshotFromStorage(): Snapshot | null {
  try {
    const raw = localStorage.getItem("aol-menu-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      state?: {
        data?: { settings?: Settings; products?: { id: string }[] };
        settings?: Settings;
        products?: { id: string }[];
      };
    };
    const s = parsed?.state;
    // zustand persist guarda los campos partialize() directos en state
    const settings = s?.settings ?? s?.data?.settings;
    const products = s?.products ?? s?.data?.products;
    if (!settings || !Array.isArray(products)) return null;
    return {
      // abierto/cerrado según el horario (y el interruptor «cerrado hoy»)
      open: openStateFor(settings).open,
      productIds: products.map((p) => p.id),
    };
  } catch {
    return null;
  }
}

/** Entrega un aviso respetando las preferencias del cliente */
function deliver(
  kind: NotifKind,
  title: string,
  body: string
): boolean {
  const st = useCustomerStore.getState();
  if (kind === "open" || kind === "close") {
    if (!st.profile || !st.prefs.notifyOpenClose) return false;
  }
  if (kind === "new-product" && !st.prefs.notifyNewProducts) return false;
  st.pushNotification({ kind, title, body });
  showSystemNotification(title, body);
  return true;
}

export function NotificationWatcher() {
  const data = useMenuStore((s) => s.data);

  const openRef = useRef<boolean | null>(null);
  const idsRef = useRef<string[]>([]);

  // Línea base inicial (solo una vez)
  useEffect(() => {
    const c = useCustomerStore.getState();
    c.noteVisit();
    const { syncSeenProducts, setLastKnownOpen } = c;
    const snap = readSnapshotFromStorage();
    const ids = snap?.productIds ?? data.products.map((p) => p.id);
    syncSeenProducts(ids);
    const nowOpen = openStateFor(data.settings).open;
    setLastKnownOpen(snap?.open ?? nowOpen);
    openRef.current = snap?.open ?? nowOpen;
    idsRef.current = ids;
    // Registro del cliente a la nube (idempotente; silencioso si no hay Supabase)
    void syncCustomerToCloud();
  }, []);

  // Reacción a cambios del menú (misma pestaña u otras pestañas)
  useEffect(() => {
    const compare = (snap: Snapshot) => {
      // 1) Apertura / cierre
      if (openRef.current !== null && openRef.current !== snap.open) {
        if (snap.open) {
          deliver(
            "open",
            trNow("¡Abrimos la marea! 🌊", "The tide is open! 🌊"),
            trNow(
              "El shack está en fuego. La carta está caliente y esperando tu pedido.",
              "The shack is fired up. The menu is hot and waiting for your order."
            )
          );
        } else {
          deliver(
            "close",
            trNow("Cerramos por hoy 🌙", "Closed for today 🌙"),
            trNow(
              "El shack descansa. Vuelve en la próxima noche playera.",
              "The shack is resting. Come back on the next beach night."
            )
          );
        }
        useCustomerStore.getState().setLastKnownOpen(snap.open);
      }
      openRef.current = snap.open;

      // 2) Productos nuevos
      const known = new Set(idsRef.current);
      const fresh = snap.productIds.filter((id) => !known.has(id));
      if (idsRef.current.length > 0 && fresh.length > 0) {
        const menu = useMenuStore.getState().data;
        const names = fresh
          .map((id) => menu.products.find((p) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => !!p && p.available)
          .slice(0, 3);
        if (names.length) {
          const lang = useCustomerStore.getState().prefs.lang ?? detectLang();
          const nameOf = (p: (typeof names)[number]) => productName(p, lang);
          const title =
            names.length === 1
              ? trNow(`🆕 ${nameOf(names[0])} — nuevo en la carta`, `🆕 ${nameOf(names[0])} — new on the menu`)
              : trNow(`🆕 ${names.length} novedades en la carta`, `🆕 ${names.length} new items on the menu`);
          const body = names.map((p) => `${p.emoji} ${nameOf(p)}`).join(" · ");
          deliver("new-product", title, body);
        }
      }
      useCustomerStore.getState().syncSeenProducts(snap.productIds);
      idsRef.current = snap.productIds;
    };

    // Estado inicial del ciclo
    openRef.current = openStateFor(data.settings).open;
    idsRef.current = data.products.map((p) => p.id);

    // Sondeo cada 15 s (cubre cambios de otras pestañas/dispositivo)
    const timer = window.setInterval(() => {
      const snap = readSnapshotFromStorage();
      if (snap) compare(snap);
    }, 15_000);

    // Reacción inmediata cuando otra pestaña escribe el menú
    const onStorage = (e: StorageEvent) => {
      if (e.key === "aol-menu-v1" || e.key === null) {
        const snap = readSnapshotFromStorage();
        if (snap) compare(snap);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [data]);

  // Avisos de la nube (Supabase): publicados desde el panel → Hoy → Avisos
  useEffect(() => {
    let cancelled = false;

    const pull = async () => {
      try {
        const cfg = useReviewsStore.getState().config;
        if (cfg.provider !== "supabase") return;
        const res = await sbFetchAnnouncements({
          url: cfg.url,
          anonKey: cfg.anonKey,
        });
        if (cancelled || !res.ok || !res.data?.length) return;

        const st = useCustomerStore.getState();
        const seen = new Set(st.seenAnnouncements);
        const fresh = res.data.filter((a) => !seen.has(a.id));
        if (!fresh.length) return;

        for (const a of [...fresh].reverse()) {
          deliver(a.kind, a.title, a.body);
        }
        st.syncSeenAnnouncements([
          ...st.seenAnnouncements,
          ...fresh.map((a) => a.id),
        ]);
      } catch {
        /* sin nube o sin internet: la campanita local sigue funcionando */
      }
    };

    void pull();
    const cloudTimer = window.setInterval(() => void pull(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(cloudTimer);
    };
  }, []);

  return null;
}

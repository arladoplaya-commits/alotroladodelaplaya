"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useTr } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/*  Luciérnagas de la noche de playa + modo ligero para conexiones      */
/*  lentas y teléfonos modestos.                                        */
/* ------------------------------------------------------------------ */

type NetInfo = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: "change", cb: () => void) => void;
  removeEventListener?: (type: "change", cb: () => void) => void;
};
type BatteryInfo = { level: number; charging: boolean };
type Nav = Navigator & {
  connection?: NetInfo;
  deviceMemory?: number;
  getBattery?: () => Promise<BatteryInfo>;
};

type Why = "" | "savedata" | "slow-conn" | "modest-phone" | "low-battery" | "low-fps" | "manual";

/** Motivo del modo ligero, en el idioma de la carta */
const WHY_LABEL: Record<Exclude<Why, "">, [string, string]> = {
  savedata: ["ahorro de datos", "data saver"],
  "slow-conn": ["conexión lenta", "slow connection"],
  "modest-phone": ["teléfono modesto", "modest phone"],
  "low-battery": ["batería baja", "low battery"],
  "low-fps": ["animaciones lentas", "slow animations"],
  manual: ["elegido por ti", "your choice"],
};

const SAVED_KEY = "aol-lite"; // "1" / "0" solo si el cliente lo eligió a mano

function saved(): "1" | "0" | null {
  try {
    const v = localStorage.getItem(SAVED_KEY);
    return v === "1" || v === "0" ? v : null;
  } catch {
    return null;
  }
}

/** Lo que se sabe al instante: conexión y capacidades del teléfono */
function quickCheck(): Why {
  const n = navigator as Nav;
  const c = n.connection;
  if (c?.saveData) return "savedata";
  if (c && /(^|-)(2g|3g)$/.test(c.effectiveType ?? "")) return "slow-conn";
  if ((n.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return "modest-phone";
  return "";
}

/** Mide cuántos cuadros por segundo logra el teléfono (≈1,2 s) */
function measureFps(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      frames += 1;
      if (t - start < 1200) requestAnimationFrame(tick);
      else resolve((frames * 1000) / (t - start));
    };
    requestAnimationFrame(tick);
  });
}

/**
 * Modo ligero automático: la carta mira la conexión y el teléfono y, si
 * puede, va con todas las animaciones; si no, se aligera sola. La etiqueta
 * solo aparece cuando el modo ligero está activo, para poder quitarlo.
 */
export function LiteModeButton() {
  const [why, setWhy] = useState<Why>(() => {
    const s = saved();
    if (s === "1") return "manual";
    if (s === "0") return "";
    return quickCheck();
  });
  const lite = why !== "";

  useEffect(() => {
    document.documentElement.classList.toggle("lite", lite);
  }, [lite]);

  // Revisión continua: cambios de conexión, batería y prueba de fluidez
  useEffect(() => {
    if (saved() !== null) return;
    const n = navigator as Nav;
    const recheck = () => setWhy((w) => (w === "low-battery" || w === "low-fps" ? w : quickCheck()));
    n.connection?.addEventListener?.("change", recheck);

    let cancelled = false;
    n.getBattery?.()
      .then((b) => {
        if (!cancelled && b.level < 0.2 && !b.charging) setWhy((w) => w || "low-battery");
      })
      .catch(() => undefined);

    // prueba de fluidez con la carta ya pintada y la pestaña visible
    const timer = window.setTimeout(async () => {
      if (cancelled || document.hidden || document.documentElement.classList.contains("lite")) return;
      const fps = await measureFps();
      if (cancelled) return;
      // solo para esta visita: un tirón puntual no marca el teléfono para siempre
      if (fps < 40) setWhy((w) => w || "low-fps");
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      n.connection?.removeEventListener?.("change", recheck);
    };
  }, []);

  // Con la pestaña oculta nada se anima: ahorra batería
  useEffect(() => {
    const onVis = () =>
      document.documentElement.classList.toggle("aol-paused", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const tr = useTr();

  if (!lite) return null;

  const turnOnAnimations = () => {
    try {
      localStorage.setItem(SAVED_KEY, "0");
    } catch {
      /* noop */
    }
    setWhy("");
    toast(tr("✨ Animaciones activadas", "✨ Animations on"), {
      description: tr("Toda la playa en movimiento", "The whole beach in motion"),
    });
  };

  const label = why ? tr(...WHY_LABEL[why]) : "";

  return (
    <button
      type="button"
      onClick={turnOnAnimations}
      title={tr("Toca para ver todas las animaciones", "Tap to see all animations")}
      className="inline-flex items-center gap-1 rounded-full bg-[#f2c230] px-3 py-1 text-xs font-bold text-[#7a5410] transition active:scale-95"
    >
      <Zap className="size-3.5" aria-hidden="true" />
      {tr("Modo ligero", "Light mode")} · {label} · <span className="underline">{tr("ver animaciones", "see animations")}</span>
    </button>
  );
}

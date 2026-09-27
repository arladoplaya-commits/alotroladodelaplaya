"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Luciérnagas de la noche de playa + modo ligero para conexiones      */
/*  lentas y teléfonos modestos.                                        */
/* ------------------------------------------------------------------ */

/** Partículas que suben despacio (solo se ven en modo noche, vía CSS) */
export function NightGlow() {
  const [count] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 10 : 22
  );
  return (
    <div className="aol-glow" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const d = 14 + ((i * 7) % 16);
        const style = {
          left: `${(i * 53) % 100}%`,
          "--s": `${3 + (i % 4)}px`,
          "--d": `${d}s`,
          "--dl": `${-((i * 3.7) % d)}s`,
          "--x": `${(i % 2 ? 1 : -1) * (20 + ((i * 11) % 50))}px`,
        } as React.CSSProperties;
        return <span key={i} className={i % 3 === 0 ? "teal" : ""} style={style} />;
      })}
    </div>
  );
}

type NetInfo = { saveData?: boolean; effectiveType?: string };

/** ¿Arrancamos en modo ligero? Lo elegido por el cliente manda. */
function initialLite(): boolean {
  try {
    const saved = localStorage.getItem("aol-lite");
    if (saved === "1") return true;
    if (saved === "0") return false;
  } catch {
    /* sin localStorage */
  }
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return !!c && (!!c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType ?? ""));
}

/** Botón ⚡ del encabezado: activa/desactiva el modo ligero */
export function LiteModeButton() {
  const [lite, setLite] = useState(initialLite);

  useEffect(() => {
    document.documentElement.classList.toggle("lite", lite);
  }, [lite]);

  // Con la pestaña oculta nada se anima: ahorra batería
  useEffect(() => {
    const onVis = () =>
      document.documentElement.classList.toggle("aol-paused", document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const toggle = () => {
    const next = !lite;
    setLite(next);
    try {
      localStorage.setItem("aol-lite", next ? "1" : "0");
    } catch {
      /* noop */
    }
    toast(next ? "⚡ Modo ligero activado" : "✨ Animaciones activadas", {
      description: next
        ? "Menos animaciones: ahorra datos y batería"
        : "Toda la playa en movimiento",
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={lite}
      title="Menos animaciones: ahorra datos y batería"
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition active:scale-95 ${
        lite
          ? "bg-[#f2c230] text-[#7a5410]"
          : "aol-chip bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] hover:bg-[#fdf3e0]"
      }`}
    >
      <Zap className="size-3.5" aria-hidden="true" />
      {lite ? "Modo ligero activo" : "Modo ligero"}
    </button>
  );
}

"use client";

import { useState } from "react";
import { canRemoveIngredient } from "@/lib/ingredients";

/* ------------------------------------------------------------------ */
/*  Capas del antojo: una franja de color por ingrediente, con el      */
/*  nombre centrado. Toca una capa quitable para dejarla fuera.        */
/* ------------------------------------------------------------------ */

type Look = { e: string; bg: string; fg: string };

const LOOKS: [RegExp, Look][] = [
  [/pan de papa/, { e: "🍞", bg: "#e7a857", fg: "#5a3410" }],
  [/pan de perro/, { e: "🌭", bg: "#e3a45a", fg: "#5a3410" }],
  [/baguette/, { e: "🥖", bg: "#dca062", fg: "#5a3410" }],
  [/albondiga/, { e: "🧆", bg: "#9a5a36", fg: "#ffffff" }],
  [/alitas/, { e: "🍗", bg: "#c5703c", fg: "#ffffff" }],
  [/fajita/, { e: "🌮", bg: "#d9a066", fg: "#3f230e" }],
  [/pollo/, { e: "🍗", bg: "#d99a5b", fg: "#3f230e" }],
  [/cerdo/, { e: "🥩", bg: "#b86f45", fg: "#ffffff" }],
  [/res/, { e: "🥩", bg: "#7a4a2e", fg: "#ffffff" }],
  [/salchicha/, { e: "🌭", bg: "#c0603a", fg: "#ffffff" }],
  [/lomo/, { e: "🥓", bg: "#a8553a", fg: "#ffffff" }],
  [/vegetal|lechuga/, { e: "🥬", bg: "#7cb85c", fg: "#123b0e" }],
  [/tomate/, { e: "🍅", bg: "#e2574c", fg: "#ffffff" }],
  [/cebolla/, { e: "🧅", bg: "#e9d7f0", fg: "#4a2a55" }],
  [/ketchup/, { e: "🍅", bg: "#d2362c", fg: "#ffffff" }],
  [/mostaza/, { e: "🟡", bg: "#f2c230", fg: "#5a3d06" }],
  [/mayonesa|crema de limon|crema batida|leche/, { e: "🥛", bg: "#fff3d0", fg: "#5a4322" }],
  [/salsa/, { e: "🌶️", bg: "#c2542f", fg: "#ffffff" }],
  [/chips|papas/, { e: "🍟", bg: "#f0c060", fg: "#5a3d06" }],
  [/queso/, { e: "🧀", bg: "#f7d154", fg: "#5a3d06" }],
  [/jamon/, { e: "🥓", bg: "#f2a3a0", fg: "#5a1d1a" }],
  [/huevo/, { e: "🍳", bg: "#fff6dc", fg: "#6b4a00" }],
  [/pina/, { e: "🍍", bg: "#f7d94c", fg: "#5a3d06" }],
  [/croqueta/, { e: "🥖", bg: "#d08a45", fg: "#ffffff" }],
  [/hielo/, { e: "🧊", bg: "#cfeef7", fg: "#1f4d5c" }],
  [/espuma|batido|malteada/, { e: "☁️", bg: "#fff6e2", fg: "#5a4322" }],
  [/cafe|taza/, { e: "☕", bg: "#6b4226", fg: "#ffffff" }],
  [/maracuya|semillas/, { e: "🟠", bg: "#f5a524", fg: "#4a2b00" }],
  [/limon|limonada/, { e: "🍋", bg: "#d9ef7a", fg: "#3a4a05" }],
  [/naranja/, { e: "🍊", bg: "#f5953a", fg: "#4a2200" }],
  [/menta/, { e: "🌿", bg: "#6cc28a", fg: "#0f3a1e" }],
  [/fruta|jugo/, { e: "🍓", bg: "#f06b6b", fg: "#ffffff" }],
  [/cerveza|malta|gaseosa/, { e: "🍺", bg: "#e0a13a", fg: "#3f2a00" }],
  [/vaso|vasito/, { e: "🥤", bg: "#dff1f6", fg: "#1f4d5c" }],
];

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function lookOf(name: string): Look {
  const n = norm(name);
  for (const [re, look] of LOOKS) if (re.test(n)) return look;
  return { e: "✨", bg: "#f6dfb2", fg: "#4a3b28" };
}

interface Layer {
  name: string;
  extra: boolean;
  shape: "top" | "bottom" | "flat";
}

function buildLayers(ingredients: string[], extras: string[]): Layer[] {
  const burger = norm(ingredients[0] ?? "").includes("pan de papa");
  if (burger) {
    // pan arriba (cúpula), relleno, agregos y pan abajo
    const middle = ingredients.slice(1);
    return [
      { name: ingredients[0], extra: false, shape: "top" },
      ...middle.map((name) => ({ name, extra: false, shape: "flat" as const })),
      ...extras.map((name) => ({ name, extra: true, shape: "flat" as const })),
      { name: ingredients[0], extra: false, shape: "bottom" },
    ];
  }
  const extraLayers = extras.map((name) => ({ name, extra: true, shape: "flat" as const }));
  const last = ingredients[ingredients.length - 1] ?? "";
  // perros, baguette y bebidas: la base (pan, vaso, taza) va abajo y redondeada
  if (/pan|baguette|vas|taza/.test(norm(last))) {
    return [
      ...ingredients.slice(0, -1).map((name) => ({ name, extra: false, shape: "flat" as const })),
      ...extraLayers,
      { name: last, extra: false, shape: "bottom" },
    ];
  }
  return [
    ...ingredients.map((name) => ({ name, extra: false, shape: "flat" as const })),
    ...extraLayers,
  ];
}

export function LayerStack({
  ingredients,
  extras = [],
  removed = [],
  onToggle,
  name,
}: {
  ingredients: string[];
  /** Nombres de los agregos elegidos: se ven como capas extra */
  extras?: string[];
  removed?: string[];
  onToggle?: (ingredient: string) => void;
  name: string;
}) {
  const [compact, setCompact] = useState(false);
  const layers = buildLayers(ingredients, extras);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-extrabold text-[#4a3b28]">🧱 Capas de tu antojo</p>
        <button
          type="button"
          onClick={() => setCompact((v) => !v)}
          className="text-xs font-bold text-[#c2542f] hover:underline"
          aria-pressed={compact}
        >
          {compact ? "Separar capas" : "Juntar capas"}
        </button>
      </div>
      <ul
        className={`aol-layers flex flex-col items-center py-1 ${compact ? "is-compact" : "gap-1.5"}`}
        aria-label={`Capas de ${name}`}
      >
        {layers.map((layer, i) => {
          const look = lookOf(layer.name);
          const removable = !layer.extra && layer.shape === "flat" && canRemoveIngredient(layer.name);
          const off = removable && removed.includes(layer.name);
          const width = layer.shape === "flat" ? `${80 + ((i * 7) % 12)}%` : "92%";
          const radius =
            layer.shape === "top"
              ? "44px 44px 14px 14px"
              : layer.shape === "bottom"
                ? "12px 12px 32px 32px"
                : "16px";
          const content = (
            <>
              <span className="flex items-center justify-center gap-2">
                <span className="text-lg leading-none" aria-hidden="true">
                  {look.e}
                </span>
                <span className={off ? "line-through decoration-2" : ""}>{layer.name}</span>
              </span>
              {layer.extra && (
                <span
                  className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-sm font-black text-[#3f9e5f]"
                  title="Agrego"
                  aria-label="agrego"
                >
                  +
                </span>
              )}
              {removable && (
                <span
                  className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-black/15 text-xs font-black"
                  aria-hidden="true"
                >
                  {off ? "↺" : "✕"}
                </span>
              )}
            </>
          );
          const style = {
            width,
            background: look.bg,
            color: look.fg,
            borderRadius: radius,
            animationDelay: `${i * 45}ms`,
          } as React.CSSProperties;
          const cls = `aol-layer relative min-h-12 px-11 py-2.5 text-center text-[15px] font-extrabold ${
            off ? "is-off" : ""
          }`;
          return (
            <li key={`${layer.name}-${i}`} className="flex w-full justify-center" style={{ zIndex: layers.length - i }}>
              {removable && onToggle ? (
                <button
                  type="button"
                  onClick={() => onToggle(layer.name)}
                  aria-pressed={off}
                  aria-label={off ? `Volver a poner ${layer.name}` : `Quitar ${layer.name}`}
                  className={cls}
                  style={style}
                >
                  {content}
                </button>
              ) : (
                <div className={cls} style={style}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {removed.length === 0 && layers.some((l) => !l.extra && canRemoveIngredient(l.name)) && (
        <p className="mt-1.5 text-center text-[11px] font-semibold text-[#a58a5f]">
          Toca la ✕ de una capa para quitarla
        </p>
      )}
    </div>
  );
}

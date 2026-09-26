"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LayerArt, layerKindFor, WoodenBoard } from "./ingredient-layers";

/* ------------------------------------------------------------------ */
/*  Vista explotada: las capas del producto se separan para que el    */
/*  cliente vea todo lo que trae. Toca «Desplegar capas» 🌊            */
/* ------------------------------------------------------------------ */

interface ExplodedViewProps {
  ingredients: string[];
  emoji: string;
  name: string;
}

export function ExplodedView({ ingredients, emoji, name }: ExplodedViewProps) {
  const [open, setOpen] = useState(false);

  const layers = useMemo(() => {
    const kinds = ingredients.map((i) => layerKindFor(i));
    // el pan base va al final (visualmente abajo)
    const items = kinds.map((k, i) => ({ kind: k, name: ingredients[i] ?? "" }));
    return items;
  }, [ingredients]);

  const GAP = open ? 74 : 20;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex w-full flex-col items-center transition-[gap] duration-500"
        style={{ gap: 0 }}
        role="img"
        aria-label={`Capas de ${name}: ${ingredients.join(", ")}`}
      >
        {layers.map((layer, i) => {
          const isBase = i === layers.length - 1;
          return (
            <div
              key={`${layer.kind}-${i}`}
              className="flex flex-col items-center"
              style={{
                transform: open
                  ? `translateY(${i * 6}px)`
                  : "translateY(0)",
                transition: "transform .55s cubic-bezier(.34,1.3,.5,1)",
              }}
            >
              <div
                className="flex items-center gap-2"
                style={{
                  marginTop: open ? GAP * 0.16 : 0,
                  transition: "margin-top .55s cubic-bezier(.34,1.3,.5,1)",
                }}
              >
                <LayerArt kind={layer.kind} className="h-14 w-36 sm:h-16 sm:w-44" />
                {open && (
                  <span className="rounded-full bg-[#fdf3e0] px-2.5 py-1 text-[11px] font-semibold text-[#c2542f] shadow-sm ring-1 ring-[#e8d5b5]">
                    {layer.name}
                  </span>
                )}
              </div>
              {!open && <span style={{ height: 6 }} />}
            </div>
          );
        })}
        <WoodenBoard className="mt-1 w-56 sm:w-64" />
      </div>

      {open && (
        <p className="text-center text-xs text-[#a58a5f]">
          {/vas|taza/i.test(ingredients[ingredients.length - 1] ?? "")
            ? "Base del vaso 🥤 · toca «Plegar capas» para armarlo otra vez"
            : "Base del pan 🍞 · toca «Plegar capas» para armarlo otra vez"}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#fff] px-4 py-2 text-xs font-bold text-[#c2542f] shadow-sm ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0] active:scale-95"
        aria-expanded={open}
      >
        <ChevronDown
          className={`size-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        {open ? "Plegar capas" : "Desplegar capas"}
        <span aria-hidden="true">🌊</span>
      </button>
      <span className="sr-only">{emoji}</span>
    </div>
  );
}

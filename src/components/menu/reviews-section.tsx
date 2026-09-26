"use client";

import { useEffect, useMemo, useState } from "react";
import { PenLine, RefreshCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewsStore } from "@/lib/reviews";
import { ReviewSheet } from "./review-sheet";

/* ------------------------------------------------------------------ */
/*  Sección de reseñas: promedio, mosaico y botón para dejar la tuya.  */
/* ------------------------------------------------------------------ */

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className ?? ""}`} aria-label={`${n} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i <= n ? "fill-[#f2c230] text-[#f2c230]" : "text-[#e8d5b5]"
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

export function ReviewsSection() {
  const reviews = useReviewsStore((s) => s.reviews);
  const hydrate = useReviewsStore((s) => s.hydrate);
  const refresh = useReviewsStore((s) => s.refresh);
  const provider = useReviewsStore((s) => s.config.provider);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visible = useMemo(() => reviews.filter((r) => !r.hidden), [reviews]);
  const avg = useMemo(() => {
    if (!visible.length) return null;
    const sum = visible.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / visible.length) * 10) / 10;
  }, [visible]);
  const shown = showAll ? visible : visible.slice(0, 4);

  return (
    <section className="aol-reviews mt-10" aria-label="Reseñas de clientes">
      <div className="mb-1 flex items-end justify-between gap-3">
        <div>
          <h2 className="aol-h font-display text-xl text-[#c2542f] sm:text-2xl">
            Lo que dice la marea 💬
          </h2>
          <p className="text-sm text-[#8a7350]">
            Reseñas reales de quien ya cruzó la calle
          </p>
        </div>
        {provider === "supabase" && (
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#c2542f] ring-1 ring-[#f0dfc0] transition hover:bg-[#fdf3e0]"
            aria-label="Actualizar reseñas"
          >
            <RefreshCcw className="size-3.5" aria-hidden="true" />
            Actualizar
          </button>
        )}
      </div>

      {avg !== null && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 ring-1 ring-[#f0dfc0]">
          <Stars n={Math.round(avg)} />
          <span className="text-sm font-extrabold text-[#4a3b28]">{avg}</span>
          <span className="text-xs text-[#8a7350]">
            · {visible.length} {visible.length === 1 ? "reseña" : "reseñas"}
          </span>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-6 py-10 text-center">
          <span className="text-4xl" aria-hidden="true">
            🐚
          </span>
          <p className="font-display text-lg text-[#c2542f]">
            La marea aún no ha hablado
          </p>
          <p className="max-w-xs text-sm text-[#8a7350]">
            Sé quien estrena la arena: deja la primera reseña del shack.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-[#f0dfc0] bg-white p-4 shadow-[0_2px_10px_rgba(180,140,80,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-[#4a3b28]">
                    {r.name}
                    {r.place && (
                      <span className="ml-1.5 text-xs font-semibold text-[#a58a5f]">
                        · {r.place}
                      </span>
                    )}
                  </p>
                  <Stars n={r.rating} className="mt-0.5" />
                </div>
                <span className="shrink-0 text-[11px] text-[#a58a5f]">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#6b5a40]">
                “{r.text}”
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        <Button
          type="button"
          onClick={() => {
            void hydrate();
            setSheetOpen(true);
          }}
          className="h-11 rounded-2xl bg-[#e2574c] px-5 font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40] active:scale-[0.98]"
        >
          <PenLine className="size-4" aria-hidden="true" />
          Dejar mi reseña
        </Button>
        {visible.length > 4 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll((v) => !v)}
            className="h-11 rounded-2xl border-[#f0dfc0] bg-white font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
          >
            {showAll
              ? "Ver menos"
              : `Ver todas las reseñas (${visible.length})`}
          </Button>
        )}
      </div>

      <ReviewSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}

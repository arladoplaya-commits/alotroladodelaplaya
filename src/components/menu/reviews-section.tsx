"use client";

import { useEffect, useMemo, useState } from "react";
import { PenLine, RefreshCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewsStore } from "@/lib/reviews";
import { ReviewSheet } from "./review-sheet";
import { CatTitle } from "./section-title";
import { useLang, useTr } from "@/lib/i18n";
import type { Lang } from "@/lib/customer";

/* ------------------------------------------------------------------ */
/*  Sección de reseñas: promedio, mosaico y botón para dejar la tuya.  */
/* ------------------------------------------------------------------ */

function Stars({ n, className }: { n: number; className?: string }) {
  const tr = useTr();
  return (
    <span className={`inline-flex gap-0.5 ${className ?? ""}`} aria-label={tr(`${n} de 5 estrellas`, `${n} of 5 stars`)}>
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

function timeAgo(iso: string, lang: Lang): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  const en = lang === "en";
  if (days <= 0) return en ? "today" : "hoy";
  if (days === 1) return en ? "yesterday" : "ayer";
  if (days < 30) return en ? `${days} days ago` : `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (en) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

export function ReviewsSection() {
  const reviews = useReviewsStore((s) => s.reviews);
  const hydrate = useReviewsStore((s) => s.hydrate);
  const refresh = useReviewsStore((s) => s.refresh);
  const provider = useReviewsStore((s) => s.config.provider);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tr = useTr();
  const lang = useLang();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visible = useMemo(() => reviews.filter((r) => !r.hidden), [reviews]);
  const avg = useMemo(() => {
    if (!visible.length) return null;
    const sum = visible.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / visible.length) * 10) / 10;
  }, [visible]);
  const dist = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((n) => ({
        n,
        pct: visible.length
          ? Math.round((visible.filter((r) => Math.round(r.rating) === n).length / visible.length) * 100)
          : 0,
      })),
    [visible]
  );
  const AVATAR = ["#e2574c", "#3f9e5f", "#e8933a", "#7b55a8", "#2f9db8"];

  return (
    <section className="aol-reviews mt-10" aria-label={tr("Reseñas de clientes", "Customer reviews")}>
      <CatTitle emoji="💬">{tr("Lo que dice la marea", "What the tide says")}</CatTitle>
      <p className="aol-sub -mt-1 mb-3 text-center text-sm font-semibold text-[#8a7350]">
        {tr("Reseñas reales de quien ya cruzó la calle", "Real reviews from people who crossed the street")}
        {provider === "supabase" && (
          <button
            type="button"
            onClick={() => void refresh()}
            className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-bold text-[#c2542f] hover:underline"
            aria-label={tr("Actualizar reseñas", "Refresh reviews")}
          >
            <RefreshCcw className="size-3.5" aria-hidden="true" />
            {tr("Actualizar", "Refresh")}
          </button>
        )}
      </p>

      {avg !== null && (
        <div className="aol-float mb-3 flex items-center gap-4 rounded-3xl border border-[#f0dfc0] bg-white p-4">
          <div className="text-center">
            <p className="aol-h font-display text-5xl leading-none text-[#c2542f]">{avg}</p>
            <Stars n={Math.round(avg)} className="mt-1" />
            <p className="mt-1 text-[11px] font-bold text-[#8a7350]">
              {visible.length} {visible.length === 1 ? tr("reseña", "review") : tr("reseñas", "reviews")}
            </p>
          </div>
          <div className="grid flex-1 gap-1">
            {dist.map((d) => (
              <div key={d.n} className="flex items-center gap-2 text-[11px] font-bold text-[#8a7350]">
                {d.n}
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#fdf3e0]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[#f2c230]"
                    style={{ width: `${d.pct}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-6 py-10 text-center">
          <span className="text-4xl" aria-hidden="true">
            🐚
          </span>
          <p className="font-display text-lg text-[#c2542f]">
            {tr("La marea aún no ha hablado", "The tide hasn\u2019t spoken yet")}
          </p>
          <p className="max-w-xs text-sm text-[#8a7350]">
            {tr("Sé quien estrena la arena: deja la primera reseña del shack.", "Be the first on the sand: leave the shack\u2019s first review.")}
          </p>
        </div>
      ) : (
        <ul className="nice-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {visible.map((r, i) => (
            <li
              key={r.id}
              className="w-64 shrink-0 snap-start rounded-2xl border border-[#f0dfc0] bg-white p-4 shadow-[0_2px_10px_rgba(180,140,80,0.08)]"
            >
              <div className="flex items-center justify-between gap-2">
                <Stars n={r.rating} />
                <span className="shrink-0 text-[11px] text-[#a58a5f]">
                  {timeAgo(r.createdAt, lang)}
                </span>
              </div>
              <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-[#6b5a40]">
                “{r.text}”
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs font-extrabold text-[#4a3b28]">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full text-xs text-white"
                  style={{ background: AVATAR[i % AVATAR.length] }}
                  aria-hidden="true"
                >
                  {r.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="truncate">
                  {r.name}
                  {r.place && (
                    <span className="ml-1 font-semibold text-[#a58a5f]">· {r.place}</span>
                  )}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          onClick={() => {
            void hydrate();
            setSheetOpen(true);
          }}
          className="h-11 rounded-2xl bg-[#e2574c] px-5 font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(226,87,76,0.5)] transition hover:bg-[#d34a40] active:scale-[0.98]"
        >
          <PenLine className="size-4" aria-hidden="true" />
          {tr("Dejar mi reseña", "Write a review")}
        </Button>
      </div>

      <ReviewSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}

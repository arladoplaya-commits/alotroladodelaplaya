"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { money, useMenuStore } from "@/lib/store";
import type { DailyMenu } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Menú del día: selección destacada arriba de la carta               */
/* ------------------------------------------------------------------ */

export function DailyCard() {
  const data = useMenuStore((s) => s.data);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const daily = data.settings.daily;
  const patch = (p: Partial<DailyMenu>) =>
    saveSettings({ ...data.settings, daily: { ...daily, ...p } });

  const toggle = (id: string) =>
    patch({
      productIds: daily.productIds.includes(id)
        ? daily.productIds.filter((x) => x !== id)
        : [...daily.productIds, id],
    });

  return (
    <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-[#c2542f]">🍽️ Menú del día</h2>
          <p className="mt-0.5 text-xs text-[#8a7350]">
            {daily.active
              ? `Visible arriba de la carta · ${daily.productIds.length} producto(s)`
              : "Apagado: actívalo y marca lo que quieres destacar hoy"}
          </p>
        </div>
        <Switch
          checked={daily.active}
          onCheckedChange={(v) => patch({ active: v })}
          aria-label="Mostrar menú del día"
        />
      </div>
      {daily.active && (
        <div className="mt-3 grid gap-2.5">
          <Input
            value={daily.title}
            onChange={(e) => patch({ title: e.target.value.slice(0, 40) })}
            placeholder="Título (ej. Menú del día, Especial del viernes)"
            aria-label="Título del menú del día"
            className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
          />
          <Input
            value={daily.note}
            onChange={(e) => patch({ note: e.target.value.slice(0, 100) })}
            placeholder="Nota (opcional): «Hoy hay alitas recién hechas 🔥»"
            aria-label="Nota del menú del día"
            className="border-[#f0dfc0] focus-visible:ring-[#e2574c]"
          />
          <div className="nice-scroll grid max-h-72 gap-3 overflow-y-auto rounded-2xl bg-[#fdf8ec] p-3">
            {data.categories.map((cat) => {
              const list = data.products.filter((p) => p.category === cat.id);
              if (!list.length) return null;
              return (
                <div key={cat.id}>
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-[#8a7350]">
                    {cat.emoji} {cat.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((p) => {
                      const on = daily.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(p.id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                            on
                              ? "bg-[#e2574c] text-white"
                              : "bg-white text-[#4a3b28] ring-1 ring-[#f0dfc0]"
                          } ${p.available ? "" : "opacity-50"}`}
                        >
                          {on ? "✓ " : ""}
                          {p.name} · {money(data.settings.currency, p.price)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#a58a5f]">
            Lo agotado no se muestra aunque esté marcado. Con GitHub configurado,
            los cambios se suben solos.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { money, uid, useMenuStore } from "@/lib/store";
import { normCode } from "@/lib/promos";
import type { Coupon, Loyalty, Settings } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Promos: tarjeta de fidelidad y cupones. Todo apagado hasta que el  */
/*  negocio lo encienda; se guarda y se publica solo.                  */
/* ------------------------------------------------------------------ */

const card = "rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm";
const inputCls = "h-10 border-[#f0dfc0] focus-visible:ring-[#e2574c]";

export function TabPromos() {
  const settings = useMenuStore((s) => s.data.settings);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const patch = (p: Partial<Settings>) => saveSettings({ ...settings, ...p });
  const setLoyalty = (p: Partial<Loyalty>) => patch({ loyalty: { ...settings.loyalty, ...p } });
  const setCoupon = (id: string, p: Partial<Coupon>) =>
    patch({ coupons: settings.coupons.map((c) => (c.id === id ? { ...c, ...p } : c)) });

  const loyalty = settings.loyalty;
  const dupes = new Set(
    settings.coupons
      .map((c) => normCode(c.code))
      .filter((c, i, all) => c && all.indexOf(c) !== i)
  );

  return (
    <div className="grid gap-4">
      {/* ---------------- Fidelidad ---------------- */}
      <section className={card}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[#c2542f]">⭐ Tarjeta de fidelidad</h2>
            <p className="text-xs text-[#8a7350]">
              Cada pedido enviado por WhatsApp suma un sello. Al completar la
              tarjeta, el pedido te llega marcado con 🎁 y el premio.
            </p>
          </div>
          <Switch
            checked={loyalty.enabled}
            onCheckedChange={(v) => setLoyalty({ enabled: v })}
            aria-label="Activar tarjeta de fidelidad"
          />
        </div>
        <div className={`grid gap-3 sm:grid-cols-[140px_1fr] ${loyalty.enabled ? "" : "opacity-60"}`}>
          <label className="grid gap-1 text-xs font-bold text-[#8a7350]">
            Pedidos para el premio
            <Input
              type="number"
              inputMode="numeric"
              min={2}
              max={20}
              value={loyalty.stamps}
              onChange={(e) =>
                setLoyalty({ stamps: Math.min(20, Math.max(2, Number(e.target.value) || 2)) })
              }
              className={inputCls}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-[#8a7350]">
            Premio
            <Input
              value={loyalty.reward}
              onChange={(e) => setLoyalty({ reward: e.target.value.slice(0, 60) })}
              placeholder="Ej: 1 Ola Fría gratis"
              className={inputCls}
            />
          </label>
        </div>
        <p className="mt-3 rounded-2xl bg-[#fdf8ec] px-3 py-2 text-xs text-[#8a7350]">
          Vista del cliente: «Al pedido {loyalty.stamps}: {loyalty.reward || "…"}». Los
          sellos se guardan en el teléfono del cliente: si borra los datos del
          navegador, empieza de nuevo. Revisa el pedido 🎁 antes de regalar.
        </p>
      </section>

      {/* ---------------- Cupones ---------------- */}
      <section className={card}>
        <h2 className="mb-1 font-display text-xl text-[#c2542f]">🏷️ Cupones de descuento</h2>
        <p className="mb-3 text-xs text-[#8a7350]">
          El cliente escribe el código en el carrito. Enciende solo los que
          estés anunciando (en el cartel, en tus estados…) y apágalos al
          terminar la promo.
        </p>
        {settings.coupons.length === 0 && (
          <p className="mb-2 rounded-2xl bg-[#fdf8ec] px-3 py-2.5 text-sm text-[#8a7350]">
            Aún no hay cupones.
          </p>
        )}
        <ul className="grid gap-3">
          {settings.coupons.map((c) => (
            <li key={c.id} className="grid gap-2 rounded-2xl bg-[#fdf8ec] p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={c.code}
                  onChange={(e) =>
                    setCoupon(c.id, { code: e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 20) })
                  }
                  placeholder="CÓDIGO"
                  aria-label="Código del cupón"
                  className={`${inputCls} min-w-0 flex-1 bg-white font-bold tracking-wide`}
                />
                <Switch
                  checked={c.active}
                  onCheckedChange={(v) => setCoupon(c.id, { active: v })}
                  aria-label={`Activar cupón ${c.code}`}
                />
                <button
                  type="button"
                  onClick={() => patch({ coupons: settings.coupons.filter((x) => x.id !== c.id) })}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#8a7350] ring-1 ring-[#f0dfc0] hover:text-[#e2574c]"
                  aria-label={`Borrar cupón ${c.code}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex rounded-full bg-white p-0.5 ring-1 ring-[#f0dfc0]" role="group" aria-label="Tipo de descuento">
                  {(["percent", "amount"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={c.kind === k}
                      onClick={() => setCoupon(c.id, { kind: k })}
                      className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                        c.kind === k ? "bg-[#e2574c] text-white" : "text-[#8a7350]"
                      }`}
                    >
                      {k === "percent" ? "%" : settings.currency || "MN"}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={c.value}
                  onChange={(e) => {
                    const v = Math.max(0, Number(e.target.value) || 0);
                    setCoupon(c.id, { value: c.kind === "percent" ? Math.min(100, v) : v });
                  }}
                  aria-label="Valor del descuento"
                  className={`${inputCls} w-20 bg-white`}
                />
                <span className="text-xs font-bold text-[#8a7350]">pedido mín.</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={c.minTotal}
                  onChange={(e) => setCoupon(c.id, { minTotal: Math.max(0, Number(e.target.value) || 0) })}
                  aria-label="Pedido mínimo"
                  className={`${inputCls} w-24 bg-white`}
                />
              </div>
              <p className="text-xs text-[#a58a5f]">
                {c.code || "…"}: {c.kind === "percent" ? `${c.value}% de descuento` : `${money(settings.currency, c.value)} menos`}
                {c.minTotal > 0 ? ` en pedidos desde ${money(settings.currency, c.minTotal)}` : " en cualquier pedido"}
                {c.active ? " · ✅ activo" : " · apagado"}
              </p>
              {dupes.has(normCode(c.code)) && (
                <p className="text-xs font-bold text-[#b3562e]">⚠️ Hay otro cupón con este código.</p>
              )}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            patch({
              coupons: [
                ...settings.coupons,
                { id: uid("cp"), code: "", kind: "percent", value: 10, minTotal: 0, active: false },
              ],
            })
          }
          className="mt-2.5 rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir cupón
        </Button>
        <p className="mt-3 rounded-2xl bg-[#eef9fc] px-3 py-2 text-xs font-semibold text-[#2b7a93] ring-1 ring-[#bfe3f2]">
          💡 El descuento sale en el mensaje de WhatsApp con el código, así
          sabes quién lo usó. Los códigos viajan con la carta publicada:
          úsalos para promos, no como secreto.
        </p>
      </section>
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { openStateFor, uid, useMenuStore } from "@/lib/store";
import type { DayHours, DeliveryZone, PaymentMethod, Settings } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Servicio: entrega por zonas, formas de pago y horario semanal.     */
/*  Los cambios se guardan al momento; «Publicar» los lleva a todos.   */
/* ------------------------------------------------------------------ */

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/* La semana empieza el lunes en pantalla */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const card = "rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm";
const inputCls = "h-10 border-[#f0dfc0] focus-visible:ring-[#e2574c]";

function Row({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#fdf8ec] px-4 py-3">
      <div>
        <p className="text-sm font-bold text-[#4a3b28]">{title}</p>
        <p className="text-xs text-[#8a7350]">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}

export function TabServicio() {
  const settings = useMenuStore((s) => s.data.settings);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const patch = (p: Partial<Settings>) => saveSettings({ ...settings, ...p });

  const setZone = (id: string, p: Partial<DeliveryZone>) =>
    patch({ zones: settings.zones.map((z) => (z.id === id ? { ...z, ...p } : z)) });
  const setPay = (id: string, p: Partial<PaymentMethod>) =>
    patch({ payments: settings.payments.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const setDay = (i: number, p: Partial<DayHours>) =>
    patch({
      schedule: {
        ...settings.schedule,
        days: settings.schedule.days.map((d, k) => (k === i ? { ...d, ...p } : d)),
      },
    });

  const state = openStateFor(settings);

  return (
    <div className="grid gap-4">
      <p className="rounded-2xl bg-[#eef9fc] px-4 py-3 text-sm font-semibold text-[#2b7a93] ring-1 ring-[#bfe3f2]">
        💾 Todo se guarda al momento. Pulsa <b>Publicar → Publicar menú ahora</b>{" "}
        para que los clientes vean los cambios.
      </p>

      {/* ---------------- Entrega ---------------- */}
      <section className={card}>
        <h2 className="mb-3 font-display text-xl text-[#c2542f]">🛵 Entrega y mensajería</h2>
        <div className="grid gap-2.5">
          <Row
            title="Entrega a domicilio"
            hint="El cliente elige su zona y se suma la mensajería"
            checked={settings.deliveryEnabled}
            onChange={(v) => patch({ deliveryEnabled: v })}
          />
          <Row
            title="Recogida en el local"
            hint={`Recoge en ${settings.deliveryPoint}`}
            checked={settings.pickupEnabled}
            onChange={(v) => patch({ pickupEnabled: v })}
          />
        </div>

        <p className="mb-2 mt-4 text-sm font-bold text-[#4a3b28]">Zonas y precio de la mensajería (MN)</p>
        <ul className="grid gap-2">
          {settings.zones.map((z) => (
            <li key={z.id} className="flex items-center gap-2">
              <Input
                value={z.name}
                onChange={(e) => setZone(z.id, { name: e.target.value.slice(0, 40) })}
                placeholder="Zona / reparto"
                aria-label="Nombre de la zona"
                className={`${inputCls} min-w-0 flex-1`}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={z.fee}
                onChange={(e) => setZone(z.id, { fee: Math.max(0, Number(e.target.value) || 0) })}
                aria-label={`Precio de mensajería a ${z.name}`}
                className={`${inputCls} w-20 shrink-0`}
              />
              <Switch
                checked={z.active}
                onCheckedChange={(v) => setZone(z.id, { active: v })}
                aria-label={`Activar zona ${z.name}`}
              />
              <button
                type="button"
                onClick={() => patch({ zones: settings.zones.filter((x) => x.id !== z.id) })}
                className="grid size-9 shrink-0 place-items-center rounded-full text-[#8a7350] ring-1 ring-[#f0dfc0] hover:text-[#e2574c]"
                aria-label={`Borrar zona ${z.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            patch({ zones: [...settings.zones, { id: uid("z"), name: "", fee: 0, active: true }] })
          }
          className="mt-2.5 rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir zona
        </Button>
        <p className="mt-2 text-xs text-[#a58a5f]">
          Pon 0 para mensajería gratis. Apaga una zona para dejar de repartir allí.
        </p>
      </section>

      {/* ---------------- Pago ---------------- */}
      <section className={card}>
        <h2 className="mb-1 font-display text-xl text-[#c2542f]">💳 Formas de pago</h2>
        <p className="mb-3 text-xs text-[#8a7350]">
          En «datos» pon lo que el cliente necesita: nº de tarjeta, teléfono
          para confirmar… Se muestra al elegir ese pago y puede copiarlo.
        </p>
        <ul className="grid gap-3">
          {settings.payments.map((p) => (
            <li key={p.id} className="grid gap-2 rounded-2xl bg-[#fdf8ec] p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={p.emoji}
                  onChange={(e) => setPay(p.id, { emoji: e.target.value.slice(0, 4) })}
                  aria-label="Emoji"
                  className={`${inputCls} w-14 text-center text-lg`}
                />
                <Input
                  value={p.name}
                  onChange={(e) => setPay(p.id, { name: e.target.value.slice(0, 30) })}
                  placeholder="Nombre (ej. Transfermóvil)"
                  aria-label="Nombre del pago"
                  className={`${inputCls} min-w-0 flex-1`}
                />
                <Switch
                  checked={p.active}
                  onCheckedChange={(v) => setPay(p.id, { active: v })}
                  aria-label={`Aceptar ${p.name}`}
                />
                <button
                  type="button"
                  onClick={() => patch({ payments: settings.payments.filter((x) => x.id !== p.id) })}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[#8a7350] ring-1 ring-[#f0dfc0] hover:text-[#e2574c]"
                  aria-label={`Borrar ${p.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Input
                value={p.details}
                onChange={(e) => setPay(p.id, { details: e.target.value.slice(0, 120) })}
                placeholder="Datos para el cliente (opcional): tarjeta 9205 …, confirmar al 5…"
                aria-label={`Datos de pago de ${p.name}`}
                className={`${inputCls} bg-white`}
              />
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            patch({
              payments: [
                ...settings.payments,
                { id: uid("pay"), name: "", emoji: "💳", details: "", active: true },
              ],
            })
          }
          className="mt-2.5 rounded-2xl border-[#f0dfc0] font-bold text-[#c2542f]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir forma de pago
        </Button>
      </section>

      {/* ---------------- Horario ---------------- */}
      <section className={card}>
        <h2 className="mb-3 font-display text-xl text-[#c2542f]">🕒 Horario</h2>
        <Row
          title="Abrir y cerrar según el horario"
          hint={
            settings.schedule.auto
              ? `Ahora mismo: ${state.open ? "ABIERTO" : "CERRADO"}${state.label ? ` · ${state.label}` : ""}`
              : "Apagado: solo manda el interruptor de la pestaña Hoy"
          }
          checked={settings.schedule.auto}
          onChange={(v) => patch({ schedule: { ...settings.schedule, auto: v } })}
        />
        <ul className={`mt-3 grid gap-2 ${settings.schedule.auto ? "" : "opacity-60"}`}>
          {DAY_ORDER.map((i) => {
            const d = settings.schedule.days[i];
            return (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#fdf8ec] px-3 py-2">
                <span className="w-24 text-sm font-bold text-[#4a3b28]">{DAYS[i]}</span>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-[#8a7350]">
                  <Switch
                    checked={!d.closed}
                    onCheckedChange={(v) => setDay(i, { closed: !v })}
                    aria-label={`${DAYS[i]} abierto`}
                  />
                  {d.closed ? "Cerrado" : "Abre"}
                </label>
                {!d.closed && (
                  <span className="ml-auto flex items-center gap-1.5 text-sm">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) => setDay(i, { open: e.target.value })}
                      aria-label={`${DAYS[i]} abre a las`}
                      className={`${inputCls} w-[6.5rem]`}
                    />
                    <span className="text-[#8a7350]">a</span>
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) => setDay(i, { close: e.target.value })}
                      aria-label={`${DAYS[i]} cierra a las`}
                      className={`${inputCls} w-[6.5rem]`}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-[#a58a5f]">
          Si cierras después de medianoche (ej. 19:00 a 01:00) también funciona.
          El interruptor «Pedidos ABIERTOS» de la pestaña Hoy siempre tiene la
          última palabra: apágalo para cerrar un día aunque sea horario.
        </p>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Power, Search, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { money, useMenuStore } from "@/lib/store";
import { useCartStore } from "@/lib/cart";
import { useReviewsStore } from "@/lib/reviews";
import { explain, sbAdminAnnounce } from "@/lib/supabase";
import { DailyCard } from "./daily-card";

/* ------------------------------------------------------------------ */
/*  Hoy: pedidos abiertos/cerrados, ocultar agotados y «¿Hay hoy?»     */
/* ------------------------------------------------------------------ */

export function TabHoy() {
  const data = useMenuStore((s) => s.data);
  const saveSettings = useMenuStore((s) => s.saveSettings);
  const saveProduct = useMenuStore((s) => s.saveProduct);
  const saveAgrego = useMenuStore((s) => s.saveAgrego);
  const setAllAvailable = useMenuStore((s) => s.setAllAvailable);
  const setAllAgregosAvailable = useMenuStore((s) => s.setAllAgregosAvailable);
  const clearCart = useCartStore((s) => s.clear);

  const [query, setQuery] = useState("");
  const [cloudPass, setCloudPass] = useState("");
  const [newProductId, setNewProductId] = useState("");

  /** Publica un aviso en Supabase; los teléfonos lo reciben en la campanita */
  const announce = async (
    kind: "open" | "close" | "new-product",
    title: string,
    body: string
  ) => {
    const cfg = useReviewsStore.getState().config;
    if (cfg.provider !== "supabase") {
      toast.error("Conecta Supabase primero", {
        description: "Panel → Reseñas → Conectar nube (URL + clave pública).",
      });
      return;
    }
    if (!cloudPass.trim()) {
      toast.error("Escribe la contraseña de la nube", {
        description: "Es la misma que usas para ver pedidos y reseñas.",
      });
      return;
    }
    const res = await sbAdminAnnounce(
      { url: cfg.url, anonKey: cfg.anonKey },
      cloudPass,
      kind,
      title,
      body
    );
    if (res.ok) {
      toast.success("Aviso enviado a la marea 📣", { description: title });
    } else {
      toast.error("No se pudo enviar el aviso", {
        description: explain(res.status ?? 0, res.body, "avisos"),
      });
    }
  };

  const announceNewProduct = () => {
    const p = data.products.find((x) => x.id === newProductId);
    if (!p) return;
    void announce(
      "new-product",
      `🆕 ${p.name} — nuevo en la carta`,
      `${p.emoji} ${p.name} · ${money(data.settings.currency, p.price)}`
    );
  };

  const catName = useMemo(() => {
    const m = new Map(data.categories.map((c) => [c.id, c]));
    return (id: string) => m.get(id)?.name ?? id;
  }, [data.categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.products.filter((p) =>
      q ? p.name.toLowerCase().includes(q) : true
    );
    const groups = data.categories
      .filter((c) => c.visible)
      .map((c) => ({
        cat: c,
        items: list.filter((p) => p.category === c.id),
      }))
      .filter((g) => g.items.length > 0);
    return groups;
  }, [data, query]);

  const allEnabled = data.products.every((p) => p.available);
  const allAgregosOn = data.agregos.every((a) => a.available);

  return (
    <div className="grid gap-4">
      {/* Interruptores del día */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-display text-xl text-[#c2542f]">Estado del shack</h2>
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-extrabold text-[#4a3b28]">
                <Power className="size-4 text-[#e2574c]" aria-hidden="true" />
                {data.settings.ordersOpen ? "Pedidos ABIERTOS" : "Pedidos CERRADOS"}
              </p>
              <p className="mt-0.5 text-xs text-[#8a7350]">
                {data.settings.ordersOpen
                  ? "Los clientes pueden ordenar por WhatsApp"
                  : "El menú se ve, pero no se puede ordenar"}
              </p>
            </div>
            <Switch
              checked={data.settings.ordersOpen}
              onCheckedChange={(v) => saveSettings({ ...data.settings, ordersOpen: v })}
              aria-label="Abrir o cerrar pedidos"
            />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#f0e6cc] pt-4">
            <div>
              <p className="text-sm font-extrabold text-[#4a3b28]">
                Ocultar productos agotados
              </p>
              <p className="mt-0.5 text-xs text-[#8a7350]">
                {data.settings.hideSoldOut
                  ? "Activado: los clientes no ven lo agotado"
                  : "Desactivado: lo agotado se ve tachado"}
              </p>
            </div>
            <Switch
              checked={data.settings.hideSoldOut}
              onCheckedChange={(v) => saveSettings({ ...data.settings, hideSoldOut: v })}
              aria-label="Ocultar productos agotados"
            />
          </div>
        </div>
      </section>

      {/* Avisos a los clientes (nube) */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-display text-xl text-[#c2542f]">
          📣 Avisos a los clientes
        </h2>
        <p className="mb-3 text-xs leading-snug text-[#8a7350]">
          Publican el aviso en Supabase y los teléfonos de la marea lo reciben
          en la campanita (y como notificación si la activaron). Requiere
          Supabase conectado en «Reseñas → Conectar nube».
        </p>
        <div className="grid gap-2.5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                void announce(
                  "open",
                  "¡Abrimos la marea! 🌊",
                  "El shack está en fuego. La carta está caliente y esperando tu pedido."
                )
              }
              className="rounded-full bg-[#3f9e5f] text-xs font-bold text-white hover:bg-[#358750]"
            >
              🌊 Avisar que abrimos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void announce(
                  "close",
                  "Cerramos por hoy 🌙",
                  "El shack descansa. Vuelve en la próxima noche playera."
                )
              }
              className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
            >
              🌙 Avisar que cerramos
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              aria-label="Producto nuevo a anunciar"
              className="h-9 min-w-0 flex-1 rounded-full border border-[#f0dfc0] bg-white px-3 text-sm text-[#4a3b28] focus:outline-none focus:ring-2 focus:ring-[#e2574c]/50"
            >
              <option value="">🆕 Elegir producto nuevo…</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!newProductId}
              onClick={announceNewProduct}
              className="rounded-full bg-[#e2574c] text-xs font-bold text-white hover:bg-[#d34a40]"
            >
              Anunciar
            </Button>
          </div>
          <Input
            type="password"
            value={cloudPass}
            onChange={(e) => setCloudPass(e.target.value)}
            placeholder="Contraseña de la nube"
            aria-label="Contraseña de la nube"
            className="h-9 border-[#f0dfc0] text-sm focus-visible:ring-[#e2574c]"
          />
        </div>
      </section>

      {/* ¿Hay hoy? */}
      <DailyCard />

      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-[#c2542f]">Productos · ¿Hay hoy?</h2>
          <div className="relative w-44">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#c4b08c]" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="h-9 border-[#f0dfc0] pl-8 text-sm focus-visible:ring-[#e2574c]"
              aria-label="Buscar producto"
            />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAllAvailable(true);
              toast.success("Todo hay en la cocina 👨‍🍳");
            }}
            className="rounded-full bg-[#3f9e5f] text-xs font-bold text-white hover:bg-[#358750]"
          >
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {allEnabled ? "Todos los productos habilitados" : "Habilitar todo el menú"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAllAvailable(false);
              toast.info("Se acabó todo");
            }}
            variant="outline"
            className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
          >
            <XCircle className="size-3.5" aria-hidden="true" />
            Agotar todo el menú
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              clearCart();
              toast.info("Carrito local vaciado");
            }}
            className="ml-auto rounded-full border-[#f0dfc0] text-xs font-bold text-[#8a7350] hover:bg-[#fdf3e0]"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Vaciar carrito de prueba
          </Button>
        </div>

        <div className="grid gap-4">
          {filtered.map(({ cat, items }) => (
            <div key={cat.id}>
              <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#a58a5f]">
                {cat.emoji} {cat.name}
              </p>
              <ul className="grid gap-1.5">
                {items.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl bg-[#fdf8ec] px-3.5 py-2.5"
                  >
                    <span className="text-xl" aria-hidden="true">
                      {p.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#4a3b28]">
                        {p.name}
                      </p>
                      <p className="text-xs text-[#8a7350]">
                        {money(data.settings.currency, p.price)} · {catName(p.category)}
                      </p>
                    </div>
                    <Switch
                      checked={p.available}
                      onCheckedChange={(v) => saveProduct({ ...p, available: v })}
                      aria-label={`¿Hay ${p.name}?`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-2xl bg-[#fdf8ec] px-4 py-6 text-center text-sm text-[#8a7350]">
              Sin resultados.
            </p>
          )}
        </div>
      </section>

      {/* Agregos de hoy */}
      <section className="rounded-3xl border border-[#e8dcc0] bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-[#c2542f]">Agregos hoy</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setAllAgregosAvailable(true);
                toast.success("Todos los agregos disponibles hoy");
              }}
              className="rounded-full bg-[#3f9e5f] text-xs font-bold text-white hover:bg-[#358750]"
            >
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Todo hay
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setAllAgregosAvailable(false);
                toast.info("Ningún agrego hoy");
              }}
              className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
            >
              <XCircle className="size-3.5" aria-hidden="true" />
              Se acabó todo
            </Button>
          </div>
        </div>
        <p className="mb-2.5 text-xs text-[#8a7350]">
          Los agregos que apagues desaparecen del personalizador hoy.
        </p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {data.agregos.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-2xl bg-[#fdf8ec] px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#4a3b28]">{a.name}</p>
                <p className="text-xs text-[#8a7350]">
                  + {money(data.settings.currency, a.price)}
                </p>
              </div>
              <Switch
                checked={a.available}
                onCheckedChange={(v) => saveAgrego({ ...a, available: v })}
                aria-label={`¿Hay ${a.name}?`}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ChevronRight, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { money, useMenuStore } from "@/lib/store";
import { useOrdersStore } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Pedidos: nuevo → confirmado → entregado / cancelado                */
/* ------------------------------------------------------------------ */

const FLOW: Record<OrderStatus, { next?: OrderStatus; label?: string }> = {
  nuevo: { next: "confirmado", label: "Confirmar" },
  confirmado: { next: "entregado", label: "Marcar entregado" },
  entregado: {},
  cancelado: {},
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  nuevo: "bg-[#e2574c]/10 text-[#c2542f]",
  confirmado: "bg-[#f2c230]/20 text-[#8a6410]",
  entregado: "bg-[#3f9e5f]/15 text-[#2c7044]",
  cancelado: "bg-[#8a7350]/15 text-[#6b5a40]",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  nuevo: "NUEVO",
  confirmado: "CONFIRMADO",
  entregado: "ENTREGADO",
  cancelado: "CANCELADO",
};

function OrderCard({
  order,
  currency,
  onStatus,
  onDelete,
}: {
  order: Order;
  currency: string;
  onStatus: (next: OrderStatus) => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const flow = FLOW[order.status];
  return (
    <li className="rounded-3xl border border-[#e8dcc0] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-lg text-[#c2542f]">{order.code}</span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_STYLE[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
        <span className="ml-auto text-xs text-[#a58a5f]">
          {new Date(order.createdAt).toLocaleString("es-CU", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-bold text-[#4a3b28]">
        {order.name}
        {order.address && (
          <span className="font-normal text-[#8a7350]"> · {order.address}</span>
        )}
      </p>
      <ul className="mt-2 grid gap-1 rounded-2xl bg-[#fdf8ec] p-3 text-sm text-[#6b5a40]">
        {order.items.map((it, i) => (
          <li key={i}>
            ▸ {it.qty}× {it.name} — {money(currency, it.unitPrice * it.qty)}
            {it.agregoNames.length > 0 && (
              <span className="text-xs text-[#a58a5f]"> + {it.agregoNames.join(", ")}</span>
            )}
            {it.notes && <span className="text-xs italic"> · 📝 {it.notes}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="font-display text-lg text-[#4a3b28]">
          {money(currency, order.total)}
        </span>
        <div className="flex items-center gap-1.5">
          {flow.next && (
            <Button
              type="button"
              size="sm"
              onClick={() => onStatus(flow.next as OrderStatus)}
              className="rounded-full bg-[#3f9e5f] text-xs font-bold text-white hover:bg-[#358750]"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              {flow.label}
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Button>
          )}
          {order.status !== "cancelado" && order.status !== "entregado" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onStatus("cancelado")}
              className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#b3562e] hover:bg-[#fdeae7]"
            >
              CANCELAR
            </Button>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="grid size-8 place-items-center rounded-full text-[#a58a5f] transition hover:bg-[#fdeae7] hover:text-[#b3562e]"
            aria-label={`Borrar el pedido ${order.code}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-3xl border-[#f0dfc0] bg-[#fffcf4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-[#c2542f]">
              ¿Borrar el pedido {order.code}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se elimina de la nube para siempre. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#f0dfc0]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete();
                setConfirming(false);
              }}
              className="bg-[#e2574c] text-white hover:bg-[#d34a40]"
            >
              Sí, borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

export function TabPedidos() {
  const adminPassword = useMenuStore((s) => s.data.settings.adminPassword);
  const currency = useMenuStore((s) => s.data.settings.currency);
  const orders = useOrdersStore((s) => s.adminList);
  const status = useOrdersStore((s) => s.status);
  const loadAdmin = useOrdersStore((s) => s.loadAdmin);
  const setStatus = useOrdersStore((s) => s.setStatus);
  const deleteOrder = useOrdersStore((s) => s.delete);

  const [filter, setFilter] = useState<"activos" | "todos">("activos");

  useEffect(() => {
    void loadAdmin(adminPassword);
  }, [loadAdmin, adminPassword]);

  const shown =
    filter === "activos"
      ? orders.filter((o) => o.status === "nuevo" || o.status === "confirmado")
      : orders;

  return (
    <div className="grid gap-3">
      {status === "local" && (
        <div className="flex items-start gap-3 rounded-3xl border-2 border-dashed border-[#e8c9a0] bg-[#fdf8ec] p-4">
          <WifiOff className="mt-0.5 size-5 shrink-0 text-[#b3562e]" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-bold text-[#4a3b28]">
              Los pedidos aún no se guardan en la nube
            </p>
            <p className="mt-0.5 text-[#8a7350]">
              Conecta tu Supabase gratis en la pestaña Reseñas → Conectar
              Supabase. Mientras tanto los pedidos solo viven en el dispositivo
              del cliente.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["activos", "todos"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide transition ${
                filter === f
                  ? "bg-[#c2542f] text-white"
                  : "bg-white text-[#8a7350] ring-1 ring-[#f0dfc0] hover:bg-[#fdf3e0]"
              }`}
            >
              {f === "activos" ? "Activos" : "Todos"}
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void loadAdmin(adminPassword)}
          className="rounded-full border-[#f0dfc0] text-xs font-bold text-[#c2542f] hover:bg-[#fdf3e0]"
        >
          Pedidos actualizados
        </Button>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-[#e8d5b5] bg-white/60 px-4 py-10 text-center text-sm text-[#8a7350]">
          No hay pedidos por aquí todavía. Cuando un cliente confirme por
          WhatsApp, aparecerá con su código PB-••••.
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              currency={currency}
              onStatus={(next) => {
                void setStatus(o.id, next, adminPassword)
                  .then(() => toast.success(`Pedido ${o.code} → ${STATUS_LABEL[next]}`))
                  .catch(() => toast.error("No se pudo actualizar en la nube"));
              }}
              onDelete={() => {
                void deleteOrder(o.id, adminPassword)
                  .then(() => toast.success(`Pedido ${o.code} borrado`))
                  .catch(() => toast.error("No se pudo borrar en la nube"));
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

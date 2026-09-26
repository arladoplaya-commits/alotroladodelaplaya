"use client";

import { create } from "zustand";
import { uid } from "@/lib/store";
import { useReviewsStore } from "@/lib/reviews";
import { sbAdminDeleteOrder, sbAdminOrderSetStatus, sbAdminOrders, sbInsertOrder } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Pedidos del negocio                                                */
/*                                                                     */
/*  · Al confirmar el carrito, además de abrir WhatsApp, el pedido     */
/*    queda guardado en Supabase con su código corto.                  */
/*  · Sin internet: bandeja de salida con reenvío automático.          */
/*  · El panel (admin) consulta la nube con la contraseña del negocio  */
/*    y marca estados: nuevo → confirmado → entregado / cancelado.     */
/* ------------------------------------------------------------------ */

const OUTBOX_KEY = "aol-orders-outbox-v1";

/* ------------------------------ helpers ------------------------------ */

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

function orderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 4; i++)
    tail += chars[Math.floor(Math.random() * chars.length)];
  return `PB-${tail}`;
}

export function buildOrder(input: {
  name: string;
  address: string;
  items: Order["items"];
  subtotal: number;
  total: number;
}): Order {
  return {
    id: uid("ord"),
    code: orderCode(),
    name: input.name.trim().slice(0, 60),
    address: input.address.trim().slice(0, 160),
    items: input.items,
    subtotal: input.subtotal,
    total: input.total,
    status: "nuevo",
    createdAt: new Date().toISOString(),
  };
}

function credsOf() {
  const config = useReviewsStore.getState().config;
  if (config.provider !== "supabase") return null;
  if (!config.url || config.anonKey.trim().length < 20) return null;
  return { url: config.url, anonKey: config.anonKey };
}

export async function saveOrder(
  order: Order
): Promise<"local" | "cloud" | "queued"> {
  const creds = credsOf();
  if (!creds) return "local";
  const res = await sbInsertOrder(creds, order);
  if (res.ok) {
    void flushOrdersOutbox();
    return "cloud";
  }
  const box = readJson<Order[]>(OUTBOX_KEY) ?? [];
  if (!box.some((o) => o.id === order.id)) box.push(order);
  writeJson(OUTBOX_KEY, box);
  return "queued";
}

/** Reenvía los pedidos que quedaron en cola (la llama refresh/loadAdmin) */
export async function flushOrdersOutbox(): Promise<void> {
  const creds = credsOf();
  if (!creds) return;
  const box = readJson<Order[]>(OUTBOX_KEY) ?? [];
  if (!box.length) return;
  const remaining: Order[] = [];
  for (const order of box) {
    const res = await sbInsertOrder(creds, order);
    if (!res.ok) remaining.push(order);
  }
  writeJson(OUTBOX_KEY, remaining);
}

function sortByNew(list: Order[]): Order[] {
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/* ------------------------------- store ------------------------------- */

interface OrdersState {
  adminList: Order[];
  status: "local" | "cloud" | "loading" | "";
  loadAdmin: (pass: string) => Promise<void>;
  setStatus: (id: string, next: OrderStatus, pass: string) => Promise<void>;
  delete: (id: string, pass: string) => Promise<void>;
}

export const useOrdersStore = create<OrdersState>()((set, get) => ({
  adminList: [],
  status: "",

  loadAdmin: async (pass) => {
    const creds = credsOf();
    if (!creds) {
      set({ status: "local" });
      return;
    }
    set({ status: "loading" });
    void flushOrdersOutbox();
    const res = await sbAdminOrders(creds, pass);
    if (!res.ok) {
      set({ status: "cloud" });
      return;
    }
    set({ adminList: sortByNew(res.data ?? []), status: "cloud" });
  },

  setStatus: async (id, next, pass) => {
    const creds = credsOf();
    if (!creds) return;
    const prev = get().adminList;
    set({
      adminList: prev.map((o) => (o.id === id ? { ...o, status: next } : o)),
    });
    const res = await sbAdminOrderSetStatus(creds, pass, id, next);
    if (!res.ok) {
      set({ adminList: prev });
      throw new Error("No se pudo actualizar en la nube");
    }
  },

  delete: async (id, pass) => {
    const creds = credsOf();
    if (!creds) {
      set({ adminList: get().adminList.filter((o) => o.id !== id) });
      return;
    }
    const res = await sbAdminDeleteOrder(creds, pass, id);
    if (!res.ok) throw new Error("No se pudo borrar en la nube");
    set({ adminList: get().adminList.filter((o) => o.id !== id) });
  },
}));

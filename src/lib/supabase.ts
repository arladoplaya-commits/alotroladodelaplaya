"use client";

import type {
  Order,
  Review,
  SupaCreds,
  OrderStatus,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Supabase por REST puro (PostgREST), sin SDK                        */
/*  Tablas: orders, reviews · RPC: change_panel_pass                   */
/* ------------------------------------------------------------------ */

export const SQL_SETUP = `-- 1) Reseñas (escrituras anónimas, lectura pública)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 24),
  place text check (char_length(place) <= 24),
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 5 and 200),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "lectura publica" on public.reviews for select using (true);
create policy "insert anonimo" on public.reviews for insert to anon with check (true);

-- 2) Pedidos del negocio (insert anónimo, lectura vía RPC con contraseña)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  address text,
  items jsonb not null default '[]',
  subtotal int not null default 0,
  total int not null default 0,
  status text not null default 'nuevo',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "insert pedido" on public.orders for insert to anon with check (true);

-- 3) Contraseña del panel guardada con hash bcrypt
create table if not exists public.panel_pass (
  id int primary key default 1,
  hash text not null
);
insert into public.panel_pass (id, hash)
values (1, crypt('playa2026', gen_salt('bf')))
on conflict (id) do nothing;

-- 4) RPCs del panel (verifican contraseña con bcrypt)
create or replace function public.admin_reviews(p_pass text)
returns setof public.reviews
language sql stable
as $$
  select r.* from public.reviews r
  where exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  )
  order by r.created_at desc;
$$;

create or replace function public.admin_orders(p_pass text)
returns setof public.orders
language sql stable
as $$
  select o.* from public.orders o
  where exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  )
  order by o.created_at desc;
$$;

create or replace function public.admin_order_set_status(p_pass text, p_id uuid, p_status text)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  update public.orders set status = p_status where id = p_id;
end;
$$;

create or replace function public.admin_delete_order(p_pass text, p_id uuid)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  delete from public.orders where id = p_id;
end;
$$;

create or replace function public.admin_set_review_hidden(p_pass text, p_id uuid, p_hidden boolean)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  update public.reviews set hidden = p_hidden where id = p_id;
end;
$$;

create or replace function public.admin_delete_review(p_pass text, p_id uuid)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  delete from public.reviews where id = p_id;
end;
$$;

create or replace function public.change_panel_pass(p_old text, p_new text)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_old, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  update public.panel_pass
  set hash = crypt(p_new, gen_salt('bf'))
  where id = 1;
end;
$$;

-- 4b) Comprobar la contraseña al entrar al panel (misma en todos los teléfonos)
create or replace function public.check_panel_pass(p_pass text)
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  );
$$;

-- 5) Clientes de la marea (registro desde la carta, sin contraseñas)
create table if not exists public.customers (
  id text primary key,
  member_no int not null,
  name text not null,
  whatsapp text default '',
  tastes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;
create policy "insert cliente" on public.customers for insert to anon with check (true);

-- 6) Suscripciones push (Web Push con VAPID: el shack avisa, la nube reparte)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "insert suscripcion" on public.push_subscriptions for insert to anon with check (true);
create policy "borrar su suscripcion" on public.push_subscriptions for delete to anon using (true);

-- 7) Avisos del shack (apertura, cierre, producto nuevo): los teléfonos los consultan
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('open','close','new-product','system')),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create policy "lectura publica" on public.announcements for select using (true);

create or replace function public.admin_announce(p_pass text, p_kind text, p_title text, p_body text)
returns void
language plpgsql security definer
as $$
begin
  if not exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  ) then
    raise exception 'contraseña incorrecta';
  end if;
  insert into public.announcements (kind, title, body)
  values (p_kind, left(p_title, 120), left(p_body, 300));
end;
$$;

create or replace function public.admin_customers(p_pass text)
returns setof public.customers
language sql stable
as $$
  select c.* from public.customers c
  where exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  )
  order by c.created_at desc;
$$;`;

/* ------------------------------ helpers ------------------------------ */

export function normalizeSupaUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export function isValidSupaUrl(raw: string): boolean {
  return /^https?:\/\/\S+$/.test(normalizeSupaUrl(raw));
}

/**
 * Cabeceras de autenticación. Las claves nuevas de Supabase
 * («sb_publishable_…») van solo en `apikey`; las antiguas («eyJ…», que
 * son JWT) también pueden ir en `Authorization`.
 */
export function sbAuth(key: string): Record<string, string> {
  const k = key.trim();
  return k.startsWith("eyJ") ? { apikey: k, Authorization: `Bearer ${k}` } : { apikey: k };
}

export function isValidAnonKey(raw: string): boolean {
  return raw.trim().length >= 20;
}

interface RpcBody {
  [k: string]: unknown;
}

async function rpc<T>(
  creds: SupaCreds,
  fn: string,
  body: RpcBody
): Promise<{ ok: boolean; data?: T; status?: number; body?: unknown }> {
  try {
    const res = await fetch(`${normalizeSupaUrl(creds.url)}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        ...sbAuth(creds.anonKey),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, body: json };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Traduce errores de PostgREST a mensajes accionables en español */
export function explain(status: number, body: unknown, ctx: string): string {
  const b = body as { code?: string; message?: string } | null;
  const code = b?.code ?? "";
  const msg = b?.message ?? "";
  if (status === 401 || status === 403)
    return "La anon key no es válida. Copia la clave «anon public» completa (Ajustes del proyecto → API).";
  if (status === 404 && (code === "42P01" || code === "PGRST205"))
    return `La tabla de ${ctx} no existe todavía. Ejecuta el SQL del paso 2 en el SQL Editor.`;
  if (status === 404)
    return "No se encontró el proyecto (404). Revisa la URL del proyecto.";
  if (status === 409) return "duplicado";
  if (
    code === "P0001" ||
    msg.toLowerCase().includes("contraseña") ||
    msg.toLowerCase().includes("pass")
  )
    return msg || "La contraseña de la nube no coincide.";
  if (status === 400 && code === "23514")
    return "Los datos no pasan la validación de la base (demasiado largos o incompletos).";
  if (status >= 500)
    return `Supabase respondió ${status}. Prueba de nuevo en unos segundos.`;
  return msg ? `${msg}` : `Error ${status} en ${ctx}.`;
}

/* --------------------------- Test de conexión --------------------------- */

export async function sbTestConnection(
  creds: SupaCreds
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/reviews?select=id&limit=1`,
      {
        headers: sbAuth(creds.anonKey),
        cache: "no-store",
      }
    );
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: explain(res.status, body, "reseñas") };
  } catch {
    return {
      ok: false,
      error: "No se pudo conectar. Revisa la URL del proyecto y tu internet.",
    };
  }
}

/* ------------------------------- Reseñas ------------------------------- */

export async function sbFetchReviews(
  creds: SupaCreds
): Promise<{ ok: boolean; data?: Review[]; status?: number; body?: unknown }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/reviews?select=*&order=created_at.desc&limit=100`,
      {
        headers: sbAuth(creds.anonKey),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, body: json };
    return { ok: true, data: (json ?? []) as Review[] };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function sbInsertReview(
  creds: SupaCreds,
  review: Pick<Review, "name" | "place" | "rating" | "text">
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/reviews`,
      {
        method: "POST",
        headers: {
          ...sbAuth(creds.anonKey),
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(review),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, status: res.status, body };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function sbAdminReviews(
  creds: SupaCreds,
  pass: string
): Promise<{ ok: boolean; data?: Review[]; status?: number; body?: unknown }> {
  return rpc<Review[]>(creds, "admin_reviews", { p_pass: pass });
}

export async function sbAdminSetReviewHidden(
  creds: SupaCreds,
  pass: string,
  id: string,
  hidden: boolean
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "admin_set_review_hidden", {
    p_pass: pass,
    p_id: id,
    p_hidden: hidden,
  });
}

export async function sbAdminDeleteReview(
  creds: SupaCreds,
  pass: string,
  id: string
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "admin_delete_review", { p_pass: pass, p_id: id });
}

/* ------------------------------- Pedidos ------------------------------- */

export async function sbInsertOrder(
  creds: SupaCreds,
  order: Order
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  try {
    const res = await fetch(`${normalizeSupaUrl(creds.url)}/rest/v1/orders`, {
      method: "POST",
      headers: {
        ...sbAuth(creds.anonKey),
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        code: order.code,
        name: order.name,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        status: order.status,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, status: res.status, body };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function sbAdminOrders(
  creds: SupaCreds,
  pass: string
): Promise<{ ok: boolean; data?: Order[]; status?: number; body?: unknown }> {
  return rpc<Order[]>(creds, "admin_orders", { p_pass: pass });
}

export async function sbAdminOrderSetStatus(
  creds: SupaCreds,
  pass: string,
  id: string,
  status: OrderStatus
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "admin_order_set_status", {
    p_pass: pass,
    p_id: id,
    p_status: status,
  });
}

export async function sbAdminDeleteOrder(
  creds: SupaCreds,
  pass: string,
  id: string
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "admin_delete_order", { p_pass: pass, p_id: id });
}

/**
 * Comprueba la contraseña del panel en la nube.
 * "ok" / "wrong" si la nube respondió; "offline" sin conexión;
 * "nosetup" si aún no se ejecutó el SQL (la función no existe).
 */
export async function sbCheckPanelPass(
  creds: SupaCreds,
  pass: string
): Promise<"ok" | "wrong" | "offline" | "nosetup"> {
  const res = await rpc<boolean>(creds, "check_panel_pass", { p_pass: pass });
  if (!res.ok) return res.status === 0 ? "offline" : "nosetup";
  return res.data === true ? "ok" : "wrong";
}

export async function sbAdminSetPass(
  creds: SupaCreds,
  oldPass: string,
  newPass: string
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "change_panel_pass", { p_old: oldPass, p_new: newPass });
}

/* -------------------- Clientes · Avisos · Push (nube) -------------------- */

export interface CloudAnnouncement {
  id: string;
  kind: "open" | "close" | "new-product" | "system";
  title: string;
  body: string;
  created_at: string;
}

export interface CloudCustomer {
  id: string;
  member_no: number;
  name: string;
  whatsapp: string | null;
  tastes: Record<string, number>;
  created_at: string;
}

/** Registro del cliente (idempotente: upsert por id) */
export async function sbUpsertCustomer(
  creds: SupaCreds,
  customer: CloudCustomer
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/customers?on_conflict=id`,
      {
        method: "POST",
        headers: {
          ...sbAuth(creds.anonKey),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(customer),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, status: res.status, body };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** Suscripción push de este teléfono */
export async function sbInsertPushSubscription(
  creds: SupaCreds,
  sub: { customerId: string | null; endpoint: string; p256dh: string; auth: string }
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/push_subscriptions`,
      {
        method: "POST",
        headers: {
          ...sbAuth(creds.anonKey),
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          customer_id: sub.customerId,
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, status: res.status, body };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function sbDeletePushSubscription(
  creds: SupaCreds,
  endpoint: string
): Promise<void> {
  try {
    await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/push_subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
      {
        method: "DELETE",
        headers: {
          ...sbAuth(creds.anonKey),
        },
        cache: "no-store",
      }
    );
  } catch {
    /* best effort */
  }
}

/** Últimos avisos publicados por el shack (los teléfonos los consultan) */
export async function sbFetchAnnouncements(
  creds: SupaCreds
): Promise<{ ok: boolean; data?: CloudAnnouncement[]; status?: number; body?: unknown }> {
  try {
    const res = await fetch(
      `${normalizeSupaUrl(creds.url)}/rest/v1/announcements?select=*&order=created_at.desc&limit=30`,
      {
        headers: sbAuth(creds.anonKey),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, body: json };
    return { ok: true, data: (json ?? []) as CloudAnnouncement[] };
  } catch {
    return { ok: false, status: 0 };
  }
}

/** El shack anuncia apertura / cierre / producto nuevo (desde el panel) */
export async function sbAdminAnnounce(
  creds: SupaCreds,
  pass: string,
  kind: CloudAnnouncement["kind"],
  title: string,
  body: string
): Promise<{ ok: boolean; status?: number; body?: unknown }> {
  return rpc(creds, "admin_announce", {
    p_pass: pass,
    p_kind: kind,
    p_title: title,
    p_body: body,
  });
}

/** Lista de clientes registrados (panel) */
export async function sbAdminCustomers(
  creds: SupaCreds,
  pass: string
): Promise<{ ok: boolean; data?: CloudCustomer[]; status?: number; body?: unknown }> {
  return rpc<CloudCustomer[]>(creds, "admin_customers", { p_pass: pass });
}

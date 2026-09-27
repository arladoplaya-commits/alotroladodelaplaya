-- ===================================================================
--  Al Otro Lado de la Playa · Base de datos en Supabase (versión 2)
--  Pégalo entero en Supabase → SQL Editor → Run.
--  Se puede ejecutar las veces que quieras: crea lo que falte y
--  corrige una base creada con la versión anterior SIN borrar datos.
-- ===================================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) Reseñas (lectura pública de las no ocultas, alta anónima)
create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 2 and 24),
  place text check (char_length(place) <= 24),
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 5 and 200),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
-- La carta manda su propio id («rev-…») y la fecha como «createdAt»:
-- el id pasa a texto y se añade esa columna para que la reseña se guarde
-- (antes la nube la rechazaba y se quedaba solo en el teléfono).
alter table public.reviews alter column id drop default;
alter table public.reviews alter column id type text using id::text;
alter table public.reviews alter column id set default gen_random_uuid()::text;
alter table public.reviews add column if not exists "createdAt" timestamptz;
update public.reviews set "createdAt" = created_at where "createdAt" is null;
alter table public.reviews alter column "createdAt" set default now();

create or replace function public.reviews_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.id := coalesce(nullif(trim(new.id), ''), gen_random_uuid()::text);
  new.hidden := false;          -- solo el panel decide qué se oculta
  new.created_at := now();      -- la hora la pone el servidor
  new."createdAt" := new.created_at;
  return new;
end;
$$;
drop trigger if exists reviews_before_insert on public.reviews;
create trigger reviews_before_insert before insert on public.reviews
  for each row execute function public.reviews_before_insert();

alter table public.reviews enable row level security;
drop policy if exists "lectura publica" on public.reviews;
drop policy if exists "insert anonimo" on public.reviews;
create policy "lectura publica" on public.reviews for select using (hidden = false);
create policy "insert anonimo" on public.reviews for insert to anon with check (true);

-- 2) Pedidos (alta anónima; solo el panel los lee)
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
-- El panel espera la fecha como «createdAt»
alter table public.orders add column if not exists "createdAt" timestamptz
  generated always as (created_at) stored;

create or replace function public.orders_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.status := 'nuevo';        -- un cliente no puede marcarlo como entregado
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

alter table public.orders enable row level security;
drop policy if exists "insert pedido" on public.orders;
create policy "insert pedido" on public.orders for insert to anon with check (true);

-- 3) Contraseña del panel (hash bcrypt). Nadie la lee ni la cambia
--    desde fuera: solo a través de las funciones de abajo.
create table if not exists public.panel_pass (
  id int primary key default 1,
  hash text not null
);
alter table public.panel_pass enable row level security;
revoke all on public.panel_pass from anon, authenticated;
insert into public.panel_pass (id, hash)
values (1, extensions.crypt('playa2026', extensions.gen_salt('bf')))
on conflict (id) do nothing;

create or replace function public.panel_pass_ok(p_pass text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(p_pass, p.hash)
  );
$$;
revoke execute on function public.panel_pass_ok(text) from public, anon, authenticated;

-- 4) Funciones del panel (todas comprueban la contraseña)
create or replace function public.check_panel_pass(p_pass text)
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select public.panel_pass_ok(p_pass);
$$;

create or replace function public.change_panel_pass(p_old text, p_new text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_old) then
    raise exception 'contraseña incorrecta';
  end if;
  if char_length(coalesce(p_new, '')) < 4 then
    raise exception 'la contraseña nueva es demasiado corta';
  end if;
  update public.panel_pass set hash = crypt(p_new, gen_salt('bf', 8)) where id = 1;
end;
$$;

create or replace function public.admin_reviews(p_pass text)
returns setof public.reviews
language sql stable security definer
set search_path = public, extensions
as $$
  select r.* from public.reviews r
  where public.panel_pass_ok(p_pass)
  order by r.created_at desc;
$$;

drop function if exists public.admin_set_review_hidden(text, uuid, boolean);
create or replace function public.admin_set_review_hidden(p_pass text, p_id text, p_hidden boolean)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_pass) then
    raise exception 'contraseña incorrecta';
  end if;
  update public.reviews set hidden = p_hidden where id = p_id;
end;
$$;

drop function if exists public.admin_delete_review(text, uuid);
create or replace function public.admin_delete_review(p_pass text, p_id text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_pass) then
    raise exception 'contraseña incorrecta';
  end if;
  delete from public.reviews where id = p_id;
end;
$$;

create or replace function public.admin_orders(p_pass text)
returns setof public.orders
language sql stable security definer
set search_path = public, extensions
as $$
  select o.* from public.orders o
  where public.panel_pass_ok(p_pass)
  order by o.created_at desc;
$$;

create or replace function public.admin_order_set_status(p_pass text, p_id uuid, p_status text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_pass) then
    raise exception 'contraseña incorrecta';
  end if;
  update public.orders set status = p_status where id = p_id;
end;
$$;

create or replace function public.admin_delete_order(p_pass text, p_id uuid)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_pass) then
    raise exception 'contraseña incorrecta';
  end if;
  delete from public.orders where id = p_id;
end;
$$;

-- 5) Clientes de la marea (registro desde la carta)
create table if not exists public.customers (
  id text primary key,
  member_no int not null,
  name text not null,
  whatsapp text default '',
  tastes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;
-- La carta guarda al cliente con un «upsert» (crear o actualizar).
-- PostgreSQL exige permiso de lectura para eso; se concede SOLO durante
-- el guardado (POST), así la lista de clientes no se puede descargar.
drop policy if exists "insert cliente" on public.customers;
drop policy if exists "actualizar cliente" on public.customers;
drop policy if exists "leer solo al guardar" on public.customers;
create policy "insert cliente" on public.customers for insert to anon with check (true);
create policy "actualizar cliente" on public.customers for update to anon
  using (coalesce(current_setting('request.method', true), '') = 'POST') with check (true);
create policy "leer solo al guardar" on public.customers for select to anon
  using (coalesce(current_setting('request.method', true), '') = 'POST');

create or replace function public.admin_customers(p_pass text)
returns setof public.customers
language sql stable security definer
set search_path = public, extensions
as $$
  select c.* from public.customers c
  where public.panel_pass_ok(p_pass)
  order by c.created_at desc;
$$;

-- 6) Suscripciones push (Web Push con VAPID)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
-- Si el mismo teléfono se suscribe otra vez, se reemplaza la anterior
-- (antes daba error de duplicado).
create or replace function public.push_before_insert()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  delete from public.push_subscriptions where endpoint = new.endpoint;
  return new;
end;
$$;
drop trigger if exists push_before_insert on public.push_subscriptions;
create trigger push_before_insert before insert on public.push_subscriptions
  for each row execute function public.push_before_insert();

alter table public.push_subscriptions enable row level security;
drop policy if exists "insert suscripcion" on public.push_subscriptions;
drop policy if exists "borrar su suscripcion" on public.push_subscriptions;
drop policy if exists "actualizar suscripcion" on public.push_subscriptions;
drop policy if exists "leer solo al guardar" on public.push_subscriptions;
create policy "insert suscripcion" on public.push_subscriptions for insert to anon with check (true);
create policy "actualizar suscripcion" on public.push_subscriptions for update to anon
  using (coalesce(current_setting('request.method', true), '') = 'POST') with check (true);
create policy "leer solo al guardar" on public.push_subscriptions for select to anon
  using (coalesce(current_setting('request.method', true), '') = 'POST');

-- 7) Avisos del shack (apertura, cierre, producto nuevo)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('open','close','new-product','system')),
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "lectura publica" on public.announcements;
create policy "lectura publica" on public.announcements for select using (true);

create or replace function public.admin_announce(p_pass text, p_kind text, p_title text, p_body text)
returns void
language plpgsql security definer
set search_path = public, extensions
as $$
begin
  if not public.panel_pass_ok(p_pass) then
    raise exception 'contraseña incorrecta';
  end if;
  insert into public.announcements (kind, title, body)
  values (p_kind, left(p_title, 120), left(coalesce(p_body, ''), 300));
end;
$$;

-- Que la API vea los cambios al momento
notify pgrst, 'reload schema';

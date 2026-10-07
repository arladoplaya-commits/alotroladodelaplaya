-- ===================================================================
--  Al Otro Lado de la Playa · Refuerzo de seguridad (ejecutar UNA vez)
--  Supabase → SQL Editor → pega todo → Run. Se puede repetir sin problema.
--  Ejecuta ANTES supabase/setup.sql si aún no lo has hecho.
-- ===================================================================

-- 0) CAMBIA LA CLAVE DEL PANEL (la de fábrica es pública en setup.sql).
--    Quita los dos guiones de la línea de abajo y pon tu clave nueva:
-- select public.change_panel_pass('playa2026', 'PON_AQUI_TU_CLAVE_NUEVA');

-- 1) Frena que adivinen la clave del panel: si es incorrecta, tarda 1 s.
create or replace function public.panel_pass_ok(p_pass text)
returns boolean
language plpgsql security definer
set search_path = public, extensions
as $$
declare ok boolean;
begin
  select exists (
    select 1 from public.panel_pass p
    where p.id = 1 and p.hash = crypt(coalesce(p_pass, ''), p.hash)
  ) into ok;
  if not ok then perform pg_sleep(1); end if;
  return ok;
end;
$$;
revoke execute on function public.panel_pass_ok(text) from public, anon, authenticated;

-- 2) Límite de tamaño en pedidos
alter table public.orders drop constraint if exists orders_size_chk;
alter table public.orders add constraint orders_size_chk check (
  char_length(name) <= 60 and char_length(coalesce(address, '')) <= 300
  and char_length(code) <= 40 and jsonb_array_length(items) <= 60
  and subtotal >= 0 and total >= 0
) not valid;

-- 3) Anti-spam: máximo de pedidos y reseñas por ventana de tiempo
create index if not exists orders_created_idx on public.orders (created_at);
create index if not exists reviews_created_idx on public.reviews (created_at);

create or replace function public.orders_rate_limit()
returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.orders where created_at > now() - interval '10 minutes') >= 80 then
    raise exception 'demasiados pedidos, intenta en unos minutos';
  end if;
  return new;
end;
$$;
drop trigger if exists orders_rate_limit on public.orders;
create trigger orders_rate_limit before insert on public.orders
  for each row execute function public.orders_rate_limit();

create or replace function public.reviews_rate_limit()
returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.reviews where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'demasiadas reseñas, intenta en unos minutos';
  end if;
  return new;
end;
$$;
drop trigger if exists reviews_rate_limit on public.reviews;
create trigger reviews_rate_limit before insert on public.reviews
  for each row execute function public.reviews_rate_limit();

notify pgrst, 'reload schema';

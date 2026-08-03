-- Códigos de descuento para el checkout.
-- SIN EJECUTAR TODAVÍA — correr manualmente en el SQL Editor de Supabase.
--
-- Aditiva y segura: crea una tabla nueva y agrega dos columnas nullable/con
-- default a orders. No modifica RLS existente, ni políticas, ni funciones, ni
-- ninguna migración ya aplicada.

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  code text not null,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric(10,2) not null check (value > 0),
  active boolean not null default true,
  expires_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  times_used integer not null default 0 check (times_used >= 0)
);

-- Un porcentaje no puede pasar de 100. Los importes fijos no tienen tope aquí:
-- el servidor los acota al subtotal en cada pedido.
alter table public.discount_codes
  drop constraint if exists discount_codes_percentage_range;
alter table public.discount_codes
  add constraint discount_codes_percentage_range
  check (type <> 'percentage' or value <= 100);

-- El código es único sin distinguir mayúsculas: el servidor normaliza a
-- mayúsculas antes de buscar, así que THEIA10 y theia10 son el mismo código.
create unique index if not exists discount_codes_code_unique
  on public.discount_codes (upper(code));

create index if not exists discount_codes_active_idx
  on public.discount_codes (active)
  where active;

-- Mismo criterio que orders/customers/payment_events: sin acceso directo para
-- los roles públicos; solo el backend con service_role puede leer y escribir.
alter table public.discount_codes enable row level security;
revoke all privileges on table public.discount_codes from public, anon, authenticated;
grant all privileges on table public.discount_codes to service_role;

-- Trazabilidad del código aplicado en cada pedido.
alter table public.orders
  add column if not exists discount_code text,
  add column if not exists discount_amount numeric(10,2) not null default 0;

create index if not exists orders_discount_code_idx
  on public.orders (discount_code)
  where discount_code is not null;

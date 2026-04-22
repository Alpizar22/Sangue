-- ============================================================
-- SANGUE — Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ==================== PRODUCTS ====================
create table products (
  id                  uuid primary key default uuid_generate_v4(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  shein_product_id    text unique not null,
  shein_url           text not null,
  title               text not null,
  description         text,
  images              text[] not null default '{}',
  original_price      numeric(10,2) not null default 0,
  sale_price          numeric(10,2) not null default 0,
  cost_price          numeric(10,2) not null default 0,
  stock               integer not null default 0,
  category            text not null default '',
  tags                text[] not null default '{}',
  sizes               text[] not null default '{}',
  colors              text[] not null default '{}',
  status              text not null default 'active' check (status in ('active','inactive','out_of_stock')),
  shein_sku           text,
  markup_percentage   numeric(6,2) not null default 80
);

create index products_status_idx on products(status);
create index products_category_idx on products(category);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on products
  for each row execute function update_updated_at();

-- ==================== CUSTOMERS ====================
create table customers (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  email       text unique not null,
  name        text not null,
  phone       text,
  address     jsonb
);

-- ==================== ORDERS ====================
create table orders (
  id                          uuid primary key default uuid_generate_v4(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  customer_id                 uuid references customers(id),
  items                       jsonb not null default '[]',
  status                      text not null default 'pending'
                              check (status in ('pending','paid','processing','ordered_to_supplier','shipped','delivered','cancelled')),
  subtotal                    numeric(10,2) not null default 0,
  shipping_cost               numeric(10,2) not null default 0,
  total                       numeric(10,2) not null default 0,
  mercadopago_payment_id      text,
  mercadopago_preference_id   text,
  shipping_address            jsonb not null,
  notes                       text,
  supplier_order_id           text,
  tracking_number             text
);

create index orders_status_idx on orders(status);
create index orders_customer_idx on orders(customer_id);
create index orders_created_idx on orders(created_at desc);

create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- ==================== SCRAPING JOBS ====================
create table scraping_jobs (
  id                uuid primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  status            text not null default 'pending'
                    check (status in ('pending','running','completed','failed')),
  source_url        text not null,
  products_found    integer not null default 0,
  products_imported integer not null default 0,
  error             text,
  completed_at      timestamptz
);

-- ==================== PRICING RULES ====================
create table pricing_rules (
  id            uuid primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  name          text not null,
  category      text,
  markup_type   text not null default 'percentage' check (markup_type in ('percentage','fixed')),
  markup_value  numeric(10,2) not null,
  min_price     numeric(10,2),
  max_price     numeric(10,2),
  active        boolean not null default true
);

-- ==================== ROW LEVEL SECURITY ====================
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table scraping_jobs enable row level security;
alter table pricing_rules enable row level security;

-- Productos: lectura pública para activos
create policy "productos_public_read" on products
  for select using (status = 'active');

-- Clientes: solo autenticados (admin)
create policy "customers_admin_only" on customers
  for all using (auth.role() = 'authenticated');

-- Pedidos: solo admin
create policy "orders_admin_only" on orders
  for all using (auth.role() = 'authenticated');

-- Scraping: solo admin
create policy "scraping_admin_only" on scraping_jobs
  for all using (auth.role() = 'authenticated');

-- Precios: solo admin
create policy "pricing_admin_only" on pricing_rules
  for all using (auth.role() = 'authenticated');

-- ==================== STORAGE ====================
-- Crear bucket para imágenes de productos (opcional, por ahora usamos URLs de Shein)
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);

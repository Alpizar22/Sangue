-- Capa de curaduría editorial sobre productos Printful.
-- Nullable a propósito: si no hay valor, la capa de presentación
-- (src/lib/presentation.ts) cae a un fallback derivado de los datos
-- reales de Printful. El sync (/api/printful/import) nunca escribe
-- estas columnas, así que un re-import jamás pisa lo curado a mano.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rlbgwrxcmvftlmgbmhlh/sql

alter table products
  add column if not exists display_name text,
  add column if not exists subtitle text,
  add column if not exists chapter text,
  add column if not exists story text,
  add column if not exists editorial_images text[];

create table if not exists newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  email text unique not null
);

alter table newsletter_subscribers enable row level security;

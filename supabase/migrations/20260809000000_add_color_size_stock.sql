alter table public.products
  add column if not exists color_size_stock jsonb;

comment on column public.products.color_size_stock is
  'Disponibilidad por variante, indexada como color|talla.';

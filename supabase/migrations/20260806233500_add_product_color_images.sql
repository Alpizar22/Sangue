alter table products
  add column if not exists color_images jsonb not null default '{}'::jsonb;

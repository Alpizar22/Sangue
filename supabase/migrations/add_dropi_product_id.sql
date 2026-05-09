-- Add dropi_product_id column to products table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rlbgwrxcmvftlmgbmhlh/sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS dropi_product_id integer,
  ADD COLUMN IF NOT EXISTS source text;

CREATE INDEX IF NOT EXISTS products_dropi_id_idx ON products(dropi_product_id);
CREATE INDEX IF NOT EXISTS products_source_idx ON products(source);

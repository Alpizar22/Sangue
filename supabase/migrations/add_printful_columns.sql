-- Add Printful columns to products table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/rlbgwrxcmvftlmgbmhlh/sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS printful_product_id integer,
  ADD COLUMN IF NOT EXISTS printful_variant_id integer,
  ADD COLUMN IF NOT EXISTS printful_variant_map jsonb;

CREATE INDEX IF NOT EXISTS products_printful_id_idx ON products(printful_product_id);

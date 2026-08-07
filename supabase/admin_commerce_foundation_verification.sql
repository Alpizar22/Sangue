-- Solo lectura. Ejecutar después de 20260806220000_admin_commerce_foundation.sql.

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name in ('featured', 'sort_order', 'cost_price', 'original_price', 'sale_price')
order by column_name;

select constraint_name, check_clause
from information_schema.check_constraints
where constraint_name in ('products_sort_order_check', 'products_status_check')
order by constraint_name;

select status, count(*)
from public.products
group by status
order by status;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'products'
  and indexname = 'products_featured_active_idx';

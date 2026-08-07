-- Base comercial administrable para el backoffice de Theia.
-- Migración aditiva: no elimina ni renombra columnas existentes.

begin;

alter table public.products
  add column if not exists featured boolean not null default false,
  add column if not exists sort_order integer;

alter table public.products drop constraint if exists products_sort_order_check;
alter table public.products
  add constraint products_sort_order_check
  check (sort_order is null or sort_order >= 0) not valid;
alter table public.products validate constraint products_sort_order_check;

create index if not exists products_featured_active_idx
  on public.products (featured desc, sort_order asc, created_at desc)
  where status = 'active';

-- PostgreSQL no permite ampliar un CHECK existente sin reemplazar únicamente
-- ese constraint. No se modifica ni se reescribe ningún dato.
alter table public.products drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check
  check (status in ('draft', 'active', 'inactive', 'out_of_stock')) not valid;
alter table public.products validate constraint products_status_check;

commit;

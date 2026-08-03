-- Solo lectura. Ejecutar manualmente antes de secure_checkout_and_fulfillment.sql.

-- Payment IDs duplicados: debe devolver cero filas.
select mercadopago_payment_id, count(*) as cantidad
from public.orders
where mercadopago_payment_id is not null
group by mercadopago_payment_id
having count(*) > 1
order by cantidad desc;

-- orders.id se usa como external_reference y es PK: debe devolver cero filas.
select id::pg_catalog.text as external_reference, count(*) as cantidad
from public.orders
group by id
having count(*) > 1;

-- Preferencias duplicadas como señal operativa adicional.
select mercadopago_preference_id, count(*) as cantidad
from public.orders
where mercadopago_preference_id is not null
group by mercadopago_preference_id
having count(*) > 1
order by cantidad desc;

select status, count(*) as pedidos_sin_payment_id
from public.orders
where mercadopago_payment_id is null
group by status
order by status;

select status, count(*) as pedidos_con_supplier_order_id
from public.orders
where supplier_order_id is not null
group by status
order by status;

select status, count(*) as cantidad
from public.orders
group by status
order by status;

-- Antes de la primera aplicación todos los pedidos existentes necesitarán
-- backfill si se desea habilitar seguimiento público histórico.
select count(*) as pedidos_historicos_que_necesitan_token
from public.orders;

select pg_catalog.to_regclass('public.payment_events') as payment_events_table;

select column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'payment_events'
order by ordinal_position;

select constraint_name, constraint_type
from information_schema.table_constraints
where table_schema = 'public' and table_name = 'payment_events'
order by constraint_type, constraint_name;

-- Ejecutar esta consulta únicamente si payment_events_table no es NULL.
select provider, event_id, count(*) as cantidad
from public.payment_events
where event_id is not null
group by provider, event_id
having count(*) > 1
order by cantidad desc;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'customers', 'payment_events')
order by tablename, policyname;

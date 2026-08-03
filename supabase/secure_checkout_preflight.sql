-- ============================================================================
-- PREFLIGHT — supabase/migrations/secure_checkout_and_fulfillment.sql
--
-- SOLO LECTURA: no crea, altera ni elimina ningún objeto ni dato.
--
-- Seguro de ejecutar aunque public.payment_events todavía no exista. La tabla
-- se detecta con to_regclass y únicamente se consulta mediante SQL dinámico
-- (query_to_xml) cuando está presente, de modo que este script jamás
-- referencia de forma estática una relación inexistente. Los metadatos se leen
-- desde information_schema y pg_catalog, que devuelven cero filas —no error—
-- cuando la tabla falta.
--
-- Devuelve UN ÚNICO conjunto de resultados: el SQL Editor de Supabase muestra
-- solo el del último statement, así que todo el informe viaja en una sola
-- consulta con una fila por hallazgo.
--
--   estado = OK        -> verificado, sin hallazgos
--   estado = REVISAR   -> bloquea o pone en riesgo la migración
--   estado = INFO      -> contexto operativo, no bloquea
--   estado = PENDIENTE -> lo creará la migración
-- ============================================================================

with
-- ─── Detección de public.payment_events ─────────────────────────────────────
pe_target as (
  select pg_catalog.to_regclass('public.payment_events') as reg
),
pe_present as (
  select reg from pe_target where reg is not null
),
pe_columns as (
  select ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'payment_events'
),
pe_constraints as (
  select constraint_name, constraint_type
  from information_schema.table_constraints
  where table_schema = 'public'
    and table_name = 'payment_events'
),
pe_indexes as (
  select indexname, indexdef
  from pg_catalog.pg_indexes
  where schemaname = 'public'
    and tablename = 'payment_events'
),

-- ─── Consultas dinámicas: solo se evalúan si hay filas de guarda ────────────
-- Cada CTE hace "from <guarda>". Si la guarda no devuelve filas, la lista de
-- selección —y con ella query_to_xml— no llega a evaluarse nunca.

-- Duplicados provider+event_id. Requiere que la tabla exista Y que exponga
-- ambas columnas: una payment_events heredada (id/payment_id/order_id/status)
-- no las tiene y la consulta fallaría.
pe_dup_ready as (
  select 1 as listo
  from pe_present
  where (
    select count(*) from pe_columns where column_name in ('provider', 'event_id')
  ) = 2
),
pe_dup_doc as (
  select pg_catalog.query_to_xml(
    -- Refleja exactamente el chequeo del bloque $unique_preflight$ de la
    -- migración: sin filtro sobre event_id, porque los NULL agrupan juntos y
    -- también romperían payment_events_provider_event_unique.
    $dyn$
      select provider::pg_catalog.text as provider,
             event_id::pg_catalog.text as event_id,
             count(*) as cantidad
      from public.payment_events
      group by provider, event_id
      having count(*) > 1
    $dyn$,
    false,  -- nulls
    false,  -- tableforest = false -> documento con raíz <table>
    ''      -- targetns
  ) as doc
  from pe_dup_ready
),
pe_dup as (
  select
    (pg_catalog.xpath('/row/provider/text()', fila))[1]::pg_catalog.text as provider,
    (pg_catalog.xpath('/row/event_id/text()', fila))[1]::pg_catalog.text as event_id,
    (pg_catalog.xpath('/row/cantidad/text()', fila))[1]::pg_catalog.text as cantidad
  from pe_dup_doc,
       pg_catalog.unnest(pg_catalog.xpath('/table/row', doc)) as fila
),

-- event_id NULL: la migración ejecuta "alter column event_id set not null",
-- así que cualquier NULL la aborta antes de llegar al índice único.
pe_null_ready as (
  select 1 as listo
  from pe_present
  where exists (select 1 from pe_columns where column_name = 'event_id')
),
pe_null_doc as (
  select pg_catalog.query_to_xml(
    $dyn$
      select count(*) as cantidad
      from public.payment_events
      where event_id is null
    $dyn$,
    false, false, ''
  ) as doc
  from pe_null_ready
),
pe_null as (
  select ((pg_catalog.xpath('/table/row/cantidad/text()', doc))[1]::pg_catalog.text)::pg_catalog.int8 as cantidad
  from pe_null_doc
),

-- ─── Integridad previa de public.orders ─────────────────────────────────────
orders_dup_payment as (
  select mercadopago_payment_id as valor, count(*) as cantidad
  from public.orders
  where mercadopago_payment_id is not null
  group by mercadopago_payment_id
  having count(*) > 1
),
orders_dup_id as (
  select id::pg_catalog.text as valor, count(*) as cantidad
  from public.orders
  group by id
  having count(*) > 1
),
orders_dup_preference as (
  select mercadopago_preference_id as valor, count(*) as cantidad
  from public.orders
  where mercadopago_preference_id is not null
  group by mercadopago_preference_id
  having count(*) > 1
),
rls_policies as (
  select tablename, policyname, cmd, roles::pg_catalog.text as roles
  from pg_catalog.pg_policies
  where schemaname = 'public'
    and tablename in ('orders', 'customers', 'payment_events')
)

-- ════════════════════════════ INFORME ═══════════════════════════════════════

-- A. orders — duplicados que abortarían los índices únicos de la migración
select 10 as n, 'A. orders'::pg_catalog.text as seccion,
       'mercadopago_payment_id duplicado'::pg_catalog.text as verificacion,
       'REVISAR'::pg_catalog.text as estado,
       pg_catalog.format('%s aparece %s veces', valor, cantidad)::pg_catalog.text as detalle
from orders_dup_payment
union all
select 10, 'A. orders', 'mercadopago_payment_id duplicado', 'OK',
       'Sin duplicados: orders_mercadopago_payment_id_unique podrá crearse'
where not exists (select 1 from orders_dup_payment)

union all
select 20, 'A. orders', 'id duplicado (PK)', 'REVISAR',
       pg_catalog.format('%s aparece %s veces', valor, cantidad)
from orders_dup_id
union all
select 20, 'A. orders', 'id duplicado (PK)', 'OK', 'Sin duplicados'
where not exists (select 1 from orders_dup_id)

union all
select 30, 'A. orders', 'mercadopago_preference_id duplicado', 'INFO',
       pg_catalog.format('%s aparece %s veces (señal operativa, no bloquea)', valor, cantidad)
from orders_dup_preference
union all
select 30, 'A. orders', 'mercadopago_preference_id duplicado', 'OK', 'Sin duplicados'
where not exists (select 1 from orders_dup_preference)

-- A. orders — contexto por estado
union all
select 40, 'A. orders', 'pedidos sin payment_id', 'INFO',
       pg_catalog.format('%s: %s pedidos', status, count(*))
from public.orders
where mercadopago_payment_id is null
group by status

union all
select 50, 'A. orders', 'pedidos con supplier_order_id', 'INFO',
       pg_catalog.format('%s: %s pedidos', status, count(*))
from public.orders
where supplier_order_id is not null
group by status

union all
select 60, 'A. orders', 'pedidos por estado', 'INFO',
       pg_catalog.format('%s: %s pedidos', status, count(*))
from public.orders
group by status

union all
select 70, 'A. orders', 'backfill de public_access_token', 'INFO',
       pg_catalog.format(
         '%s pedidos históricos quedarán sin token; la migración no hace backfill',
         count(*)
       )
from public.orders

-- B. payment_events — presencia
union all
select 100, 'B. payment_events', 'payment_events_exists', 'OK', 'true'
where exists (select 1 from pe_present)
union all
select 100, 'B. payment_events', 'payment_events_exists', 'PENDIENTE',
       'false — la tabla no existe todavía; secure_checkout_and_fulfillment.sql la creará'
where not exists (select 1 from pe_present)

-- B. payment_events — estructura actual (solo si existe)
union all
select 110, 'B. payment_events', 'columna', 'INFO',
       pg_catalog.format(
         '%s | tipo=%s (%s) | nullable=%s | default=%s',
         column_name, data_type, udt_name, is_nullable,
         coalesce(column_default, '(ninguno)')
       )
from pe_columns
union all
select 110, 'B. payment_events', 'columna', 'PENDIENTE',
       'Sin columnas que inspeccionar: la migración creará la tabla completa'
where not exists (select 1 from pe_present)

union all
select 120, 'B. payment_events', 'constraint', 'INFO',
       pg_catalog.format('%s | %s', constraint_name, constraint_type)
from pe_constraints
union all
select 120, 'B. payment_events', 'constraint', 'PENDIENTE',
       'Sin constraints: la migración creará la PK sobre id'
where not exists (select 1 from pe_present)

union all
select 130, 'B. payment_events', 'índice', 'INFO',
       pg_catalog.format('%s | %s', indexname, indexdef)
from pe_indexes
union all
select 130, 'B. payment_events', 'índice', 'PENDIENTE',
       'Sin índices: la migración creará payment_events_provider_event_unique'
where not exists (select 1 from pe_present)

-- B. payment_events — datos que abortarían la migración (solo si existe)
union all
select 140, 'B. payment_events', 'event_id NULL', 'REVISAR',
       pg_catalog.format(
         '%s filas con event_id NULL; "alter column event_id set not null" fallará',
         cantidad
       )
from pe_null
where cantidad > 0
union all
select 140, 'B. payment_events', 'event_id NULL', 'OK', 'Sin valores NULL en event_id'
from pe_null
where cantidad = 0
union all
select 140, 'B. payment_events', 'event_id NULL', 'PENDIENTE',
       'No aplica: la tabla o la columna event_id todavía no existen'
where not exists (select 1 from pe_null_ready)

union all
select 150, 'B. payment_events', 'duplicados provider+event_id', 'REVISAR',
       pg_catalog.format(
         'provider=%s event_id=%s aparece %s veces',
         coalesce(provider, '(null)'),
         coalesce(event_id, '(null)'),
         cantidad
       )
from pe_dup
union all
select 150, 'B. payment_events', 'duplicados provider+event_id', 'OK',
       'Sin duplicados: payment_events_provider_event_unique podrá crearse'
from pe_dup_ready
where not exists (select 1 from pe_dup)
union all
select 150, 'B. payment_events', 'duplicados provider+event_id', 'PENDIENTE',
       'No evaluado: la tabla no existe o no expone provider y event_id'
where not exists (select 1 from pe_dup_ready)

-- C. Políticas RLS que la migración va a reemplazar
union all
select 200, 'C. RLS', 'política existente', 'INFO',
       pg_catalog.format('%s | %s | cmd=%s | roles=%s', tablename, policyname, cmd, roles)
from rls_policies
union all
select 200, 'C. RLS', 'política existente', 'OK',
       'Sin políticas en orders/customers/payment_events'
where not exists (select 1 from rls_policies)

order by n, estado, detalle;

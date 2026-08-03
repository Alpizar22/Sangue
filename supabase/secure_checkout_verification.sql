-- Solo lectura. Ejecutar manualmente después de la migración.

-- No debe haber políticas públicas sobre estas tablas.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('orders', 'customers', 'payment_events')
order by tablename, policyname;

-- anon/authenticated deben ser false; service_role debe ser true.
select
  pg_catalog.has_table_privilege('anon', 'public.orders', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.orders', 'INSERT')
    or pg_catalog.has_table_privilege('anon', 'public.orders', 'UPDATE')
    or pg_catalog.has_table_privilege('anon', 'public.orders', 'DELETE') as anon_orders_any_access,
  pg_catalog.has_table_privilege('authenticated', 'public.orders', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.orders', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.orders', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.orders', 'DELETE') as authenticated_orders_any_access,
  pg_catalog.has_table_privilege('service_role', 'public.orders', 'SELECT')
    and pg_catalog.has_table_privilege('service_role', 'public.orders', 'INSERT')
    and pg_catalog.has_table_privilege('service_role', 'public.orders', 'UPDATE')
    and pg_catalog.has_table_privilege('service_role', 'public.orders', 'DELETE') as service_orders_required_access,
  pg_catalog.has_table_privilege('anon', 'public.customers', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.customers', 'INSERT')
    or pg_catalog.has_table_privilege('anon', 'public.customers', 'UPDATE')
    or pg_catalog.has_table_privilege('anon', 'public.customers', 'DELETE') as anon_customers_any_access,
  pg_catalog.has_table_privilege('authenticated', 'public.customers', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.customers', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.customers', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.customers', 'DELETE') as authenticated_customers_any_access,
  pg_catalog.has_table_privilege('service_role', 'public.customers', 'SELECT')
    and pg_catalog.has_table_privilege('service_role', 'public.customers', 'INSERT')
    and pg_catalog.has_table_privilege('service_role', 'public.customers', 'UPDATE')
    and pg_catalog.has_table_privilege('service_role', 'public.customers', 'DELETE') as service_customers_required_access;

select
  pg_catalog.has_function_privilege(
    'anon',
    'public.claim_mercadopago_fulfillment(uuid,text,text,numeric,text)',
    'EXECUTE'
  ) as anon_claim,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.claim_mercadopago_fulfillment(uuid,text,text,numeric,text)',
    'EXECUTE'
  ) as authenticated_claim,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.claim_mercadopago_fulfillment(uuid,text,text,numeric,text)',
    'EXECUTE'
  ) as service_claim,
  pg_catalog.has_function_privilege(
    'anon',
    'public.finalize_printful_fulfillment(uuid,text,text,text)',
    'EXECUTE'
  ) as anon_finalize,
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.finalize_printful_fulfillment(uuid,text,text,text)',
    'EXECUTE'
  ) as authenticated_finalize,
  pg_catalog.has_function_privilege(
    'service_role',
    'public.finalize_printful_fulfillment(uuid,text,text,text)',
    'EXECUTE'
  ) as service_finalize;

select
  namespace.nspname as schema_name,
  procedure.proname,
  owner.rolname as owner,
  procedure.prosecdef as security_definer,
  procedure.proconfig as function_config
from pg_catalog.pg_proc as procedure
join pg_catalog.pg_namespace as namespace on namespace.oid = procedure.pronamespace
join pg_catalog.pg_roles as owner on owner.oid = procedure.proowner
where namespace.nspname = 'public'
  and procedure.proname in ('claim_mercadopago_fulfillment', 'finalize_printful_fulfillment')
order by procedure.proname;

select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('claim_mercadopago_fulfillment', 'finalize_printful_fulfillment')
order by routine_name, grantee;

select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and indexname in (
    'orders_public_access_token_unique',
    'orders_mercadopago_payment_id_unique',
    'payment_events_provider_event_unique'
  )
order by indexname;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'payment_events'
order by ordinal_position;

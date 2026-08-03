-- Seguridad de checkout, acceso público e idempotencia de MercadoPago/Printful.
-- IMPORTANTE: revisar supabase/secure_checkout_preflight.sql antes de aplicarla.
-- Esta migración no hace backfill de tokens para pedidos históricos.

alter table public.orders
  add column if not exists public_access_token pg_catalog.text,
  add column if not exists fulfillment_claimed_at pg_catalog.timestamptz;

-- El acceso directo a clientes y pedidos queda cerrado para los roles públicos.
-- service_role conserva acceso para las rutas server-side y evita depender de
-- políticas que interpreten authenticated como administrador.
do $policy_cleanup$
declare
  v_policy record;
begin
  for v_policy in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'customers')
  loop
    execute pg_catalog.format(
      'drop policy if exists %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  end loop;
end;
$policy_cleanup$;

alter table public.orders enable row level security;
alter table public.customers enable row level security;
revoke all privileges on table public.orders from public, anon, authenticated;
revoke all privileges on table public.customers from public, anon, authenticated;
grant all privileges on table public.orders to service_role;
grant all privileges on table public.customers to service_role;

-- payment_events puede existir en producción. Se crea si falta y, si existe,
-- solo se completa cuando sus columnas actuales son compatibles. Las formas
-- ambiguas abortan con una excepción explícita en lugar de reinterpretar datos.
do $payment_events_shape$
declare
  v_nonempty boolean;
  v_actual_type pg_catalog.text;
  v_expected record;
begin
  if pg_catalog.to_regclass('public.payment_events') is null then
    create table public.payment_events (
      id pg_catalog.uuid primary key default pg_catalog.gen_random_uuid(),
      created_at pg_catalog.timestamptz not null default pg_catalog.now(),
      provider pg_catalog.text not null default 'mercadopago',
      event_id pg_catalog.text not null,
      payment_id pg_catalog.text,
      order_id pg_catalog.uuid,
      status pg_catalog.text not null default 'received',
      detail pg_catalog.jsonb not null default '{}'::pg_catalog.jsonb,
      supplier_order_id pg_catalog.text
    );
    return;
  end if;

  select exists(select 1 from public.payment_events) into v_nonempty;

  for v_expected in
    select * from (values
      ('id', 'uuid'),
      ('created_at', 'timestamp with time zone'),
      ('provider', 'text'),
      ('event_id', 'text'),
      ('payment_id', 'text'),
      ('order_id', 'uuid'),
      ('status', 'text'),
      ('detail', 'jsonb'),
      ('supplier_order_id', 'text'),
      ('payload', 'jsonb'),
      ('metadata', 'jsonb')
    ) as expected(column_name, data_type)
  loop
    select pg_catalog.format_type(attribute.atttypid, attribute.atttypmod)
      into v_actual_type
    from pg_catalog.pg_attribute as attribute
    where attribute.attrelid = 'public.payment_events'::pg_catalog.regclass
      and attribute.attname = v_expected.column_name
      and attribute.attnum > 0
      and not attribute.attisdropped;

    if found and v_actual_type <> v_expected.data_type then
      raise exception 'payment_events incompatible: columna % tiene tipo %, se esperaba %',
        v_expected.column_name, v_actual_type, v_expected.data_type;
    end if;
  end loop;

  if not exists (
    select 1 from pg_catalog.pg_attribute
    where attrelid = 'public.payment_events'::pg_catalog.regclass
      and attname = 'id' and attnum > 0 and not attisdropped
  ) then
    if v_nonempty then
      raise exception 'payment_events incompatible: falta id y la tabla contiene filas';
    end if;
    alter table public.payment_events
      add column id pg_catalog.uuid default pg_catalog.gen_random_uuid();
  end if;

  if not exists (
    select 1 from pg_catalog.pg_attribute
    where attrelid = 'public.payment_events'::pg_catalog.regclass
      and attname = 'created_at' and attnum > 0 and not attisdropped
  ) then
    if v_nonempty then
      raise exception 'payment_events incompatible: falta created_at y la tabla contiene filas';
    end if;
    alter table public.payment_events
      add column created_at pg_catalog.timestamptz default pg_catalog.now();
  end if;

  if not exists (
    select 1 from pg_catalog.pg_attribute
    where attrelid = 'public.payment_events'::pg_catalog.regclass
      and attname = 'event_id' and attnum > 0 and not attisdropped
  ) and v_nonempty then
    raise exception 'payment_events incompatible: falta event_id y la tabla contiene filas';
  end if;
end;
$payment_events_shape$;

alter table public.payment_events
  add column if not exists provider pg_catalog.text default 'mercadopago',
  add column if not exists event_id pg_catalog.text,
  add column if not exists payment_id pg_catalog.text,
  add column if not exists order_id pg_catalog.uuid,
  add column if not exists status pg_catalog.text default 'received',
  add column if not exists detail pg_catalog.jsonb default '{}'::pg_catalog.jsonb,
  add column if not exists supplier_order_id pg_catalog.text;

do $payment_events_data$
declare
  v_primary_columns pg_catalog.text[];
  v_blocking_column pg_catalog.text;
begin
  if exists (
    select 1 from public.payment_events
    where id is null or created_at is null or provider is null
       or event_id is null or status is null or detail is null
  ) then
    raise exception 'payment_events incompatible: hay valores NULL en columnas obligatorias';
  end if;

  if exists (
    select 1 from public.payment_events
    group by id having count(*) > 1
  ) then
    raise exception 'payment_events incompatible: existen id duplicados';
  end if;

  select pg_catalog.array_agg(attribute.attname order by key_column.ordinality)
    into v_primary_columns
  from pg_catalog.pg_constraint as constraint_row
  cross join lateral pg_catalog.unnest(constraint_row.conkey)
    with ordinality as key_column(attnum, ordinality)
  join pg_catalog.pg_attribute as attribute
    on attribute.attrelid = constraint_row.conrelid
   and attribute.attnum = key_column.attnum
  where constraint_row.conrelid = 'public.payment_events'::pg_catalog.regclass
    and constraint_row.contype = 'p';

  if v_primary_columns is not null
     and v_primary_columns <> array['id']::pg_catalog.text[] then
    raise exception 'payment_events incompatible: la PK debe estar formada únicamente por id';
  end if;

  select attribute.attname into v_blocking_column
  from pg_catalog.pg_attribute as attribute
  left join pg_catalog.pg_attrdef as default_value
    on default_value.adrelid = attribute.attrelid
   and default_value.adnum = attribute.attnum
  where attribute.attrelid = 'public.payment_events'::pg_catalog.regclass
    and attribute.attnum > 0
    and not attribute.attisdropped
    and attribute.attnotnull
    and default_value.oid is null
    and attribute.attname not in ('event_id', 'payment_id', 'order_id', 'supplier_order_id')
    and attribute.attname not in ('id', 'created_at', 'provider', 'status', 'detail')
  limit 1;

  if v_blocking_column is not null then
    raise exception 'payment_events incompatible: columna obligatoria adicional % no tiene default',
      v_blocking_column;
  end if;

  if v_primary_columns is null then
    alter table public.payment_events
      add constraint payment_events_pkey primary key (id);
  end if;
end;
$payment_events_data$;

alter table public.payment_events
  alter column id set default pg_catalog.gen_random_uuid(),
  alter column id set not null,
  alter column created_at set default pg_catalog.now(),
  alter column created_at set not null,
  alter column provider set default 'mercadopago',
  alter column provider set not null,
  alter column event_id set not null,
  alter column payment_id drop not null,
  alter column order_id drop not null,
  alter column status set default 'received',
  alter column status set not null,
  alter column detail set default '{}'::pg_catalog.jsonb,
  alter column detail set not null,
  alter column supplier_order_id drop not null;

do $unique_preflight$
begin
  if exists (
    select 1 from public.orders
    where public_access_token is not null
    group by public_access_token having count(*) > 1
  ) then
    raise exception 'orders incompatible: existen public_access_token duplicados';
  end if;

  if exists (
    select 1 from public.orders
    where mercadopago_payment_id is not null
    group by mercadopago_payment_id having count(*) > 1
  ) then
    raise exception 'orders incompatible: existen mercadopago_payment_id duplicados';
  end if;

  if exists (
    select 1 from public.payment_events
    group by provider, event_id having count(*) > 1
  ) then
    raise exception 'payment_events incompatible: existen provider/event_id duplicados';
  end if;
end;
$unique_preflight$;

create unique index if not exists orders_public_access_token_unique
  on public.orders(public_access_token)
  where public_access_token is not null;

create unique index if not exists orders_mercadopago_payment_id_unique
  on public.orders(mercadopago_payment_id)
  where mercadopago_payment_id is not null;

create unique index if not exists payment_events_provider_event_unique
  on public.payment_events(provider, event_id);

alter table public.payment_events enable row level security;
revoke all privileges on table public.payment_events from public, anon, authenticated;
grant all privileges on table public.payment_events to service_role;

create or replace function public.claim_mercadopago_fulfillment(
  p_order_id pg_catalog.uuid,
  p_event_id pg_catalog.text,
  p_payment_id pg_catalog.text,
  p_amount pg_catalog.numeric,
  p_currency pg_catalog.text
) returns pg_catalog.text
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_order public.orders%rowtype;
  v_event_id pg_catalog.uuid;
  v_note pg_catalog.text;
begin
  if nullif(pg_catalog.btrim(p_event_id), '') is null
     or nullif(pg_catalog.btrim(p_payment_id), '') is null then
    return 'invalid_event';
  end if;

  insert into public.payment_events(provider, event_id, payment_id, order_id, status)
  values ('mercadopago', p_event_id, p_payment_id, p_order_id, 'received')
  on conflict (provider, event_id) where event_id is not null do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return 'duplicate';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    update public.payment_events set status = 'order_not_found' where id = v_event_id;
    return 'order_not_found';
  end if;

  if v_order.supplier_order_id is not null
     or v_order.status in ('ordered_to_supplier', 'shipped', 'delivered') then
    update public.payment_events set status = 'already_processed' where id = v_event_id;
    return 'already_processed';
  end if;

  if v_order.status = 'cancelled' then
    update public.payment_events set status = 'cancelled' where id = v_event_id;
    return 'cancelled';
  end if;

  if pg_catalog.upper(coalesce(p_currency, '')) <> 'MXN'
     or p_amount is null
     or pg_catalog.abs(p_amount - v_order.total) > 0.005 then
    v_note := '[PAYMENT_VALIDATION_FAILED] ' || pg_catalog.jsonb_build_object(
      'payment_id', p_payment_id,
      'currency', p_currency,
      'amount', p_amount,
      'expected_total', v_order.total
    )::pg_catalog.text;
    update public.orders
      set notes = case
        when coalesce(notes, '') like '%' || v_note || '%' then notes
        when nullif(pg_catalog.btrim(notes), '') is null then v_note
        else notes || E'\n' || v_note
      end
      where id = p_order_id;
    update public.payment_events
      set status = 'rejected',
          detail = pg_catalog.jsonb_build_object('reason', 'amount_or_currency_mismatch')
      where id = v_event_id;
    return 'rejected';
  end if;

  -- processing funciona como reclamación operativa con los estados existentes.
  -- Un pedido ya processing requiere revisión manual; no se reintenta a ciegas.
  if v_order.status not in ('pending', 'paid') then
    update public.payment_events set status = 'manual_review' where id = v_event_id;
    return 'manual_review';
  end if;

  update public.orders
    set status = 'processing',
        mercadopago_payment_id = p_payment_id,
        fulfillment_claimed_at = pg_catalog.now()
    where id = p_order_id;
  update public.payment_events set status = 'claimed' where id = v_event_id;
  return 'claimed';
end;
$$;

alter function public.claim_mercadopago_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.numeric, pg_catalog.text
) owner to postgres;
revoke all on function public.claim_mercadopago_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.numeric, pg_catalog.text
) from public, anon, authenticated;
grant execute on function public.claim_mercadopago_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.numeric, pg_catalog.text
) to service_role;

create or replace function public.finalize_printful_fulfillment(
  p_order_id pg_catalog.uuid,
  p_event_id pg_catalog.text,
  p_payment_id pg_catalog.text,
  p_supplier_order_id pg_catalog.text
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event_row_id pg_catalog.uuid;
  v_updated integer;
begin
  if nullif(pg_catalog.btrim(p_supplier_order_id), '') is null then
    return false;
  end if;

  select id into v_event_row_id
  from public.payment_events
  where provider = 'mercadopago'
    and event_id = p_event_id
    and payment_id = p_payment_id
    and order_id = p_order_id
    and status = 'claimed'
  for update;

  if not found then return false; end if;

  update public.orders
    set status = 'ordered_to_supplier', supplier_order_id = p_supplier_order_id
    where id = p_order_id
      and status = 'processing'
      and mercadopago_payment_id = p_payment_id
      and supplier_order_id is null;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then return false; end if;

  update public.payment_events
    set status = 'fulfilled', supplier_order_id = p_supplier_order_id
    where id = v_event_row_id and status = 'claimed';
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'No se pudo finalizar el evento de fulfillment reclamado';
  end if;
  return true;
end;
$$;

alter function public.finalize_printful_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.text
) owner to postgres;
revoke all on function public.finalize_printful_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.text
) from public, anon, authenticated;
grant execute on function public.finalize_printful_fulfillment(
  pg_catalog.uuid, pg_catalog.text, pg_catalog.text, pg_catalog.text
) to service_role;

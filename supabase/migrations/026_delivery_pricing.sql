begin;

create table if not exists public.delivery_pricing_settings (
  id text primary key default 'default' check (id = 'default'),
  pricing_mode text not null default 'per_km' check (pricing_mode in ('per_km', 'per_area')),
  base_fee numeric(12,2) not null default 0 check (base_fee >= 0),
  rate_per_km numeric(12,2) not null default 0 check (rate_per_km >= 0),
  minimum_fee numeric(12,2) not null default 0 check (minimum_fee >= 0),
  road_distance_factor numeric(6,3) not null default 1.25 check (road_distance_factor >= 1 and road_distance_factor <= 5),
  area_rates jsonb not null default '{}'::jsonb check (jsonb_typeof(area_rates) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.delivery_pricing_settings (id) values ('default') on conflict (id) do nothing;
alter table public.delivery_pricing_settings enable row level security;
revoke all on table public.delivery_pricing_settings from anon;
grant select on table public.delivery_pricing_settings to authenticated;
drop policy if exists "Authenticated users can view delivery pricing" on public.delivery_pricing_settings;
create policy "Authenticated users can view delivery pricing"
  on public.delivery_pricing_settings for select to authenticated using (true);

create or replace function public.save_delivery_pricing_settings(
  p_pricing_mode text,
  p_base_fee numeric,
  p_rate_per_km numeric,
  p_minimum_fee numeric,
  p_road_distance_factor numeric,
  p_area_rates jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid() and p.active = true
      and r.name in ('Super Administrator', 'Enterprise Manager')
  ) then raise exception 'You do not have permission to change delivery rates.'; end if;
  if p_pricing_mode not in ('per_km', 'per_area')
    or p_base_fee is null or p_base_fee < 0 or p_base_fee > 10000000
    or p_rate_per_km is null or p_rate_per_km < 0 or p_rate_per_km > 10000000
    or p_minimum_fee is null or p_minimum_fee < 0 or p_minimum_fee > 10000000
    or p_road_distance_factor is null or p_road_distance_factor < 1 or p_road_distance_factor > 5
    or p_area_rates is null or jsonb_typeof(p_area_rates) <> 'object' then
    raise exception 'Check the delivery pricing values.';
  end if;
  if exists (
    select 1 from jsonb_each(p_area_rates) as rate(area, amount)
    where nullif(trim(rate.area), '') is null
      or jsonb_typeof(rate.amount) <> 'number'
      or case when jsonb_typeof(rate.amount) = 'number'
        then (rate.amount #>> '{}')::numeric < 0 or (rate.amount #>> '{}')::numeric > 10000000
        else false end
  ) then raise exception 'Each area needs a valid non-negative price.'; end if;

  insert into public.delivery_pricing_settings (
    id, pricing_mode, base_fee, rate_per_km, minimum_fee,
    road_distance_factor, area_rates, updated_at, updated_by
  ) values (
    'default', p_pricing_mode, p_base_fee, p_rate_per_km, p_minimum_fee,
    p_road_distance_factor, p_area_rates, now(), auth.uid()
  ) on conflict (id) do update set
    pricing_mode = excluded.pricing_mode,
    base_fee = excluded.base_fee,
    rate_per_km = excluded.rate_per_km,
    minimum_fee = excluded.minimum_fee,
    road_distance_factor = excluded.road_distance_factor,
    area_rates = excluded.area_rates,
    updated_at = now(),
    updated_by = auth.uid();
end;
$$;
revoke all on function public.save_delivery_pricing_settings(text, numeric, numeric, numeric, numeric, jsonb) from public;
grant execute on function public.save_delivery_pricing_settings(text, numeric, numeric, numeric, numeric, jsonb) to authenticated;

drop function if exists public.create_customer_delivery_request(text, double precision, double precision, text, text, text, double precision, double precision, text, text, text, text);

create function public.create_customer_delivery_request(
  p_pickup_address text,
  p_pickup_latitude double precision,
  p_pickup_longitude double precision,
  p_pickup_contact_name text,
  p_pickup_contact_phone text,
  p_delivery_address text,
  p_delivery_latitude double precision,
  p_delivery_longitude double precision,
  p_delivery_contact_name text,
  p_delivery_contact_phone text,
  p_package_description text,
  p_notes text default null,
  p_delivery_area text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_business_id uuid;
  v_catalog_item_id uuid;
  v_order_id uuid;
  v_settings public.delivery_pricing_settings%rowtype;
  v_distance_km numeric;
  v_fee numeric;
begin
  if auth.uid() is null then raise exception 'Sign in to request a delivery.'; end if;
  if nullif(trim(p_pickup_address), '') is null
    or nullif(trim(p_pickup_contact_name), '') is null
    or nullif(trim(p_pickup_contact_phone), '') is null
    or nullif(trim(p_delivery_address), '') is null
    or nullif(trim(p_delivery_contact_name), '') is null
    or nullif(trim(p_delivery_contact_phone), '') is null
    or nullif(trim(p_package_description), '') is null then
    raise exception 'Complete the collection, delivery, contact, and parcel details.';
  end if;
  if (p_pickup_latitude is null) <> (p_pickup_longitude is null)
    or (p_pickup_latitude is not null and (p_pickup_latitude not between -90 and 90 or p_pickup_longitude not between -180 and 180))
    or (p_delivery_latitude is null) <> (p_delivery_longitude is null)
    or (p_delivery_latitude is not null and (p_delivery_latitude not between -90 and 90 or p_delivery_longitude not between -180 and 180)) then
    raise exception 'Check both map pins and try again.';
  end if;
  select * into v_settings from public.delivery_pricing_settings where id = 'default';
  if not found then raise exception 'Delivery pricing is not configured yet. Please contact AEOS dispatch.'; end if;

  if v_settings.pricing_mode = 'per_km' then
    if p_pickup_latitude is null or p_delivery_latitude is null then
      raise exception 'Pin both pickup and delivery locations to calculate the distance-based fee.';
    end if;
    if v_settings.rate_per_km <= 0 then raise exception 'Delivery pricing is not configured yet. Please contact AEOS dispatch.'; end if;
    v_distance_km := 6371 * 2 * asin(sqrt(
      power(sin(radians(p_delivery_latitude - p_pickup_latitude) / 2), 2)
      + cos(radians(p_pickup_latitude)) * cos(radians(p_delivery_latitude))
      * power(sin(radians(p_delivery_longitude - p_pickup_longitude) / 2), 2)
    ));
    v_fee := greatest(v_settings.minimum_fee, v_settings.base_fee + v_distance_km * v_settings.road_distance_factor * v_settings.rate_per_km);
  else
    if nullif(trim(p_delivery_area), '') is null then raise exception 'Choose a delivery area to calculate the fee.'; end if;
    select (rate.value #>> '{}')::numeric into v_fee
      from jsonb_each(v_settings.area_rates) as rate(key, value)
      where lower(trim(rate.key)) = lower(trim(p_delivery_area)) limit 1;
    if v_fee is null then raise exception 'There is no delivery rate for the selected area yet.'; end if;
  end if;
  v_fee := round(v_fee, 2);

  select id into v_customer_id from public.customers where auth_user_id = auth.uid() limit 1;
  if v_customer_id is null then raise exception 'Customer profile not found.'; end if;
  select id into v_business_id from public.businesses where slug = 'delivery-service' and active = true;
  if v_business_id is null then raise exception 'Delivery service is unavailable.'; end if;
  select id into v_catalog_item_id from public.enterprise_catalog
  where business_id = v_business_id and name = 'Point-to-point delivery' and status = 'Active' limit 1;
  if v_catalog_item_id is null then raise exception 'Delivery service is unavailable.'; end if;

  insert into public.orders (
    business_id, customer_id, status, payment_status, fulfillment_method,
    pickup_address, pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_latitude, delivery_longitude, delivery_contact_name, delivery_contact_phone,
    notes, subtotal, total_amount
  ) values (
    v_business_id, v_customer_id, 'Pending', 'Pending', 'Delivery',
    trim(p_pickup_address), p_pickup_latitude, p_pickup_longitude, trim(p_pickup_contact_name), trim(p_pickup_contact_phone),
    trim(p_delivery_address), p_delivery_latitude, p_delivery_longitude, trim(p_delivery_contact_name), trim(p_delivery_contact_phone),
    concat_ws(E'\n', 'Parcel: ' || trim(p_package_description), nullif(trim(p_notes), '')), v_fee, v_fee
  ) returning id into v_order_id;

  insert into public.order_items (order_id, catalog_item_id, quantity, unit_price, total_price)
  values (v_order_id, v_catalog_item_id, 1, v_fee, v_fee);
  return v_order_id;
end;
$$;

revoke all on function public.create_customer_delivery_request(text, double precision, double precision, text, text, text, double precision, double precision, text, text, text, text, text) from public;
grant execute on function public.create_customer_delivery_request(text, double precision, double precision, text, text, text, double precision, double precision, text, text, text, text, text) to authenticated;

commit;

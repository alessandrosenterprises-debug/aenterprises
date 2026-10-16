begin;

insert into public.businesses (name, slug, description, active)
values (
  'Alessandro Delivery Service',
  'delivery-service',
  'On-demand collection and delivery from one location to another.',
  true
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    active = true;

insert into public.enterprise_catalog (
  business_id, item_type, category, name, description, base_price, quantity, status
)
select b.id, 'product', 'Delivery', 'Point-to-point delivery',
       'Delivery fee confirmed by the AEOS dispatch team.', 0, 0, 'Active'
from public.businesses b
where b.slug = 'delivery-service'
  and not exists (
    select 1 from public.enterprise_catalog c
    where c.business_id = b.id and c.name = 'Point-to-point delivery'
  );

alter table public.orders
  add column if not exists pickup_address text,
  add column if not exists pickup_latitude double precision,
  add column if not exists pickup_longitude double precision,
  add column if not exists pickup_contact_name text,
  add column if not exists pickup_contact_phone text,
  add column if not exists delivery_contact_name text,
  add column if not exists delivery_contact_phone text;

alter table public.orders
  drop constraint if exists orders_pickup_coordinates_check;
alter table public.orders
  add constraint orders_pickup_coordinates_check
  check (
    (pickup_latitude is null and pickup_longitude is null)
    or (pickup_latitude between -90 and 90 and pickup_longitude between -180 and 180)
  );

create or replace function public.create_customer_delivery_request(
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
  p_notes text default null
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
    concat_ws(E'\n', 'Parcel: ' || trim(p_package_description), nullif(trim(p_notes), '')), 0, 0
  ) returning id into v_order_id;

  insert into public.order_items (order_id, catalog_item_id, quantity, unit_price, total_price)
  values (v_order_id, v_catalog_item_id, 1, 0, 0);

  return v_order_id;
end;
$$;

revoke all on function public.create_customer_delivery_request(text, double precision, double precision, text, text, text, double precision, double precision, text, text, text, text) from public;
grant execute on function public.create_customer_delivery_request(text, double precision, double precision, text, text, text, double precision, double precision, text, text, text, text) to authenticated;

create or replace function public.set_delivery_request_fee(p_order_id uuid, p_fee numeric)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_business_id uuid;
begin
  if p_fee is null or p_fee < 0 or p_fee > 10000000 then raise exception 'Enter a valid delivery fee.'; end if;
  if not exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid() and p.active = true
      and r.name in ('Super Administrator', 'Enterprise Manager')
  ) then raise exception 'You do not have permission to set delivery fees.'; end if;

  select o.business_id into v_business_id
  from public.orders o
  where o.id = p_order_id and lower(o.fulfillment_method) = 'delivery'
  for update;
  if v_business_id is null or not exists (
    select 1 from public.businesses b where b.id = v_business_id and b.slug = 'delivery-service'
  ) then raise exception 'This is not an AEOS delivery-service request.'; end if;

  update public.orders set subtotal = p_fee, total_amount = p_fee where id = p_order_id;
  update public.order_items set unit_price = p_fee, total_price = p_fee where order_id = p_order_id;
end;
$$;

revoke all on function public.set_delivery_request_fee(uuid, numeric) from public;
grant execute on function public.set_delivery_request_fee(uuid, numeric) to authenticated;

commit;

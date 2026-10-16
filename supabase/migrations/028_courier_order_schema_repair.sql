begin;

-- Ensure courier business/catalog records exist when the original 025 migration
-- was not applied before pricing migration 026.
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
       'Courier service fee calculated using AEOS delivery pricing.', 0, 0, 'Active'
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

alter table public.orders drop constraint if exists orders_pickup_coordinates_check;
alter table public.orders add constraint orders_pickup_coordinates_check
  check (
    (pickup_latitude is null and pickup_longitude is null)
    or (
      pickup_latitude is not null and pickup_longitude is not null
      and pickup_latitude between -90 and 90
      and pickup_longitude between -180 and 180
    )
  );

-- Restore the admin fee override RPC if migration 025 was skipped.
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

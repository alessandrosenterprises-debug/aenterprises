begin;

alter table public.orders
  add column if not exists rider_latitude double precision,
  add column if not exists rider_longitude double precision,
  add column if not exists rider_location_updated_at timestamptz;

alter table public.orders
  drop constraint if exists orders_rider_coordinates_check;
alter table public.orders
  add constraint orders_rider_coordinates_check
  check (
    (rider_latitude is null and rider_longitude is null)
    or (
      rider_latitude between -90 and 90
      and rider_longitude between -180 and 180
    )
  );

create or replace function public.list_rider_account_options()
returns table(auth_user_id uuid, display_name text, email text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_configuration_admin() and not exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid()
      and p.active = true
      and r.name in (
        'Administrator', 'HR', 'HR Manager', 'HR Administrator',
        'Human Resources', 'Human Resources (HR)', 'Human Resources Manager'
      )
  ) then
    raise exception 'You do not have permission to manage rider accounts.';
  end if;

  return query
  select p.auth_user_id,
         coalesce(nullif(p.display_name, ''), nullif(concat_ws(' ', p.first_name, p.last_name), ''), p.email)::text,
         p.email::text
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.active = true
    and coalesce(r.name, '') <> 'Customer'
    and not exists (
      select 1 from public.employees e
      where e.user_id = p.auth_user_id
        and e.is_active = true
    )
  order by 2;
end;
$$;

revoke all on function public.list_rider_account_options() from public;
grant execute on function public.list_rider_account_options() to authenticated;

drop policy if exists "Assigned riders can view their delivery orders" on public.orders;
create policy "Assigned riders can view their delivery orders"
on public.orders
for select
to authenticated
using (
  rider_employee_id in (
    select e.id
    from public.employees e
    where e.user_id = auth.uid()
      and e.is_active = true
      and e.position ~* '(rider|driver|delivery)'
  )
);

drop policy if exists "Assigned riders can view delivery order items" on public.order_items;
create policy "Assigned riders can view delivery order items"
on public.order_items
for select
to authenticated
using (
  order_id in (
    select o.id
    from public.orders o
    where o.rider_employee_id in (
      select e.id
      from public.employees e
      where e.user_id = auth.uid()
        and e.is_active = true
        and e.position ~* '(rider|driver|delivery)'
    )
  )
);

create or replace function public.update_assigned_order_delivery(
  p_order_id uuid,
  p_status text default null,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  assigned_employee_id uuid;
  current_order public.orders%rowtype;
begin
  select e.id into assigned_employee_id
  from public.employees e
  where e.user_id = auth.uid()
    and e.is_active = true
    and e.position ~* '(rider|driver|delivery)'
  limit 1;

  if assigned_employee_id is null then
    raise exception 'No active rider profile is linked to this account.';
  end if;

  select * into current_order
  from public.orders
  where id = p_order_id
    and rider_employee_id = assigned_employee_id
    and lower(fulfillment_method) = 'delivery'
  for update;

  if not found then
    raise exception 'This delivery is not assigned to your rider account.';
  end if;

  if p_latitude is not null or p_longitude is not null then
    if p_latitude is null or p_longitude is null
      or p_latitude not between -90 and 90
      or p_longitude not between -180 and 180 then
      raise exception 'A valid latitude and longitude are required.';
    end if;
    if current_order.delivery_status <> 'Out for Delivery' then
      raise exception 'Live location can only be shared while a delivery is en route.';
    end if;
  end if;

  if p_status is null then
    if p_latitude is null then
      raise exception 'Choose a delivery progress update.';
    end if;
    update public.orders
    set rider_latitude = p_latitude,
        rider_longitude = p_longitude,
        rider_location_updated_at = now()
    where id = p_order_id;
    return;
  end if;

  if p_status = 'Preparing' then
    update public.orders
    set status = 'Processing', delivery_status = 'Preparing'
    where id = p_order_id;
  elsif p_status = 'Ready' then
    if current_order.status not in ('Processing', 'Confirmed', 'Pending') then
      raise exception 'This order cannot be marked ready from its current status.';
    end if;
    update public.orders
    set status = 'Ready', delivery_status = 'Preparing'
    where id = p_order_id;
  elsif p_status = 'Out for Delivery' then
    if current_order.status <> 'Ready' then
      raise exception 'Mark the order ready before starting delivery.';
    end if;
    update public.orders
    set status = 'Ready', delivery_status = 'Out for Delivery'
    where id = p_order_id;
  elsif p_status = 'Delivered' then
    if current_order.delivery_status <> 'Out for Delivery' then
      raise exception 'Start delivery before marking it delivered.';
    end if;
    update public.orders
    set status = 'Completed', delivery_status = 'Delivered'
    where id = p_order_id;
  else
    raise exception 'Invalid rider delivery status.';
  end if;

  if p_latitude is not null then
    update public.orders
    set rider_latitude = p_latitude,
        rider_longitude = p_longitude,
        rider_location_updated_at = now()
    where id = p_order_id;
  end if;
end;
$$;

revoke all on function public.update_assigned_order_delivery(uuid, text, double precision, double precision) from public;
grant execute on function public.update_assigned_order_delivery(uuid, text, double precision, double precision) to authenticated;

commit;

begin;

alter table public.orders
  add column if not exists delivery_proof_received_by text,
  add column if not exists delivery_proof_note text,
  add column if not exists delivery_proof_at timestamptz,
  add column if not exists delivery_rating smallint,
  add column if not exists delivery_review text,
  add column if not exists delivery_rated_at timestamptz;

alter table public.orders drop constraint if exists orders_delivery_rating_check;
alter table public.orders add constraint orders_delivery_rating_check check (delivery_rating is null or delivery_rating between 1 and 5);

drop function if exists public.update_assigned_order_delivery(uuid, text, double precision, double precision);

create function public.update_assigned_order_delivery(
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
  v_employee_id uuid;
  v_order public.orders%rowtype;
begin
  select e.id into v_employee_id from public.employees e
  where e.user_id = auth.uid() and e.is_active = true and e.position ~* '(rider|driver|delivery)' limit 1;
  if v_employee_id is null then raise exception 'No active rider profile is linked to this account.'; end if;
  select * into v_order from public.orders
  where id = p_order_id and rider_employee_id = v_employee_id and lower(fulfillment_method) = 'delivery'
  for update;
  if not found then raise exception 'This delivery is not assigned to your rider account.'; end if;
  if p_latitude is not null or p_longitude is not null then
    if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
      raise exception 'A valid latitude and longitude are required.';
    end if;
    if v_order.delivery_status <> 'Out for Delivery' then raise exception 'Live location can only be shared while a delivery is en route.'; end if;
  end if;
  if p_status is null then
    if p_latitude is null then raise exception 'Choose a delivery progress update.'; end if;
    update public.orders set rider_latitude = p_latitude, rider_longitude = p_longitude, rider_location_updated_at = now() where id = p_order_id;
    return;
  end if;
  if p_status = 'Delivered' then raise exception 'Enter the recipient details to record proof of delivery.';
  elsif p_status = 'Preparing' then
    update public.orders set status = 'Processing', delivery_status = 'Preparing' where id = p_order_id;
  elsif p_status = 'Ready' then
    if v_order.status not in ('Processing', 'Confirmed', 'Pending') then raise exception 'This order cannot be marked ready from its current status.'; end if;
    update public.orders set status = 'Ready', delivery_status = 'Preparing' where id = p_order_id;
  elsif p_status = 'Out for Delivery' then
    if v_order.status <> 'Ready' then raise exception 'Mark the order ready before starting delivery.'; end if;
    update public.orders set status = 'Ready', delivery_status = 'Out for Delivery' where id = p_order_id;
  else raise exception 'Invalid rider delivery status.';
  end if;
  if p_latitude is not null then
    update public.orders set rider_latitude = p_latitude, rider_longitude = p_longitude, rider_location_updated_at = now() where id = p_order_id;
  end if;
end;
$$;
revoke all on function public.update_assigned_order_delivery(uuid, text, double precision, double precision) from public;
grant execute on function public.update_assigned_order_delivery(uuid, text, double precision, double precision) to authenticated;

create or replace function public.complete_assigned_delivery_with_proof(
  p_order_id uuid,
  p_received_by text,
  p_proof_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid;
  v_order public.orders%rowtype;
begin
  select e.id into v_employee_id from public.employees e
  where e.user_id = auth.uid() and e.is_active = true and e.position ~* '(rider|driver|delivery)' limit 1;
  if v_employee_id is null then raise exception 'No active rider profile is linked to this account.'; end if;

  select * into v_order from public.orders
  where id = p_order_id and rider_employee_id = v_employee_id and lower(fulfillment_method) = 'delivery'
  for update;
  if not found then raise exception 'This delivery is not assigned to your rider account.'; end if;
  if v_order.delivery_status <> 'Out for Delivery' then raise exception 'Start delivery before confirming delivery.'; end if;
  if nullif(trim(p_received_by), '') is null then raise exception 'Enter the name of the person who received the delivery.'; end if;
  if length(coalesce(p_proof_note, '')) > 500 then raise exception 'Delivery proof note must be 500 characters or less.'; end if;

  update public.orders set status = 'Completed', delivery_status = 'Delivered',
    delivery_proof_received_by = trim(p_received_by),
    delivery_proof_note = nullif(trim(p_proof_note), ''),
    delivery_proof_at = now()
  where id = p_order_id;
end;
$$;
revoke all on function public.complete_assigned_delivery_with_proof(uuid, text, text) from public;
grant execute on function public.complete_assigned_delivery_with_proof(uuid, text, text) to authenticated;

create or replace function public.rate_customer_delivery(
  p_order_id uuid,
  p_rating smallint,
  p_review text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to rate this delivery.'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Choose a rating from 1 to 5.'; end if;
  if length(coalesce(p_review, '')) > 1000 then raise exception 'Review must be 1000 characters or less.'; end if;
  update public.orders o set delivery_rating = p_rating, delivery_review = nullif(trim(p_review), ''), delivery_rated_at = now()
  from public.businesses b
  where o.id = p_order_id and o.customer_id in (select c.id from public.customers c where c.auth_user_id = auth.uid())
    and o.business_id = b.id and b.slug = 'delivery-service' and o.delivery_status = 'Delivered';
  if not found then raise exception 'This completed courier order cannot be rated.'; end if;
end;
$$;
revoke all on function public.rate_customer_delivery(uuid, smallint, text) from public;
grant execute on function public.rate_customer_delivery(uuid, smallint, text) to authenticated;

commit;

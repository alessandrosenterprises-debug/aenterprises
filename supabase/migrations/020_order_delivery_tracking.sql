begin;

alter table public.orders
  add column if not exists rider_employee_id uuid
    references public.employees(id) on delete set null,
  add column if not exists delivery_status text not null default 'Not Started',
  add column if not exists delivery_status_updated_at timestamptz;

alter table public.orders drop constraint if exists orders_delivery_status_check;
alter table public.orders
  add constraint orders_delivery_status_check
  check (delivery_status in (
    'Not Started',
    'Preparing',
    'Rider Assigned',
    'Picked Up',
    'Out for Delivery',
    'Delivered',
    'Delivery Failed'
  ));

create index if not exists idx_orders_rider_employee_id
  on public.orders(rider_employee_id);

create or replace function public.set_order_delivery_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if new.delivery_status is distinct from old.delivery_status then
    new.delivery_status_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_delivery_status_updated_at on public.orders;
create trigger orders_delivery_status_updated_at
before update on public.orders
for each row execute function public.set_order_delivery_status_updated_at();

drop trigger if exists customer_order_notifications on public.orders;
create trigger customer_order_notifications
after insert or update of status, delivery_status, rider_employee_id on public.orders
for each row execute function public.notify_customer_activity_change();

commit;

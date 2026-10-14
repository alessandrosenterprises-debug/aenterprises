begin;

alter table public.orders
  add column if not exists delivery_latitude double precision,
  add column if not exists delivery_longitude double precision;

alter table public.orders
  drop constraint if exists orders_delivery_coordinates_check;

alter table public.orders
  add constraint orders_delivery_coordinates_check
  check (
    (delivery_latitude is null and delivery_longitude is null)
    or (
      delivery_latitude between -90 and 90
      and delivery_longitude between -180 and 180
    )
  );

commit;

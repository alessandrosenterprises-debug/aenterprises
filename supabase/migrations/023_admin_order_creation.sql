-- Allow the same configuration administrators who manage orders in AEOS
-- to create an order and its line items from the admin order desk.
drop policy if exists "Configuration admins can create orders" on public.orders;
create policy "Configuration admins can create orders"
on public.orders
for insert
to authenticated
with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can create order items" on public.order_items;
create policy "Configuration admins can create order items"
on public.order_items
for insert
to authenticated
with check (
  public.is_configuration_admin()
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
  )
);

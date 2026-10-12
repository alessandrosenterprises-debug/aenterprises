-- Allow configuration administrators to manage customer orders.
drop policy if exists "Configuration admins can read orders" on public.orders;
create policy "Configuration admins can read orders"
on public.orders for select to authenticated
using (public.is_configuration_admin());

drop policy if exists "Configuration admins can update orders" on public.orders;
create policy "Configuration admins can update orders"
on public.orders for update to authenticated
using (public.is_configuration_admin())
with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can read order items" on public.order_items;
create policy "Configuration admins can read order items"
on public.order_items for select to authenticated
using (public.is_configuration_admin());

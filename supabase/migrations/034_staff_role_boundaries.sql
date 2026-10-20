-- Enforce staff permissions at the database boundary as well as in navigation.

-- Bookings remain readable to authenticated staff for existing calendar views.
-- Staff writes are limited to staff roles with the relevant permission.
drop policy if exists "Configuration admins can insert bookings" on public.bookings;
create policy "Authorized staff can insert bookings"
on public.bookings for insert to authenticated
with check (public.is_configuration_admin() or public.has_permission('bookings.manage'));

drop policy if exists "Configuration admins can update bookings" on public.bookings;
create policy "Authorized staff can update bookings"
on public.bookings for update to authenticated
using (public.is_configuration_admin() or public.has_permission('bookings.manage'))
with check (public.is_configuration_admin() or public.has_permission('bookings.manage'));

drop policy if exists "Configuration admins can delete bookings" on public.bookings;
create policy "Authorized staff can delete bookings"
on public.bookings for delete to authenticated
using (public.is_configuration_admin() or public.has_permission('bookings.manage'));

-- Give order desk staff the access required to accept, prepare and fulfil orders.
drop policy if exists "Configuration admins can read orders" on public.orders;
create policy "Authorized staff can read orders"
on public.orders for select to authenticated
using (public.is_configuration_admin() or public.has_permission('orders.view') or public.has_permission('orders.manage') or public.has_permission('deliveries.manage'));

drop policy if exists "Configuration admins can update orders" on public.orders;
create policy "Authorized staff can update orders"
on public.orders for update to authenticated
using (public.is_configuration_admin() or public.has_permission('orders.manage') or public.has_permission('deliveries.manage'))
with check (public.is_configuration_admin() or public.has_permission('orders.manage') or public.has_permission('deliveries.manage'));

drop policy if exists "Configuration admins can create orders" on public.orders;
create policy "Authorized staff can create orders"
on public.orders for insert to authenticated
with check (public.is_configuration_admin() or public.has_permission('orders.manage'));

drop policy if exists "Configuration admins can read order items" on public.order_items;
create policy "Authorized staff can read order items"
on public.order_items for select to authenticated
using (public.is_configuration_admin() or public.has_permission('orders.view') or public.has_permission('orders.manage') or public.has_permission('deliveries.manage'));

drop policy if exists "Configuration admins can create order items" on public.order_items;
create policy "Authorized staff can create order items"
on public.order_items for insert to authenticated
with check (
  (public.is_configuration_admin() or public.has_permission('orders.manage'))
  and exists (select 1 from public.orders o where o.id = order_id)
);

-- Loan applications are visible to authorized staff and to their own customer.
drop policy if exists "Authenticated users can view customer loan applications" on public.customer_loan_applications;
create policy "Authorized staff or applicant can read loan applications"
on public.customer_loan_applications for select to authenticated
using (
  public.has_permission('customers.manage')
  or public.has_permission('loans.approve')
  or exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid())
);

drop policy if exists "Authenticated users can create customer loan applications" on public.customer_loan_applications;
create policy "Authorized staff or applicant can create loan applications"
on public.customer_loan_applications for insert to authenticated
with check (
  public.has_permission('customers.manage')
  or public.has_permission('loans.approve')
  or exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid())
);

drop policy if exists "Authenticated users can update customer loan applications" on public.customer_loan_applications;
create policy "Authorized staff can update loan applications"
on public.customer_loan_applications for update to authenticated
using (public.has_permission('customers.manage') or public.has_permission('loans.approve'))
with check (public.has_permission('customers.manage') or public.has_permission('loans.approve'));

drop policy if exists "Authenticated users can delete customer loan applications" on public.customer_loan_applications;
create policy "Authorized managers can delete loan applications"
on public.customer_loan_applications for delete to authenticated
using (public.has_permission('customers.manage'));

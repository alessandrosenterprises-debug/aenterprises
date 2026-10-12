-- Allow signed-in customers to request bookings from the native customer app.
-- The row must belong to the authenticated customer's account and reference an
-- active business and active service catalogue entry.
create policy "Customers can request their own bookings"
on public.bookings
for insert
to authenticated
with check (
  status = 'Pending'
  and payment_status = 'Pending'
  and customer_id in (
    select id
    from public.customers
    where auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.businesses b
    where b.id = bookings.business_id
      and b.active = true
  )
  and exists (
    select 1
    from public.enterprise_catalog c
    where c.id = bookings.catalog_item_id
      and c.business_id = bookings.business_id
      and lower(c.item_type) = 'service'
      and lower(c.status) = 'active'
  )
);

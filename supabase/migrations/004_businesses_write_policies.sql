-- ============================================================
-- Alessandro Enterprises
-- Migration 004: Business Configuration Write Policies
-- ============================================================

-- Businesses already has RLS enabled in migration 001.
-- Add the missing configuration-admin write policies.

create policy "Configuration admins can insert businesses"
on public.businesses
for insert
to authenticated
with check (
    public.is_configuration_admin()
);

create policy "Configuration admins can update businesses"
on public.businesses
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);

create policy "Configuration admins can delete businesses"
on public.businesses
for delete
to authenticated
using (
    public.is_configuration_admin()
);
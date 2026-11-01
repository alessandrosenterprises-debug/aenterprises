begin;

-- Staff working under an open manager session need to move orders through
-- their ordinary store workflow. Keep the expanded grants inside that exact
-- manager-owned store boundary; do not persist them on generic staff roles.
create or replace function public.has_permission(required_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  scoped boolean;
begin
  select s.store_scoped into scoped from public.get_current_store_scope() s;
  if scoped then
    if required_permission not in (
      'dashboard.view','businesses.view','bookings.view','bookings.manage',
      'orders.view','orders.manage','deliveries.manage','reports.view',
      'reports.submit','reports.review','customers.view','communications.manage',
      'stock.view','stock.manage','stock.purchase','stock.count','operations.open',
      'cash.reconcile','cash.review','cash.manage','cash.finalize'
    ) then
      return false;
    end if;

    -- Routine customer-facing store work is available to every active staff
    -- operator in the manager's session. This is deliberately not a durable
    -- role grant and expires as soon as that manager session closes.
    if required_permission in (
      'dashboard.view','businesses.view','bookings.view','bookings.manage',
      'orders.view','orders.manage','deliveries.manage','customers.view',
      'communications.manage'
    ) then
      return true;
    end if;

    -- Higher-responsibility functions still require an explicit assignment
    -- on the active operator's role.
    return exists (
      select 1
      from public.profiles p
      join public.roles r on r.id=p.role_id and coalesce(r.status,'Active')='Active'
      join public.role_permissions rp on rp.role_id=r.id
      join public.permissions perm on perm.id=rp.permission_id
      where p.id=public.get_effective_profile_id()
        and p.active=true
        and perm.permission_key=required_permission
    );
  end if;

  return exists (
    select 1
    from public.profiles p
    join public.roles r on r.id=p.role_id and coalesce(r.status,'Active')='Active'
    left join public.role_permissions rp on rp.role_id=r.id
    left join public.permissions perm on perm.id=rp.permission_id
    where p.id=public.get_effective_profile_id()
      and p.active=true
      and (r.name='Super Administrator' or perm.permission_key=required_permission)
  );
end;
$$;
revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

-- The store order workflow has distinct Accept and Confirm steps. Rejections
-- are retained as a terminal outcome so staff can review the record later.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in (
    'Pending','Accepted','Confirmed','Processing','Ready',
    'Completed','Cancelled','Rejected'
  ));

notify pgrst,'reload schema';
commit;

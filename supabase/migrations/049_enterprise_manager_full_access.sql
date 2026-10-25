begin;

-- Enterprise Managers are the enterprise Admin role: grant them the same
-- operational permission checks as Super Administrators while preserving the
-- dedicated Super Administrator grant boundary.
create or replace function public.has_permission(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
    left join public.role_permissions rp on rp.role_id = r.id
    left join public.permissions perm on perm.id = rp.permission_id
    where p.id = public.get_effective_profile_id()
      and p.active = true
      and (
        r.name = 'Super Administrator'
        or (r.name = 'Enterprise Manager' and required_permission <> 'access.super_admin')
        or perm.permission_key = required_permission
      )
  );
$$;

grant execute on function public.has_permission(text) to authenticated;

notify pgrst, 'reload schema';
commit;

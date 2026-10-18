-- Complete the access configuration tables used by the dashboard.
-- Existing roles are preserved and start as active.
alter table public.roles
  add column if not exists status text not null default 'Active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'roles_status_check'
      and conrelid = 'public.roles'::regclass
  ) then
    alter table public.roles
      add constraint roles_status_check
      check (status in ('Active', 'Inactive'));
  end if;
end;
$$;

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissions_module_action_unique unique (module, action)
);

alter table public.roles enable row level security;
alter table public.permissions enable row level security;

drop policy if exists "Configuration admins can insert roles" on public.roles;
create policy "Configuration admins can insert roles"
  on public.roles for insert to authenticated
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can update roles" on public.roles;
create policy "Configuration admins can update roles"
  on public.roles for update to authenticated
  using (public.is_configuration_admin())
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can delete roles" on public.roles;
create policy "Configuration admins can delete roles"
  on public.roles for delete to authenticated
  using (public.is_configuration_admin());

drop policy if exists "Configuration admins can read permissions" on public.permissions;
create policy "Configuration admins can read permissions"
  on public.permissions for select to authenticated
  using (public.is_configuration_admin());

drop policy if exists "Configuration admins can insert permissions" on public.permissions;
create policy "Configuration admins can insert permissions"
  on public.permissions for insert to authenticated
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can update permissions" on public.permissions;
create policy "Configuration admins can update permissions"
  on public.permissions for update to authenticated
  using (public.is_configuration_admin())
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can delete permissions" on public.permissions;
create policy "Configuration admins can delete permissions"
  on public.permissions for delete to authenticated
  using (public.is_configuration_admin());

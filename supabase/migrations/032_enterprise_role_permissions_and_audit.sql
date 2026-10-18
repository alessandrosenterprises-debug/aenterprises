-- Enterprise role assignments, permission catalog, and access audit trail.
alter table public.permissions
  add column if not exists permission_key text;

update public.permissions
set permission_key = lower(regexp_replace(module || '.' || action, '[^a-zA-Z0-9._-]+', '.', 'g'))
where permission_key is null;

alter table public.permissions
  alter column permission_key set not null;

create unique index if not exists permissions_permission_key_unique
  on public.permissions(permission_key);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_auth_user_id uuid,
  action text not null,
  resource text not null,
  resource_id text,
  business_id uuid references public.businesses(id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_actor_idx on public.activity_logs(actor_profile_id, created_at desc);
create index if not exists activity_logs_resource_idx on public.activity_logs(resource, resource_id);

alter table public.role_permissions enable row level security;
alter table public.activity_logs enable row level security;
alter table public.employees enable row level security;

create or replace function public.protect_system_roles()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.name in ('Super Administrator','Enterprise Manager') then
      raise exception 'Protected system role names cannot be created';
    end if;
    return new;
  end if;
  if tg_op = 'DELETE' then
    if old.name in ('Super Administrator','Enterprise Manager') then
      raise exception 'Protected system roles cannot be deleted';
    end if;
    return old;
  end if;
  if old.name in ('Super Administrator','Enterprise Manager') and
    (new.name is distinct from old.name or new.status is distinct from old.status) then
    raise exception 'Protected system roles cannot be renamed or deactivated';
  end if;
  if old.name not in ('Super Administrator','Enterprise Manager') and new.name in ('Super Administrator','Enterprise Manager') then
    raise exception 'Protected system role names cannot be assigned to another role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_system_roles on public.roles;
create trigger protect_system_roles
  before insert or update or delete on public.roles
  for each row execute function public.protect_system_roles();

create or replace function public.is_super_administrator()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid() and p.active = true and r.name = 'Super Administrator'
  );
$$;

create or replace function public.has_permission(required_permission text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
    left join public.role_permissions rp on rp.role_id = r.id
    left join public.permissions perm on perm.id = rp.permission_id
    where p.auth_user_id = auth.uid() and p.active = true
      and (r.name = 'Super Administrator' or perm.permission_key = required_permission)
  );
$$;

grant execute on function public.is_super_administrator() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.is_configuration_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid() and p.active = true and coalesce(r.status, 'Active') = 'Active'
      and r.name in ('Super Administrator', 'Enterprise Manager')
  );
$$;

drop policy if exists "Admins can read role permissions" on public.role_permissions;
create policy "Admins can read role permissions" on public.role_permissions
  for select to authenticated using (public.is_configuration_admin());
drop policy if exists "Staff can read own role permissions" on public.role_permissions;
create policy "Staff can read own role permissions" on public.role_permissions
  for select to authenticated using (role_id = (select p.role_id from public.profiles p where p.auth_user_id = auth.uid() and p.active = true limit 1));
drop policy if exists "Admins can manage role permissions" on public.role_permissions;
create policy "Admins can manage role permissions" on public.role_permissions
  for all to authenticated
  using (public.is_configuration_admin() and (public.is_super_administrator() or not exists (
    select 1 from public.permissions p where p.id = permission_id and p.permission_key = 'access.super_admin'
  )))
  with check (public.is_configuration_admin() and (public.is_super_administrator() or not exists (
    select 1 from public.permissions p where p.id = permission_id and p.permission_key = 'access.super_admin'
  )));

drop policy if exists "Admins can read staff profiles" on public.profiles;
create policy "Admins can read staff profiles" on public.profiles
  for select to authenticated using (public.is_configuration_admin() or auth.uid() = auth_user_id);
drop policy if exists "Admins can update staff roles" on public.profiles;

drop policy if exists "Authenticated users can read permission catalog" on public.permissions;
create policy "Authenticated users can read permission catalog" on public.permissions
  for select to authenticated using (true);

drop policy if exists "Authorized staff can read employees" on public.employees;
create policy "Authorized staff can read employees" on public.employees
  for select to authenticated using (public.has_permission('employees.view') or public.has_permission('employees.manage') or public.has_permission('hr.manage'));
drop policy if exists "Authorized staff can create employees" on public.employees;
create policy "Authorized staff can create employees" on public.employees
  for insert to authenticated with check (public.has_permission('employees.manage') or public.has_permission('hr.manage'));
drop policy if exists "Authorized staff can update employees" on public.employees;
create policy "Authorized staff can update employees" on public.employees
  for update to authenticated using (public.has_permission('employees.manage') or public.has_permission('hr.manage'))
  with check (public.has_permission('employees.manage') or public.has_permission('hr.manage'));
drop policy if exists "Authorized staff can delete employees" on public.employees;
create policy "Authorized staff can delete employees" on public.employees
  for delete to authenticated using (public.has_permission('employees.manage') or public.has_permission('hr.manage'));

-- Configuration changes are auditable as well as staff role assignments.
drop policy if exists "Admins can read permission catalog" on public.permissions;

drop policy if exists "Admins can read activity logs" on public.activity_logs;
create policy "Admins can read activity logs" on public.activity_logs
  for select to authenticated using (public.is_configuration_admin() or public.has_permission('access.view_audit'));
drop policy if exists "Authenticated users can record own activity" on public.activity_logs;
create policy "Authenticated users can record own activity" on public.activity_logs
  for insert to authenticated with check (actor_auth_user_id = auth.uid());

-- Stable keys let code, reports, and role assignments use the same names.
insert into public.permissions (module, action, name, description, permission_key)
values
  ('dashboard','view','View dashboard','Open the enterprise dashboard.','dashboard.view'),
  ('businesses','view','View businesses','View business workspaces and records.','businesses.view'),
  ('businesses','manage','Manage businesses','Create and update enterprise business records.','businesses.manage'),
  ('customers','view','View customers','View customer records.','customers.view'),
  ('customers','manage','Manage customers','Manage customer records and requests.','customers.manage'),
  ('loans','approve','Approve customer loans','Review and approve customer loan applications.','loans.approve'),
  ('employees','view','View staff','View employee and staff records.','employees.view'),
  ('employees','manage','Manage staff','Create and update staff records and assignments.','employees.manage'),
  ('bookings','view','View bookings','View appointments and booking records.','bookings.view'),
  ('bookings','manage','Manage bookings','Manage appointments and booking status.','bookings.manage'),
  ('orders','view','View orders','View customer orders.','orders.view'),
  ('orders','manage','Manage orders','Manage order fulfillment and status.','orders.manage'),
  ('deliveries','manage','Manage deliveries','Assign riders and manage courier deliveries.','deliveries.manage'),
  ('products','manage','Manage products','Manage products, services, and catalogs.','products.manage'),
  ('reports','view','View reports','View and export enterprise reports.','reports.view'),
  ('hr','manage','Manage HR','Manage departments, attendance, leave, and HR records.','hr.manage'),
  ('communications','manage','Manage communications','Manage email, messages, and notifications.','communications.manage'),
  ('configuration','manage','Manage configuration','Manage operational configuration.','configuration.manage'),
  ('settings','manage','Manage settings','Change platform and company settings.','settings.manage'),
  ('access','manage_roles','Manage roles','Create and edit access roles.','access.manage_roles'),
  ('access','manage_permissions','Manage permissions','Assign permissions to roles.','access.manage_permissions'),
  ('access','assign_staff','Assign staff access','Assign roles to staff accounts.','access.assign_staff'),
  ('access','view_audit','View activity log','Review access and administration activity.','access.view_audit'),
  ('access','super_admin','Grant Super Administrator','Grant the highest enterprise access role.','access.super_admin')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

-- Baseline access is explicit and can be adjusted in the access workspace.
with role_defaults(role_name, permission_key) as (
  values
    ('Enterprise Manager','dashboard.view'),('Enterprise Manager','businesses.view'),('Enterprise Manager','businesses.manage'),
    ('Enterprise Manager','customers.view'),('Enterprise Manager','customers.manage'),('Enterprise Manager','employees.view'),('Enterprise Manager','employees.manage'),
    ('Enterprise Manager','loans.approve'),
    ('Enterprise Manager','bookings.view'),('Enterprise Manager','bookings.manage'),('Enterprise Manager','orders.view'),('Enterprise Manager','orders.manage'),
    ('Enterprise Manager','deliveries.manage'),('Enterprise Manager','products.manage'),('Enterprise Manager','reports.view'),('Enterprise Manager','hr.manage'),
    ('Enterprise Manager','communications.manage'),('Enterprise Manager','configuration.manage'),('Enterprise Manager','settings.manage'),
    ('Enterprise Manager','access.manage_roles'),('Enterprise Manager','access.manage_permissions'),('Enterprise Manager','access.assign_staff'),('Enterprise Manager','access.view_audit'),
    ('Business Manager','dashboard.view'),('Business Manager','businesses.view'),('Business Manager','customers.view'),('Business Manager','customers.manage'),
    ('Business Manager','employees.view'),('Business Manager','bookings.view'),('Business Manager','bookings.manage'),('Business Manager','orders.view'),('Business Manager','orders.manage'),
    ('Business Manager','deliveries.manage'),('Business Manager','products.manage'),('Business Manager','reports.view'),('Business Manager','communications.manage'),
    ('Supervisor','dashboard.view'),('Supervisor','customers.view'),('Supervisor','employees.view'),('Supervisor','bookings.view'),('Supervisor','bookings.manage'),
    ('Supervisor','orders.view'),('Supervisor','orders.manage'),('Supervisor','deliveries.manage'),('Supervisor','reports.view'),
    ('Employee','dashboard.view'),('Employee','bookings.view'),('Employee','orders.view'),('Employee','deliveries.manage')
)
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from role_defaults d
join public.roles r on r.name = d.role_name
join public.permissions p on p.permission_key = d.permission_key
on conflict (role_id, permission_id) do nothing;

create or replace function public.log_enterprise_activity(
  p_action text, p_resource text, p_resource_id text, p_summary text, p_metadata jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare log_id uuid; actor_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select id into actor_id from public.profiles where auth_user_id = auth.uid() and active = true;
  insert into public.activity_logs(actor_profile_id, actor_auth_user_id, action, resource, resource_id, summary, metadata)
  values(actor_id, auth.uid(), p_action, p_resource, p_resource_id, p_summary, coalesce(p_metadata, '{}'::jsonb))
  returning id into log_id;
  return log_id;
end;
$$;
grant execute on function public.log_enterprise_activity(text,text,text,text,jsonb) to authenticated;

create or replace function public.set_role_permissions(p_role_id uuid, p_permission_ids uuid[])
returns void language plpgsql security definer set search_path = public
as $$
declare role_label text; grant_count integer;
begin
  if not public.is_configuration_admin() then raise exception 'Permission denied'; end if;
  select name into role_label from public.roles where id = p_role_id;
  if role_label is null then raise exception 'Role not found'; end if;
  if not public.is_super_administrator() and exists (
    select 1 from public.permissions p where p.id = any(coalesce(p_permission_ids, '{}')) and p.permission_key = 'access.super_admin'
  ) then raise exception 'Only a Super Administrator can grant Super Administrator access'; end if;
  delete from public.role_permissions where role_id = p_role_id;
  insert into public.role_permissions(role_id, permission_id, granted_by)
  select p_role_id, p.id, (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  from public.permissions p where p.id = any(coalesce(p_permission_ids, '{}'));
  get diagnostics grant_count = row_count;
  perform public.log_enterprise_activity('update','role_permissions',p_role_id::text,
    'Updated permissions for ' || role_label,
    jsonb_build_object('permission_count', grant_count));
end;
$$;
grant execute on function public.set_role_permissions(uuid,uuid[]) to authenticated;

create or replace function public.assign_staff_role(p_profile_id uuid, p_role_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare target_name text; staff_name text;
begin
  if not public.is_configuration_admin() then raise exception 'Permission denied'; end if;
  select name into target_name from public.roles where id = p_role_id and coalesce(status,'Active') = 'Active';
  if target_name is null then raise exception 'Selected role is not active'; end if;
  if target_name = 'Super Administrator' and not public.is_super_administrator() then
    raise exception 'Only a Super Administrator can grant this role';
  end if;
  if target_name = 'Enterprise Manager' and not public.is_super_administrator() then
    raise exception 'Only a Super Administrator can grant the Enterprise Manager role';
  end if;
  perform set_config('app.assign_staff_role', 'on', true);
  update public.profiles set role_id = p_role_id, updated_at = now()
    where id = p_profile_id and active = true returning coalesce(display_name,email) into staff_name;
  if staff_name is null then raise exception 'Active staff account not found'; end if;
  perform public.log_enterprise_activity('assign_role','staff',p_profile_id::text,
    'Assigned ' || target_name || ' to ' || staff_name,
    jsonb_build_object('role_name',target_name));
end;
$$;
grant execute on function public.assign_staff_role(uuid,uuid) to authenticated;

-- Existing self-profile updates must not let a user change their own role_id.
create or replace function public.protect_profile_role_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role_id is distinct from new.role_id and coalesce(current_setting('app.assign_staff_role', true), 'off') <> 'on' then
    raise exception 'Staff roles must be changed through the enterprise access manager';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_assignment on public.profiles;
create trigger protect_profile_role_assignment
  before update on public.profiles
  for each row execute function public.protect_profile_role_assignment();

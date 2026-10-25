begin;

-- Keep a department assignment on the signed-in profile as well as the HR row.
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists profiles_department_assignment_idx
  on public.profiles(business_id, branch_id, department_id);
create index if not exists employees_department_assignment_idx
  on public.employees(business_id, branch_id, department_id);

update public.profiles p
set department_id = e.department_id
from public.employees e
where e.user_id = p.auth_user_id
  and p.department_id is distinct from e.department_id;

create or replace function public.sync_employee_department_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles set department_id = null
    where auth_user_id = old.user_id and department_id is not null;
    return old;
  end if;
  if new.user_id is not null then
    update public.profiles set department_id = new.department_id
    where auth_user_id = new.user_id and department_id is distinct from new.department_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_employee_department_assignment on public.employees;
create trigger sync_employee_department_assignment
after insert or update of user_id, department_id or delete on public.employees
for each row execute function public.sync_employee_department_assignment();

create or replace function public.sync_profile_department_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.employees set department_id = new.department_id
  where user_id = new.auth_user_id and department_id is distinct from new.department_id;
  return new;
end;
$$;

drop trigger if exists sync_profile_department_assignment on public.profiles;
create trigger sync_profile_department_assignment
after update of department_id on public.profiles
for each row execute function public.sync_profile_department_assignment();

-- Enterprise administrators retain enterprise-wide visibility. Other accounts
-- can see staff rows only in their assigned business, branch, and department.
create or replace function public.can_access_staff_department(
  p_business_id uuid,
  p_branch_id uuid,
  p_department_id uuid
)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare
  viewer_id uuid;
  viewer_department_id uuid;
  viewer_role text;
begin
  viewer_id := public.get_effective_profile_id();
  if viewer_id is null then return false; end if;

  select p.department_id, r.name
    into viewer_department_id, viewer_role
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = viewer_id and p.active;
  if not found then return false; end if;

  if viewer_role in ('Super Administrator', 'Enterprise Manager')
     or public.has_permission('access.super_admin') then
    return true;
  end if;

  if p_department_id is null or viewer_department_id is distinct from p_department_id then
    return false;
  end if;
  return public.can_access_business(p_business_id)
     and public.can_access_branch(p_business_id, p_branch_id);
end;
$$;
revoke all on function public.can_access_staff_department(uuid, uuid, uuid) from public;
grant execute on function public.can_access_staff_department(uuid, uuid, uuid) to authenticated;

drop policy if exists aeos_department_staff_scope on public.employees;
create policy aeos_department_staff_scope on public.employees as restrictive
  for all to authenticated
  using (public.can_access_staff_department(business_id, branch_id, department_id))
  with check (public.can_access_staff_department(business_id, branch_id, department_id));

drop policy if exists aeos_department_profile_scope on public.profiles;
create policy aeos_department_profile_scope on public.profiles as restrictive
  for all to authenticated
  using (
    id = public.get_effective_profile_id()
    or public.can_access_staff_department(business_id, branch_id, department_id)
  )
  with check (
    id = public.get_effective_profile_id()
    or public.can_access_staff_department(business_id, branch_id, department_id)
  );

-- Department heads and managers may open their own operations session. PIN
-- staff remain limited to the same branch and, where assigned, department.
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.permission_key = 'operations.open'
  and (r.name ilike '%manager%' or r.name ilike '%supervisor%' or r.name ilike '%head%')
  and coalesce(r.status, 'Active') = 'Active'
on conflict (role_id, permission_id) do nothing;

create or replace function public.verify_staff_operator_pin(p_email text,p_pin text,p_token_hash text)
returns table(profile_id uuid,display_name text,role_name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  session_id_value uuid;
  manager_id uuid;
  manager_business_id uuid;
  manager_branch_id uuid;
  manager_department_id uuid;
  attempt_count integer;
  lock_time timestamptz;
  target_id uuid;
  target_name text;
  target_role text;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'Enter a four-digit PIN'; end if;
  select s.id, m.id, m.business_id, m.branch_id, m.department_id
    into session_id_value, manager_id, manager_business_id, manager_branch_id, manager_department_id
  from public.manager_operations_sessions s
  join public.profiles m on m.id = s.manager_profile_id and m.auth_user_id = auth.uid() and m.active
  where s.token_hash = p_token_hash and s.status = 'open'
  order by s.opened_at desc limit 1 for update of s;
  if session_id_value is null then raise exception 'The manager operations session is closed. Ask the manager to open it again'; end if;
  if manager_business_id is null then raise exception 'Assign the manager to a business before staff can sign in'; end if;

  insert into public.staff_operator_pin_attempts(session_id,staff_email)
  values(session_id_value,lower(trim(p_email))) on conflict do nothing;
  select failed_attempts,locked_until into attempt_count,lock_time
  from public.staff_operator_pin_attempts
  where session_id=session_id_value and staff_email=lower(trim(p_email)) for update;
  if lock_time is not null and lock_time>now() then raise exception 'Too many PIN attempts. Ask the manager to unlock this workstation'; end if;

  select p.id,coalesce(nullif(p.display_name,''),concat_ws(' ',p.first_name,p.last_name),p.email),r.name
    into target_id,target_name,target_role
  from public.profiles p
  join public.roles r on r.id=p.role_id
  join public.staff_operator_pins k on k.profile_id=p.id
  left join public.branches b on b.id=p.branch_id and b.business_id=p.business_id
  where lower(p.email)=lower(trim(p_email))
    and p.active and coalesce(r.status,'Active')='Active'
    and r.name not in ('Customer','Customer Portal User','Super Administrator','Enterprise Manager')
    and p.business_id = manager_business_id
    and (manager_branch_id is null or p.branch_id is not distinct from manager_branch_id)
    and (manager_branch_id is null or coalesce(p.store_manager_profile_id,b.manager_profile_id) = manager_id)
    and (manager_department_id is null or p.department_id is not distinct from manager_department_id)
    and k.pin_hash=extensions.crypt(p_pin,k.pin_hash)
  limit 1;

  if target_id is null then
    update public.staff_operator_pin_attempts set failed_attempts=failed_attempts+1,
      locked_until=case when failed_attempts+1>=5 then now()+interval '15 minutes' else locked_until end,updated_at=now()
    where session_id=session_id_value and staff_email=lower(trim(p_email));
    return;
  end if;

  update public.staff_operator_pin_attempts set failed_attempts=0,locked_until=null,updated_at=now()
  where session_id=session_id_value and staff_email=lower(trim(p_email));
  update public.manager_operations_sessions set active_operator_profile_id=target_id where id=session_id_value;
  return query select target_id,target_name,target_role;
end;
$$;
revoke all on function public.verify_staff_operator_pin(text,text,text) from public;
grant execute on function public.verify_staff_operator_pin(text,text,text) to authenticated;

notify pgrst, 'reload schema';
commit;

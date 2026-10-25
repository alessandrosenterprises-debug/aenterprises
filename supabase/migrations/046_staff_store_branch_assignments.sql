-- Keep staff logins, employee records and branch management assignments aligned.
alter table public.profiles
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists branch_id uuid references public.branches(id) on delete set null,
  add column if not exists store_manager_profile_id uuid references public.profiles(id) on delete set null;

alter table public.employees
  add column if not exists store_manager_profile_id uuid references public.profiles(id) on delete set null;

alter table public.branches
  add column if not exists manager_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists profiles_business_branch_idx on public.profiles(business_id, branch_id);
create index if not exists employees_business_branch_idx on public.employees(business_id, branch_id);
create index if not exists employees_store_manager_idx on public.employees(store_manager_profile_id);

create or replace function public.validate_staff_location_assignment()
returns trigger language plpgsql set search_path = public
as $$
declare selected_business uuid; selected_branch uuid; assigned_manager uuid;
begin
  if tg_table_name = 'branches' then
    selected_business := new.business_id;
    selected_branch := new.id;
    assigned_manager := new.manager_profile_id;
  else
    selected_business := new.business_id;
    selected_branch := new.branch_id;
    assigned_manager := new.store_manager_profile_id;
  end if;

  if selected_branch is not null and not exists (
    select 1 from public.branches b where b.id = selected_branch and b.business_id = selected_business
  ) then
    raise exception 'The selected branch must belong to the selected store';
  end if;

  if assigned_manager is not null and not exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id
    where p.id = assigned_manager and p.active and coalesce(r.status, 'Active') = 'Active'
      and (r.name ilike '%manager%' or r.name ilike '%supervisor%' or r.name = 'Super Administrator')
  ) then
    raise exception 'Choose an active manager or supervisor for this store';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_branch_store_manager on public.branches;
create trigger validate_branch_store_manager before insert or update of business_id, manager_profile_id
on public.branches for each row execute function public.validate_staff_location_assignment();

drop trigger if exists validate_profile_store_assignment on public.profiles;
create trigger validate_profile_store_assignment before insert or update of business_id, branch_id, store_manager_profile_id
on public.profiles for each row execute function public.validate_staff_location_assignment();

drop trigger if exists validate_employee_store_assignment on public.employees;
create trigger validate_employee_store_assignment before insert or update of business_id, branch_id, store_manager_profile_id
on public.employees for each row execute function public.validate_staff_location_assignment();

create or replace function public.sync_employee_staff_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.user_id is not null then
      update public.profiles set business_id = null, branch_id = null, store_manager_profile_id = null
      where auth_user_id = old.user_id;
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id and old.user_id is not null then
    update public.profiles set business_id = null, branch_id = null, store_manager_profile_id = null
    where auth_user_id = old.user_id;
  end if;
  if new.user_id is not null then
    update public.profiles set business_id = new.business_id, branch_id = new.branch_id,
      store_manager_profile_id = new.store_manager_profile_id,
      display_name = new.full_name,
      first_name = nullif(split_part(trim(new.full_name), ' ', 1), ''),
      last_name = nullif(trim(regexp_replace(trim(new.full_name), '^\S+\s*', '')), ''),
      phone = new.phone,
      active = coalesce(new.is_active, true)
    where auth_user_id = new.user_id and (
      business_id is distinct from new.business_id or branch_id is distinct from new.branch_id
      or store_manager_profile_id is distinct from new.store_manager_profile_id
      or display_name is distinct from new.full_name or phone is distinct from new.phone
      or active is distinct from coalesce(new.is_active, true)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sync_employee_staff_assignment on public.employees;
create trigger sync_employee_staff_assignment after insert or update of user_id, business_id, branch_id, store_manager_profile_id or delete
on public.employees for each row execute function public.sync_employee_staff_assignment();

create or replace function public.sync_profile_employee_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.employees set
    business_id = new.business_id,
    branch_id = new.branch_id,
    store_manager_profile_id = new.store_manager_profile_id,
    full_name = coalesce(nullif(new.display_name,''), concat_ws(' ',new.first_name,new.last_name), email),
    phone = new.phone,
    is_active = new.active,
    status = case when new.active then 'Active' else 'Inactive' end
  where user_id = new.auth_user_id and (
    business_id is distinct from new.business_id or branch_id is distinct from new.branch_id
    or store_manager_profile_id is distinct from new.store_manager_profile_id
    or full_name is distinct from coalesce(nullif(new.display_name,''), concat_ws(' ',new.first_name,new.last_name), email)
    or phone is distinct from new.phone
    or is_active is distinct from new.active or status is distinct from case when new.active then 'Active' else 'Inactive' end
  );
  return new;
end;
$$;

drop trigger if exists sync_profile_employee_assignment on public.profiles;
create trigger sync_profile_employee_assignment after update of business_id, branch_id, store_manager_profile_id, display_name, first_name, last_name, phone, role_id, active
on public.profiles for each row execute function public.sync_profile_employee_assignment();

update public.profiles p set business_id = e.business_id, branch_id = e.branch_id,
  store_manager_profile_id = e.store_manager_profile_id
from public.employees e
where e.user_id = p.auth_user_id
  and (p.business_id is distinct from e.business_id or p.branch_id is distinct from e.branch_id
    or p.store_manager_profile_id is distinct from e.store_manager_profile_id);

notify pgrst, 'reload schema';




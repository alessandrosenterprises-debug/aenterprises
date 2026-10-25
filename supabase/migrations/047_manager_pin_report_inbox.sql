create table if not exists public.manager_operations_pin_attempts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.manager_operations_pin_attempts enable row level security;
revoke all on public.manager_operations_pin_attempts from anon, authenticated;

create or replace function public.assert_manager_operations_pin(p_pin text)
returns uuid language plpgsql security definer set search_path = public, extensions
as $$
declare manager_id uuid; lock_time timestamptz; stored_hash text;
begin
  if auth.uid() is null or p_pin !~ '^\d{4}$' then raise exception 'Enter your four-digit manager PIN'; end if;
  select p.id into manager_id
  from public.profiles p
  join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
  join public.role_permissions rp on rp.role_id = r.id
  join public.permissions perm on perm.id = rp.permission_id and perm.permission_key = 'operations.open'
  where p.auth_user_id = auth.uid() and p.active = true limit 1;
  if manager_id is null then raise exception 'Your account cannot open or lock the operations workstation'; end if;
  insert into public.manager_operations_pin_attempts(profile_id) values(manager_id) on conflict do nothing;
  select locked_until into lock_time
  from public.manager_operations_pin_attempts where profile_id = manager_id for update;
  if lock_time is not null and lock_time > now() then raise exception 'Too many PIN attempts. Try again after the lockout period'; end if;
  select pin_hash into stored_hash from public.staff_operator_pins where profile_id = manager_id;
  if stored_hash is null then raise exception 'Create your manager PIN in Staff Management before opening operations'; end if;
  if stored_hash <> extensions.crypt(p_pin, stored_hash) then
    update public.manager_operations_pin_attempts set failed_attempts = failed_attempts + 1,
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end,
      updated_at = now() where profile_id = manager_id;
    return null;
  end if;
  update public.manager_operations_pin_attempts set failed_attempts = 0, locked_until = null, updated_at = now()
  where profile_id = manager_id;
  return manager_id;
end;
$$;
revoke all on function public.assert_manager_operations_pin(text) from public;

drop function if exists public.start_operations_session(text);
create or replace function public.start_operations_session_with_pin(p_token_hash text, p_pin text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare manager_id uuid;
begin
  manager_id := public.assert_manager_operations_pin(p_pin);
  if manager_id is null then return false; end if;
  if p_token_hash is null or length(p_token_hash) <> 64 then raise exception 'Invalid operations session token'; end if;
  update public.manager_operations_sessions set status = 'closed', closed_at = now(), active_operator_profile_id = null
  where manager_profile_id = manager_id and status = 'open';
  insert into public.manager_operations_sessions(manager_profile_id, token_hash) values(manager_id, p_token_hash);
  return true;
end;
$$;
revoke all on function public.start_operations_session_with_pin(text, text) from public;
grant execute on function public.start_operations_session_with_pin(text, text) to authenticated;

drop function if exists public.close_operations_session(text);
create or replace function public.close_operations_session_with_pin(p_token_hash text, p_pin text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare manager_id uuid;
begin
  manager_id := public.assert_manager_operations_pin(p_pin);
  if manager_id is null then return false; end if;
  update public.manager_operations_sessions set status = 'closed', closed_at = now(), active_operator_profile_id = null
  where manager_profile_id = manager_id and token_hash = p_token_hash and status = 'open';
  if not found then raise exception 'The operations session is already locked'; end if;
  return true;
end;
$$;
revoke all on function public.close_operations_session_with_pin(text, text) from public;
grant execute on function public.close_operations_session_with_pin(text, text) to authenticated;

-- Keep report submission available to all staff roles and route incoming reports to departmental leads through AEOS.
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.permission_key = 'reports.submit' and r.name <> 'Customer'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.permission_key = 'reports.review'
  and r.name <> 'Customer'
  and (r.name ilike '%manager%' or r.name ilike '%supervisor%' or r.name ilike '%department head%'
    or r.name ilike '%human resources%' or r.name ilike '%hr %' or r.name ilike '%operations%'
    or r.name ilike '%account%' or r.name ilike '%finance%')
on conflict (role_id, permission_id) do nothing;

notify pgrst, 'reload schema';







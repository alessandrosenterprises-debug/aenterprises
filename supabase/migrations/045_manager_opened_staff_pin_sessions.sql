create extension if not exists pgcrypto with schema extensions;

create table if not exists public.staff_operator_pins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  pin_hash text not null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.staff_operator_pins enable row level security;
revoke all on public.staff_operator_pins from anon, authenticated;

create table if not exists public.manager_operations_sessions (
  id uuid primary key default gen_random_uuid(),
  manager_profile_id uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique,
  active_operator_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists manager_operations_sessions_open_idx on public.manager_operations_sessions(manager_profile_id, status, opened_at desc);
alter table public.manager_operations_sessions enable row level security;
revoke all on public.manager_operations_sessions from anon, authenticated;

create table if not exists public.staff_operator_pin_attempts (
  session_id uuid not null references public.manager_operations_sessions(id) on delete cascade,
  staff_email text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (session_id, staff_email)
);
alter table public.staff_operator_pin_attempts enable row level security;
revoke all on public.staff_operator_pin_attempts from anon, authenticated;

insert into public.permissions(module, action, name, description, permission_key)
values ('operations', 'open', 'Open staff operations session', 'Open a manager-supervised workstation session for staff PIN sign-in.', 'operations.open')
on conflict (module, action) do update set name = excluded.name, description = excluded.description, permission_key = excluded.permission_key;
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.permission_key = 'operations.open' and r.name in ('Super Administrator','Enterprise Manager','Operations Manager','Business Manager','Supervisor')
on conflict (role_id, permission_id) do nothing;

create or replace function public.get_effective_profile_id()
returns uuid language plpgsql stable security definer set search_path = public, extensions
as $$
declare request_token text; effective_id uuid;
begin
  request_token := nullif((current_setting('request.headers', true)::jsonb ->> 'x-aeos-operator-token'), '');
  if request_token is null then
    select p.id into effective_id from public.profiles p where p.auth_user_id = auth.uid() and p.active = true limit 1;
    return effective_id;
  end if;
  select coalesce(s.active_operator_profile_id, s.manager_profile_id) into effective_id
  from public.manager_operations_sessions s
  where s.manager_profile_id = (select p.id from public.profiles p where p.auth_user_id = auth.uid() and p.active = true limit 1)
    and s.token_hash = encode(extensions.digest(request_token, 'sha256'), 'hex') and s.status = 'open'
  order by s.opened_at desc limit 1;
  return effective_id;
end;
$$;
revoke all on function public.get_effective_profile_id() from public;
grant execute on function public.get_effective_profile_id() to authenticated;

create or replace function public.has_permission(required_permission text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
    left join public.role_permissions rp on rp.role_id = r.id left join public.permissions perm on perm.id = rp.permission_id
    where p.id = public.get_effective_profile_id() and p.active = true
      and (r.name = 'Super Administrator' or perm.permission_key = required_permission)
  );
$$;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.is_super_administrator()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p join public.roles r on r.id=p.role_id where p.id=public.get_effective_profile_id() and p.active and r.name='Super Administrator'); $$;
grant execute on function public.is_super_administrator() to authenticated;

create or replace function public.is_configuration_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p join public.roles r on r.id=p.role_id where p.id=public.get_effective_profile_id() and p.active and coalesce(r.status,'Active')='Active' and r.name in ('Super Administrator','Enterprise Manager')); $$;
grant execute on function public.is_configuration_admin() to authenticated;

create or replace function public.get_effective_profile()
returns table(id uuid, auth_user_id uuid, first_name text, last_name text, display_name text, email text, phone text, avatar_url text, role_id uuid, active boolean, role_name text)
language sql stable security definer set search_path = public
as $$ select p.id,p.auth_user_id,p.first_name,p.last_name,p.display_name,p.email,p.phone,p.avatar_url,p.role_id,p.active,r.name from public.profiles p left join public.roles r on r.id=p.role_id where p.id=public.get_effective_profile_id() and p.active; $$;
grant execute on function public.get_effective_profile() to authenticated;

create or replace function public.reset_staff_operator_pin(p_profile_id uuid,p_pin text)
returns void language plpgsql security definer set search_path = public, extensions
as $$
declare manager_id uuid;
begin
  if auth.uid() is null or not public.has_permission('access.assign_staff') then raise exception 'Staff account management permission is required'; end if;
  if p_pin !~ '^\d{4}$' then raise exception 'Choose a four-digit PIN'; end if;
  select id into manager_id from public.profiles where auth_user_id=auth.uid() and active limit 1;
  if not exists(select 1 from public.profiles p join public.roles r on r.id=p.role_id where p.id=p_profile_id and p.active and r.name <> 'Customer') then raise exception 'Choose an active staff account'; end if;
  insert into public.staff_operator_pins(profile_id,pin_hash,updated_by_profile_id)
  values(p_profile_id,extensions.crypt(p_pin,extensions.gen_salt('bf',12)),manager_id)
  on conflict(profile_id) do update set pin_hash=excluded.pin_hash,updated_by_profile_id=manager_id,updated_at=now();
end;
$$;
revoke all on function public.reset_staff_operator_pin(uuid,text) from public;
grant execute on function public.reset_staff_operator_pin(uuid,text) to authenticated;

create or replace function public.start_operations_session(p_token_hash text)
returns void language plpgsql security definer set search_path = public
as $$
declare manager_id uuid;
begin
  if auth.uid() is null or not exists(
    select 1 from public.profiles p join public.roles r on r.id=p.role_id
    join public.role_permissions rp on rp.role_id=r.id join public.permissions perm on perm.id=rp.permission_id
    where p.auth_user_id=auth.uid() and p.active and coalesce(r.status,'Active')='Active'
      and perm.permission_key='operations.open'
  ) then raise exception 'Your role cannot open a staff operations session'; end if;
  if p_token_hash is null or length(p_token_hash) <> 64 then raise exception 'Invalid operations session token'; end if;
  select id into manager_id from public.profiles where auth_user_id=auth.uid() and active limit 1;
  if manager_id is null then raise exception 'Active manager profile not found'; end if;
  update public.manager_operations_sessions set status='closed',closed_at=now() where manager_profile_id=manager_id and status='open';
  insert into public.manager_operations_sessions(manager_profile_id,token_hash) values(manager_id,p_token_hash);
end;
$$;
revoke all on function public.start_operations_session(text) from public;
grant execute on function public.start_operations_session(text) to authenticated;

create or replace function public.verify_staff_operator_pin(p_email text,p_pin text,p_token_hash text)
returns table(profile_id uuid,display_name text,role_name text) language plpgsql security definer set search_path = public, extensions
as $$
declare session_id_value uuid; attempt_count integer; lock_time timestamptz; target_id uuid; target_name text; target_role text;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'Enter a four-digit PIN'; end if;
  select s.id into session_id_value from public.manager_operations_sessions s
  where s.manager_profile_id=(select p.id from public.profiles p where p.auth_user_id=auth.uid() and p.active limit 1)
    and s.token_hash=p_token_hash and s.status='open' limit 1 for update;
  if session_id_value is null then raise exception 'The manager operations session is closed. Ask the manager to open it again'; end if;
  insert into public.staff_operator_pin_attempts(session_id,staff_email) values(session_id_value,lower(trim(p_email))) on conflict do nothing;
  select failed_attempts,locked_until into attempt_count,lock_time from public.staff_operator_pin_attempts where session_id=session_id_value and staff_email=lower(trim(p_email)) for update;
  if lock_time is not null and lock_time>now() then raise exception 'Too many PIN attempts. Ask the manager to unlock this workstation'; end if;
  select p.id,coalesce(nullif(p.display_name,''),concat_ws(' ',p.first_name,p.last_name),p.email),r.name
    into target_id,target_name,target_role
  from public.profiles p join public.roles r on r.id=p.role_id join public.staff_operator_pins k on k.profile_id=p.id
  where lower(p.email)=lower(trim(p_email)) and p.active and r.name <> 'Customer' and coalesce(r.status,'Active')='Active'
    and k.pin_hash=extensions.crypt(p_pin,k.pin_hash) limit 1;
  if target_id is null then
    update public.staff_operator_pin_attempts set failed_attempts=failed_attempts+1,
      locked_until=case when failed_attempts+1>=5 then now()+interval '15 minutes' else locked_until end,updated_at=now()
    where session_id=session_id_value and staff_email=lower(trim(p_email));
    return;
  end if;
  update public.staff_operator_pin_attempts set failed_attempts=0,locked_until=null,updated_at=now() where session_id=session_id_value and staff_email=lower(trim(p_email));
  update public.manager_operations_sessions set active_operator_profile_id=target_id where id=session_id_value;
  return query select target_id,target_name,target_role;
end;
$$;
revoke all on function public.verify_staff_operator_pin(text,text,text) from public;
grant execute on function public.verify_staff_operator_pin(text,text,text) to authenticated;

create or replace function public.end_staff_operator_session(p_token_hash text)
returns void language sql security definer set search_path=public
as $$ update public.manager_operations_sessions set active_operator_profile_id=null where manager_profile_id=(select id from public.profiles where auth_user_id=auth.uid() and active limit 1) and token_hash=p_token_hash and status='open'; $$;
revoke all on function public.end_staff_operator_session(text) from public;
grant execute on function public.end_staff_operator_session(text) to authenticated;

create or replace function public.get_operations_context(p_token_hash text)
returns table(manager_name text, active_operator_profile_id uuid, operator_name text, operator_role text)
language sql stable security definer set search_path=public
as $$
  select coalesce(nullif(m.display_name,''), concat_ws(' ',m.first_name,m.last_name), m.email),
    s.active_operator_profile_id,
    coalesce(nullif(o.display_name,''), concat_ws(' ',o.first_name,o.last_name), o.email),
    ro.name
  from public.manager_operations_sessions s
  join public.profiles m on m.id=s.manager_profile_id and m.auth_user_id=auth.uid() and m.active
  left join public.profiles o on o.id=s.active_operator_profile_id and o.active
  left join public.roles ro on ro.id=o.role_id
  where s.token_hash=p_token_hash and s.status='open'
  order by s.opened_at desc limit 1;
$$;
revoke all on function public.get_operations_context(text) from public;
grant execute on function public.get_operations_context(text) to authenticated;

create or replace function public.close_operations_session(p_token_hash text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not exists(
    select 1 from public.profiles p join public.roles r on r.id=p.role_id
    join public.role_permissions rp on rp.role_id=r.id join public.permissions perm on perm.id=rp.permission_id
    where p.auth_user_id=auth.uid() and p.active and coalesce(r.status,'Active')='Active'
      and perm.permission_key='operations.open'
  ) then raise exception 'Manager permission is required to close operations'; end if;
  update public.manager_operations_sessions set status='closed',closed_at=now(),active_operator_profile_id=null
  where manager_profile_id=(select id from public.profiles where auth_user_id=auth.uid() and active limit 1) and token_hash=p_token_hash and status='open';
  if not found then raise exception 'The operations session is already closed'; end if;
end;
$$;
revoke all on function public.close_operations_session(text) from public;
grant execute on function public.close_operations_session(text) to authenticated;

drop policy if exists "Staff can read own role permissions" on public.role_permissions;
create policy "Staff can read effective role permissions" on public.role_permissions for select to authenticated
using (role_id=(select p.role_id from public.profiles p where p.id=public.get_effective_profile_id() and p.active limit 1));

notify pgrst, 'reload schema';

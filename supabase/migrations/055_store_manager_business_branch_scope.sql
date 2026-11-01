begin;

-- Store managers and staff signed in under their session inherit one exact
-- business + branch. Enterprise and department roles keep their existing rules.
create or replace function public.get_current_store_scope()
returns table(store_scoped boolean, business_id uuid, branch_id uuid)
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  request_token text;
  actor_id uuid;
  scope_profile_id uuid;
  scope_business_id uuid;
  scope_branch_id uuid;
  scope_role text;
  valid_store_assignment boolean;
begin
  request_token := nullif((current_setting('request.headers', true)::jsonb ->> 'x-aeos-operator-token'), '');
  actor_id := public.get_effective_profile_id();
  if actor_id is null then return query select false, null::uuid, null::uuid; return; end if;

  if request_token is not null then
    select s.manager_profile_id into scope_profile_id
    from public.manager_operations_sessions s
    join public.profiles manager on manager.id=s.manager_profile_id and manager.auth_user_id=auth.uid() and manager.active
    where s.token_hash=encode(extensions.digest(request_token,'sha256'),'hex') and s.status='open'
    order by s.opened_at desc limit 1;
  end if;
  scope_profile_id := coalesce(scope_profile_id, actor_id);

  select p.business_id,p.branch_id,r.name
    into scope_business_id,scope_branch_id,scope_role
  from public.profiles p left join public.roles r on r.id=p.role_id
  where p.id=scope_profile_id and p.active=true;

  if scope_role in ('Business Manager','Store Manager','Branch Manager') then
    select exists (
      select 1 from public.branches b
      where b.id=scope_branch_id and b.business_id=scope_business_id and b.active=true
    ) into valid_store_assignment;
    -- A store manager without a valid branch remains scoped, but to no data.
    -- Never fall back to the wider business or enterprise scope.
    if not coalesce(valid_store_assignment,false) then
      return query select true,null::uuid,null::uuid;
      return;
    end if;
    return query select true,scope_business_id,scope_branch_id;
  else
    return query select false,null::uuid,null::uuid;
  end if;
end;
$$;
revoke all on function public.get_current_store_scope() from public;
grant execute on function public.get_current_store_scope() to authenticated;

-- Keep existing role permissions intact for enterprise and department staff,
-- while placing a hard permission ceiling on a store-scoped session. The
-- current PIN operator still needs the permission on their own role.
create or replace function public.has_permission(required_permission text)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare scoped boolean;
begin
  select s.store_scoped into scoped from public.get_current_store_scope() s;
  if scoped then
    if required_permission not in (
      'dashboard.view','businesses.view','bookings.view','bookings.manage','orders.view','orders.manage',
      'deliveries.manage','reports.view','reports.submit','reports.review','customers.view',
      'communications.manage','stock.view','stock.manage','stock.purchase','stock.count','operations.open'
    ) then return false; end if;
    return exists (
      select 1 from public.profiles p
      join public.roles r on r.id=p.role_id and coalesce(r.status,'Active')='Active'
      join public.role_permissions rp on rp.role_id=r.id
      join public.permissions perm on perm.id=rp.permission_id
      where p.id=public.get_effective_profile_id() and p.active=true
        and perm.permission_key=required_permission
    );
  end if;
  return exists (
    select 1 from public.profiles p
    join public.roles r on r.id=p.role_id and coalesce(r.status,'Active')='Active'
    left join public.role_permissions rp on rp.role_id=r.id
    left join public.permissions perm on perm.id=rp.permission_id
    where p.id=public.get_effective_profile_id() and p.active=true
      and (r.name='Super Administrator' or perm.permission_key=required_permission)
  );
end;
$$;
revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.can_access_business(p_business_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare scoped boolean; scoped_business uuid; scoped_branch uuid;
begin
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch from public.get_current_store_scope() s;
  if scoped then return scoped_business is not null and scoped_branch is not null and p_business_id is not distinct from scoped_business; end if;
  if exists (select 1 from public.customers c where c.auth_user_id=auth.uid() and c.is_active=true and lower(c.status)='active') then return true; end if;
  return exists (
    select 1 from public.profiles p left join public.roles r on r.id=p.role_id
    where p.id=public.get_effective_profile_id() and p.active
      and (r.name in ('Super Administrator','Enterprise Manager') or p.business_id is not distinct from p_business_id)
  );
end;
$$;
revoke all on function public.can_access_business(uuid) from public;
grant execute on function public.can_access_business(uuid) to authenticated;

create or replace function public.can_access_branch(p_business_id uuid,p_branch_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare scoped boolean; scoped_business uuid; scoped_branch uuid; viewer_business uuid; viewer_branch uuid; viewer_role text;
begin
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch from public.get_current_store_scope() s;
  if scoped then
    return scoped_business is not null and scoped_branch is not null
      and p_business_id is not distinct from scoped_business
      and p_branch_id is not null and p_branch_id is not distinct from scoped_branch;
  end if;
  if exists (select 1 from public.customers c where c.auth_user_id=auth.uid() and c.is_active=true and lower(c.status)='active') then return true; end if;
  select p.business_id,p.branch_id,r.name into viewer_business,viewer_branch,viewer_role
  from public.profiles p left join public.roles r on r.id=p.role_id
  where p.id=public.get_effective_profile_id() and p.active;
  if viewer_role in ('Super Administrator','Enterprise Manager') then return true; end if;
  if p_business_id is null or viewer_business is distinct from p_business_id then return false; end if;
  return viewer_branch is null or p_branch_id is null or viewer_branch is not distinct from p_branch_id;
end;
$$;
revoke all on function public.can_access_branch(uuid,uuid) from public;
grant execute on function public.can_access_branch(uuid,uuid) to authenticated;

-- Store managers see customer identities only through activity at their exact
-- location. Customer records without branch-linked activity stay private.
create or replace function public.can_access_customer_record(p_customer_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare scoped boolean; scoped_business uuid; scoped_branch uuid;
begin
  if exists (select 1 from public.customers c where c.id=p_customer_id and c.auth_user_id=auth.uid() and c.is_active=true and lower(c.status)='active') then return true; end if;
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch from public.get_current_store_scope() s;
  if scoped then
    if scoped_business is null or scoped_branch is null then return false; end if;
    return exists (select 1 from public.bookings b where b.customer_id=p_customer_id and b.business_id=scoped_business and b.branch_id=scoped_branch)
      or exists (select 1 from public.orders o where o.customer_id=p_customer_id and o.business_id=scoped_business and o.store_branch_id=scoped_branch)
      or exists (select 1 from public.customer_loan_applications a where a.customer_id=p_customer_id and a.business_id=scoped_business and a.branch_id=scoped_branch)
      or exists (select 1 from public.technology_consultation_requests t where t.customer_id=p_customer_id and t.business_id=scoped_business and t.branch_id=scoped_branch)
      or exists (select 1 from public.messages m where m.customer_id=p_customer_id and m.business_id=scoped_business and m.branch_id=scoped_branch);
  end if;
  return exists (
    select 1 from public.profiles p left join public.roles r on r.id=p.role_id
    where p.id=public.get_effective_profile_id() and p.active
      and (r.name in ('Super Administrator','Enterprise Manager')
        or (p.business_id is not null and exists(select 1 from public.customers c where c.id=p_customer_id and c.business_id=p.business_id)))
  );
end;
$$;
revoke all on function public.can_access_customer_record(uuid) from public;
grant execute on function public.can_access_customer_record(uuid) to authenticated;

-- Store managers can work with all staff assigned to their store. Department
-- heads retain the current same-department rule.
create or replace function public.can_access_staff_department(p_business_id uuid,p_branch_id uuid,p_department_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare viewer_id uuid; viewer_department_id uuid; viewer_role text; scoped boolean; scoped_business uuid; scoped_branch uuid;
begin
  viewer_id := public.get_effective_profile_id();
  if viewer_id is null then return false; end if;
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch from public.get_current_store_scope() s;
  if scoped then
    return scoped_business is not null and scoped_branch is not null
      and p_business_id is not distinct from scoped_business and p_branch_id is not null
      and p_branch_id is not distinct from scoped_branch;
  end if;
  select p.department_id,r.name into viewer_department_id,viewer_role
  from public.profiles p left join public.roles r on r.id=p.role_id
  where p.id=viewer_id and p.active;
  if not found then return false; end if;
  if viewer_role in ('Super Administrator','Enterprise Manager') or public.has_permission('access.super_admin') then return true; end if;
  return p_department_id is not null and viewer_department_id is not distinct from p_department_id
    and public.can_access_business(p_business_id) and public.can_access_branch(p_business_id,p_branch_id);
end;
$$;
revoke all on function public.can_access_staff_department(uuid,uuid,uuid) from public;
grant execute on function public.can_access_staff_department(uuid,uuid,uuid) to authenticated;

-- Store managers cannot open an unrestricted workstation with a missing or
-- invalid branch assignment. Department heads keep their existing open flow.
create or replace function public.start_operations_session_with_pin(p_token_hash text,p_pin text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare manager_id uuid; manager_business uuid; manager_branch uuid; manager_role text;
begin
  manager_id := public.assert_manager_operations_pin(p_pin);
  if manager_id is null then return false; end if;
  select p.business_id,p.branch_id,r.name into manager_business,manager_branch,manager_role
  from public.profiles p join public.roles r on r.id=p.role_id where p.id=manager_id and p.active;
  if manager_role in ('Business Manager','Store Manager','Branch Manager') and (
    manager_business is null or manager_branch is null or not exists(
      select 1 from public.branches b where b.id=manager_branch and b.business_id=manager_business
    )
  ) then raise exception 'Assign this manager to a business and store before opening operations'; end if;
  if p_token_hash is null or length(p_token_hash)<>64 then raise exception 'Invalid operations session token'; end if;
  update public.manager_operations_sessions set status='closed',closed_at=now(),active_operator_profile_id=null
  where manager_profile_id=manager_id and status='open';
  insert into public.manager_operations_sessions(manager_profile_id,token_hash) values(manager_id,p_token_hash);
  return true;
end;
$$;
revoke all on function public.start_operations_session_with_pin(text,text) from public;
grant execute on function public.start_operations_session_with_pin(text,text) to authenticated;

-- PIN staff in a store manager's session inherit the exact same business and
-- branch, and may be assigned to any department within that store.
create or replace function public.verify_staff_operator_pin(p_email text,p_pin text,p_token_hash text)
returns table(profile_id uuid,display_name text,role_name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  session_id_value uuid; manager_id uuid; manager_business_id uuid; manager_branch_id uuid;
  manager_department_id uuid; manager_role text; store_manager boolean;
  attempt_count integer; lock_time timestamptz; target_id uuid; target_name text; target_role text;
begin
  if p_pin !~ '^[0-9]{4}$' then raise exception 'Enter a four-digit PIN'; end if;
  select s.id,m.id,m.business_id,m.branch_id,m.department_id,r.name
    into session_id_value,manager_id,manager_business_id,manager_branch_id,manager_department_id,manager_role
  from public.manager_operations_sessions s
  join public.profiles m on m.id=s.manager_profile_id and m.auth_user_id=auth.uid() and m.active
  join public.roles r on r.id=m.role_id
  where s.token_hash=p_token_hash and s.status='open' order by s.opened_at desc limit 1 for update of s;
  if session_id_value is null then raise exception 'The manager operations session is closed. Ask the manager to open it again'; end if;
  store_manager := manager_role in ('Business Manager','Store Manager','Branch Manager');
  if manager_business_id is null or (store_manager and manager_branch_id is null) then raise exception 'Assign the manager to a business and store before staff can sign in'; end if;
  if p_email is null or trim(p_email)='' then raise exception 'Enter your work email'; end if;

  insert into public.staff_operator_pin_attempts(session_id,staff_email) values(session_id_value,lower(trim(p_email))) on conflict do nothing;
  select failed_attempts,locked_until into attempt_count,lock_time from public.staff_operator_pin_attempts
  where session_id=session_id_value and staff_email=lower(trim(p_email)) for update;
  if lock_time is not null and lock_time>now() then raise exception 'Too many PIN attempts. Ask the manager to unlock this workstation'; end if;

  select p.id,coalesce(nullif(p.display_name,''),concat_ws(' ',p.first_name,p.last_name),p.email),r.name
    into target_id,target_name,target_role
  from public.profiles p join public.roles r on r.id=p.role_id join public.staff_operator_pins k on k.profile_id=p.id
  left join public.branches b on b.id=p.branch_id and b.business_id=p.business_id
  where lower(p.email)=lower(trim(p_email)) and p.active and coalesce(r.status,'Active')='Active'
    and r.name not in ('Customer','Customer Portal User','Super Administrator','Enterprise Manager')
    and p.business_id=manager_business_id
    and (not store_manager or p.branch_id is not distinct from manager_branch_id)
    and (manager_branch_id is null or p.branch_id is not distinct from manager_branch_id)
    and (manager_branch_id is null or coalesce(p.store_manager_profile_id,b.manager_profile_id)=manager_id)
    and (store_manager or manager_department_id is null or p.department_id is not distinct from manager_department_id)
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

-- Store-aware customer communications. Existing unassigned records are not
-- exposed across branches; new customer requests must identify a branch.
alter table public.technology_consultation_requests add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.messages add column if not exists branch_id uuid references public.branches(id) on delete set null;
create index if not exists technology_consultations_branch_idx on public.technology_consultation_requests(business_id,branch_id,created_at desc);
create index if not exists messages_business_branch_idx on public.messages(business_id,branch_id,created_at desc);

create or replace function public.validate_store_scoped_consultation()
returns trigger language plpgsql security definer set search_path = public
as $$
declare scoped boolean; scoped_business uuid; scoped_branch uuid;
begin
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch from public.get_current_store_scope() s;
  if scoped then
    if scoped_business is null or scoped_branch is null then raise exception 'Assign this manager to a business and store before handling consultations'; end if;
    if new.business_id is distinct from scoped_business or new.branch_id is distinct from scoped_branch then raise exception 'This request belongs to a different store'; end if;
  elsif new.branch_id is not null and not exists(select 1 from public.branches b where b.id=new.branch_id and b.business_id=new.business_id) then
    raise exception 'Choose a branch belonging to the selected business';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_store_scoped_consultation on public.technology_consultation_requests;
create trigger validate_store_scoped_consultation before insert or update of business_id,branch_id
on public.technology_consultation_requests for each row execute function public.validate_store_scoped_consultation();

drop policy if exists aeos_consultation_store_scope on public.technology_consultation_requests;
create policy aeos_consultation_store_scope on public.technology_consultation_requests as restrictive
for all to authenticated using (public.can_access_business(business_id) and public.can_access_branch(business_id,branch_id))
with check (public.can_access_business(business_id) and public.can_access_branch(business_id,branch_id));
drop policy if exists "Store staff can read consultations" on public.technology_consultation_requests;
create policy "Store staff can read consultations" on public.technology_consultation_requests
for select to authenticated using (public.has_permission('businesses.view') or public.has_permission('communications.manage'));
drop policy if exists "Store staff can update consultations" on public.technology_consultation_requests;
create policy "Store staff can update consultations" on public.technology_consultation_requests
for update to authenticated using (public.has_permission('businesses.view') or public.has_permission('communications.manage'))
with check (public.has_permission('businesses.view') or public.has_permission('communications.manage'));

drop policy if exists aeos_message_store_scope on public.messages;
create policy aeos_message_store_scope on public.messages as restrictive for all to authenticated
using (
  case when (select s.store_scoped from public.get_current_store_scope() s)
    then public.can_access_business(business_id) and public.can_access_branch(business_id,branch_id)
    else true end
)
with check (
  case when (select s.store_scoped from public.get_current_store_scope() s)
    then public.can_access_business(business_id) and public.can_access_branch(business_id,branch_id)
    else true end
);

-- Enterprise email records have no branch ownership field. Keep that central
-- mailbox out of store workspaces instead of exposing another branch's mail.
drop policy if exists aeos_store_email_scope on public.emails;
create policy aeos_store_email_scope on public.emails as restrictive for all to authenticated
using (not exists (select 1 from public.get_current_store_scope() s where s.store_scoped))
with check (not exists (select 1 from public.get_current_store_scope() s where s.store_scoped));

-- The report inbox has no branch columns, so restrict it through the staff
-- member who submitted each report. Department and enterprise reviewers keep
-- their existing visibility; store-scoped managers only see their own store's
-- submissions, including when they try to review a report by its ID.
create or replace function public.can_access_store_reporter(p_reporter_profile_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare scoped boolean; scoped_business uuid; scoped_branch uuid;
begin
  select s.store_scoped,s.business_id,s.branch_id into scoped,scoped_business,scoped_branch
  from public.get_current_store_scope() s;
  if not scoped then return true; end if;
  if scoped_business is null or scoped_branch is null then return false; end if;
  return exists (
    select 1 from public.profiles p
    where p.id=p_reporter_profile_id and p.active
      and p.business_id is not distinct from scoped_business
      and p.branch_id is not null and p.branch_id is not distinct from scoped_branch
  );
end;
$$;
revoke all on function public.can_access_store_reporter(uuid) from public;
grant execute on function public.can_access_store_reporter(uuid) to authenticated;

drop policy if exists aeos_store_report_scope on public.enterprise_reports;
create policy aeos_store_report_scope on public.enterprise_reports as restrictive
for all to authenticated
using (public.can_access_store_reporter(reporter_profile_id))
with check (public.can_access_store_reporter(reporter_profile_id));

create or replace function public.review_enterprise_report(
  p_report_id uuid,
  p_status text,
  p_note text default null
)
returns void language plpgsql security definer set search_path = public
as $$
declare reviewer_id uuid; reporter_id uuid;
begin
  if auth.uid() is null or not public.has_permission('reports.review') then
    raise exception 'Department report review permission is required';
  end if;
  if p_status not in ('In review', 'Returned', 'Resolved') then
    raise exception 'Choose a valid report status';
  end if;
  if p_status in ('Returned', 'Resolved') and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'Add a review note before returning or resolving this report';
  end if;
  select r.reporter_profile_id into reporter_id from public.enterprise_reports r where r.id=p_report_id;
  if reporter_id is null or not public.can_access_store_reporter(reporter_id) then
    raise exception 'This report is outside your assigned store';
  end if;
  select id into reviewer_id from public.profiles where auth_user_id=auth.uid() and active=true limit 1;
  if reviewer_id is null then raise exception 'Active reviewer profile not found'; end if;
  update public.enterprise_reports
  set status=p_status, reviewed_by_profile_id=reviewer_id,
      review_note=nullif(trim(coalesce(p_note,'')),''), reviewed_at=now(), updated_at=now()
  where id=p_report_id and status in ('Submitted','In review','Returned');
  if not found then raise exception 'This report is no longer available for review'; end if;
end;
$$;
revoke all on function public.review_enterprise_report(uuid,text,text) from public;
grant execute on function public.review_enterprise_report(uuid,text,text) to authenticated;

-- A store manager role has a practical store-level workspace. These grants do
-- not include enterprise HR, Accounts, configuration, or administration.
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.permission_key in (
  'dashboard.view','businesses.view','bookings.view','bookings.manage','orders.view','orders.manage',
  'deliveries.manage','reports.view','reports.submit','reports.review','customers.view','communications.manage',
  'stock.view','stock.manage','stock.purchase','stock.count','operations.open'
)
where r.name in ('Business Manager','Store Manager','Branch Manager') and coalesce(r.status,'Active')='Active'
on conflict(role_id,permission_id) do nothing;

-- Remove previously assigned enterprise permissions from these store roles.
-- Safe operational permissions above remain, and RLS still enforces the exact
-- business and branch on every branch-owned record.
delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id=r.id and rp.permission_id=p.id
  and r.name in ('Business Manager','Store Manager','Branch Manager')
  and p.permission_key not in (
    'dashboard.view','businesses.view','bookings.view','bookings.manage','orders.view','orders.manage',
    'deliveries.manage','reports.view','reports.submit','reports.review','customers.view','communications.manage',
    'stock.view','stock.manage','stock.purchase','stock.count','operations.open'
  );

-- The product/service catalog is enterprise-wide shared content, not a store
-- inventory. Prevent store managers from changing offerings for other stores;
-- branch stock remains fully manageable through the location-scoped stock tools.
delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id=r.id and rp.permission_id=p.id
  and r.name in ('Business Manager','Store Manager','Branch Manager')
  and p.permission_key='products.manage';

notify pgrst,'reload schema';
commit;

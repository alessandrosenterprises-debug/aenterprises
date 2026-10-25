begin;

-- Loan requests need an explicit business location because loan products are
-- enterprise-wide configuration records and customer accounts may be global.
alter table public.customer_loan_applications
  add column if not exists business_id uuid references public.businesses(id) on delete restrict,
  add column if not exists branch_id uuid references public.branches(id) on delete set null;

update public.customer_loan_applications application
set business_id = coalesce(
  application.business_id,
  customer.business_id,
  (select id from public.businesses where slug = 'soft-loans' limit 1)
)
from public.customers customer
where customer.id = application.customer_id and application.business_id is null;

create or replace function public.assign_customer_loan_location()
returns trigger language plpgsql security definer set search_path = public
as $$
declare operator_business_id uuid; operator_branch_id uuid; operator_role text;
begin
  select p.business_id, p.branch_id, r.name into operator_business_id, operator_branch_id, operator_role
  from public.profiles p left join public.roles r on r.id=p.role_id
  where p.id = public.get_effective_profile_id() and p.active;

  if operator_role in ('Customer','Customer Portal User') then
    select coalesce(customer.business_id, soft_loans.id) into new.business_id
    from public.customers customer
    left join public.businesses soft_loans on soft_loans.slug='soft-loans'
    where customer.id=new.customer_id;
    new.branch_id := null;
  elsif operator_business_id is not null then
    new.business_id := operator_business_id;
    new.branch_id := operator_branch_id;
  else
    if new.business_id is null then
      select c.business_id into new.business_id from public.customers c where c.id = new.customer_id;
    end if;
    if new.business_id is null then
      select b.id into new.business_id from public.businesses b where b.slug = 'soft-loans' limit 1;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_customer_loan_location on public.customer_loan_applications;
create trigger assign_customer_loan_location
before insert or update of customer_id, business_id, branch_id
on public.customer_loan_applications for each row
execute function public.assign_customer_loan_location();

-- Resolve effective operator location without exposing profile rows to policy checks.
create or replace function public.can_access_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select case
    when exists (
      select 1 from public.customers c
      where c.auth_user_id = auth.uid() and c.is_active = true and lower(c.status) = 'active'
    ) then true
    when r.name in ('Super Administrator', 'Enterprise Manager', 'Customer', 'Customer Portal User') then true
    when p_business_id is null then false
    else p.business_id = p_business_id
  end
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = public.get_effective_profile_id() and p.active
  limit 1;
$$;
revoke all on function public.can_access_business(uuid) from public;
grant execute on function public.can_access_business(uuid) to authenticated;

create or replace function public.can_access_branch(p_business_id uuid, p_branch_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select case
    when exists (
      select 1 from public.customers c
      where c.auth_user_id = auth.uid() and c.is_active = true and lower(c.status) = 'active'
    ) then true
    when r.name in ('Super Administrator', 'Enterprise Manager', 'Customer', 'Customer Portal User') then true
    when p_business_id is null then false
    when p.business_id is distinct from p_business_id then false
    -- A business-level manager can oversee every branch in their business;
    -- a branch-assigned manager/operator stays within that exact branch.
    when p.branch_id is null then true
    else p_branch_id is null or p.branch_id is not distinct from p_branch_id
  end
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = public.get_effective_profile_id() and p.active
  limit 1;
$$;
revoke all on function public.can_access_branch(uuid, uuid) from public;
grant execute on function public.can_access_branch(uuid, uuid) to authenticated;

create or replace function public.can_access_branch_id(p_branch_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select p_branch_id is not null and exists (
    select 1 from public.branches b
    where b.id = p_branch_id and public.can_access_branch(b.business_id, b.id)
  );
$$;
revoke all on function public.can_access_branch_id(uuid) from public;
grant execute on function public.can_access_branch_id(uuid) to authenticated;

-- Global customer identities remain available to their owner and to staff
-- who can see a same-business customer or a same-business transaction for it.
create or replace function public.can_access_customer_record(p_customer_id uuid)
returns boolean language plpgsql stable security definer set search_path = public
as $$
declare viewer_business_id uuid; viewer_branch_id uuid; viewer_role text;
begin
  if exists (
    select 1 from public.customers own_customer
    where own_customer.id=p_customer_id and own_customer.auth_user_id=auth.uid()
      and own_customer.is_active=true and lower(own_customer.status)='active'
  ) then return true; end if;

  select p.business_id,p.branch_id,r.name into viewer_business_id,viewer_branch_id,viewer_role
  from public.profiles p left join public.roles r on r.id=p.role_id
  where p.id=public.get_effective_profile_id() and p.active;
  if viewer_role in ('Super Administrator','Enterprise Manager') then return true; end if;
  if viewer_business_id is null or viewer_role in ('Customer','Customer Portal User') then return false; end if;

  return exists (
    select 1 from public.customers customer
    where customer.id=p_customer_id and customer.business_id=viewer_business_id
  ) or exists (
    select 1 from public.customer_loan_applications application
    where application.customer_id=p_customer_id and application.business_id=viewer_business_id
      and (viewer_branch_id is null or application.branch_id is null or application.branch_id=viewer_branch_id)
  ) or exists (
    select 1 from public.orders order_row
    where order_row.customer_id=p_customer_id and order_row.business_id=viewer_business_id
      and (viewer_branch_id is null or order_row.store_branch_id is null or order_row.store_branch_id=viewer_branch_id)
  ) or exists (
    select 1 from public.bookings booking
    where booking.customer_id=p_customer_id and booking.business_id=viewer_business_id
      and (viewer_branch_id is null or booking.branch_id is null or booking.branch_id=viewer_branch_id)
  );
end;
$$;
revoke all on function public.can_access_customer_record(uuid) from public;
grant execute on function public.can_access_customer_record(uuid) to authenticated;

-- Managers and team leads need to see the location assignments for their
-- own operation and coworkers for handover/reporting. The restrictive scope
-- policy below still limits these rows to their assigned business/branch.
alter table public.branches enable row level security;
alter table public.customers enable row level security;
drop policy if exists "Authorized staff and customer can read customer records" on public.customers;
create policy "Authorized staff and customer can read customer records" on public.customers
  for select to authenticated
  using (
    auth.uid() = auth_user_id
    or public.has_permission('customers.view')
    or public.has_permission('customers.manage')
    or public.has_permission('orders.view')
    or public.has_permission('orders.manage')
    or public.has_permission('bookings.view')
    or public.has_permission('bookings.manage')
    or public.has_permission('loans.approve')
    or public.has_permission('deliveries.manage')
    or public.has_permission('communications.manage')
  );
drop policy if exists "Authorized staff can create customer records" on public.customers;
create policy "Authorized staff can create customer records" on public.customers
  for insert to authenticated
  with check (
    public.has_permission('customers.manage')
    or public.has_permission('orders.manage')
  );
drop policy if exists "Authorized staff can update customer records" on public.customers;
create policy "Authorized staff can update customer records" on public.customers
  for update to authenticated
  using (public.has_permission('customers.manage'))
  with check (public.has_permission('customers.manage'));
drop policy if exists "Authorized staff can delete customer records" on public.customers;
create policy "Authorized staff can delete customer records" on public.customers
  for delete to authenticated
  using (public.has_permission('customers.manage'));
drop policy if exists aeos_customer_location_scope on public.customers;
create policy aeos_customer_location_scope on public.customers as restrictive
  for all to authenticated
  using (public.can_access_customer_record(id))
  with check (public.can_access_business(business_id));

drop policy if exists "Authorized staff can read assigned branches" on public.branches;
create policy "Authorized staff can read assigned branches" on public.branches
  for select to authenticated
  using (
    public.has_permission('dashboard.view')
    or public.has_permission('businesses.view')
    or public.has_permission('employees.view')
    or public.has_permission('employees.manage')
    or public.has_permission('operations.open')
    or exists (
      select 1 from public.customers c
      where c.auth_user_id = auth.uid() and c.is_active = true and lower(c.status) = 'active'
    )
  );
drop policy if exists "Authorized administrators can manage branches" on public.branches;
create policy "Authorized administrators can manage branches" on public.branches
  for all to authenticated
  using (public.has_permission('businesses.manage') or public.has_permission('access.assign_staff'))
  with check (public.has_permission('businesses.manage') or public.has_permission('access.assign_staff'));

drop policy if exists "Authorized staff can read assigned coworker profiles" on public.profiles;
create policy "Authorized staff can read assigned coworker profiles" on public.profiles
  for select to authenticated
  using (
    (public.has_permission('employees.view') or public.has_permission('employees.manage') or public.has_permission('operations.open'))
    and public.can_access_business(business_id)
    and public.can_access_branch(business_id, branch_id)
  );

-- Limit PIN sign-in to staff assigned to the manager who opened this session.
create or replace function public.verify_staff_operator_pin(p_email text,p_pin text,p_token_hash text)
returns table(profile_id uuid,display_name text,role_name text)
language plpgsql security definer set search_path = public, extensions
as $$
declare
  session_id_value uuid;
  manager_id uuid;
  manager_business_id uuid;
  manager_branch_id uuid;
  attempt_count integer;
  lock_time timestamptz;
  target_id uuid;
  target_name text;
  target_role text;
begin
  if p_pin !~ '^\d{4}$' then raise exception 'Enter a four-digit PIN'; end if;
  select s.id, m.id, m.business_id, m.branch_id
    into session_id_value, manager_id, manager_business_id, manager_branch_id
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

-- Keep department and business managers eligible to open their own supervised
-- operations session, without granting this capability to regular staff.
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where p.permission_key = 'operations.open'
  and (r.name ilike '%manager%' or r.name ilike '%supervisor%')
  and coalesce(r.status, 'Active') = 'Active'
on conflict (role_id, permission_id) do nothing;

-- Add a restrictive location policy alongside existing role/permission policies.
-- RLS permissions already granted to a role are therefore still limited by location.
do $$
declare
  t record;
  fk record;
  scope_expression text;
  check_expression text;
begin
  for t in
    select c.relname,
      bool_or(a.attname = 'business_id') as has_business_id,
      bool_or(a.attname = 'branch_id') as has_branch_id,
      bool_or(a.attname = 'store_branch_id') as has_store_branch_id,
      bool_or(a.attname = 'employee_id') as has_employee_id,
      bool_or(a.attname = 'order_id') as has_order_id,
      bool_or(a.attname = 'loan_product_id') as has_loan_product_id,
      bool_or(a.attname = 'id') as has_id,
      c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    join pg_attribute a on a.attrelid=c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname='public' and c.relkind='r' and c.relname <> 'customers'
    group by c.relname,c.relrowsecurity
    having c.relrowsecurity and (
      bool_or(a.attname in ('business_id','branch_id','store_branch_id','employee_id','order_id'))
      or c.relname in ('businesses','branches')
    )
  loop
    if t.relname='businesses' then
      scope_expression := 'public.can_access_business(id)';
      check_expression := scope_expression;
    elsif t.relname='branches' then
      scope_expression := 'public.can_access_branch(business_id,id)';
      check_expression := scope_expression;
    elsif t.relname='customers' then
      scope_expression := 'public.can_access_customer_record(id)';
      check_expression := 'public.can_access_business(business_id)';
    else
      scope_expression := 'true';
      check_expression := 'true';
      if t.has_business_id then
        scope_expression := scope_expression || ' and public.can_access_business(business_id)';
        check_expression := check_expression || ' and public.can_access_business(business_id)';
      end if;
      if t.has_branch_id then
        if t.has_business_id then
          scope_expression := scope_expression || ' and public.can_access_branch(business_id,branch_id)';
          check_expression := check_expression || ' and public.can_access_branch(business_id,branch_id)';
        else
          scope_expression := scope_expression || ' and public.can_access_branch_id(branch_id)';
          check_expression := check_expression || ' and public.can_access_branch_id(branch_id)';
        end if;
      end if;
      if t.has_store_branch_id then
        if t.has_business_id then
          scope_expression := scope_expression || ' and public.can_access_branch(business_id,store_branch_id)';
          check_expression := check_expression || ' and public.can_access_branch(business_id,store_branch_id)';
        else
          scope_expression := scope_expression || ' and public.can_access_branch_id(store_branch_id)';
          check_expression := check_expression || ' and public.can_access_branch_id(store_branch_id)';
        end if;
      end if;
      if t.has_employee_id and not t.has_business_id and not t.has_branch_id and not t.has_store_branch_id then
        scope_expression := scope_expression || ' and exists (select 1 from public.employees scoped_employee where scoped_employee.id=employee_id)';
        check_expression := check_expression || ' and exists (select 1 from public.employees scoped_employee where scoped_employee.id=employee_id)';
      end if;
      if t.has_order_id and not t.has_business_id and not t.has_branch_id and not t.has_store_branch_id then
        scope_expression := scope_expression || ' and exists (select 1 from public.orders scoped_order where scoped_order.id=order_id)';
        check_expression := check_expression || ' and exists (select 1 from public.orders scoped_order where scoped_order.id=order_id)';
      end if;
      -- Child records such as loan applications and repayments may not store
      -- their own business or branch. Keep them inside the scope of the
      -- related customer, order, loan product, or other operational parent.
      if not t.has_business_id and exists (
        select 1 from pg_attribute a
        where a.attrelid = format('public.%I',t.relname)::regclass
          and a.attname = 'customer_id' and a.attnum > 0 and not a.attisdropped
      ) then
        scope_expression := scope_expression || format(
          ' and exists (select 1 from public.customers scoped_customer where scoped_customer.id=public.%I.customer_id)',
          t.relname
        );
        check_expression := check_expression || format(
          ' and exists (select 1 from public.customers scoped_customer where scoped_customer.id=public.%I.customer_id)',
          t.relname
        );
      end if;
      if t.has_loan_product_id then
        scope_expression := scope_expression || format(
          ' and exists (select 1 from public.loan_products scoped_loan_product where scoped_loan_product.id=public.%I.loan_product_id)',
          t.relname
        );
        check_expression := check_expression || format(
          ' and exists (select 1 from public.loan_products scoped_loan_product where scoped_loan_product.id=public.%I.loan_product_id)',
          t.relname
        );
      end if;
      -- Follow approved operational foreign keys to their parent row. The
      -- parent table's own RLS applies its business/branch restriction.
      for fk in
        select source_attribute.attname as source_column, referenced_class.relname as referenced_table
        from pg_constraint constraint_row
        join pg_class referenced_class on referenced_class.oid=constraint_row.confrelid
        join pg_namespace referenced_namespace on referenced_namespace.oid=referenced_class.relnamespace
        join pg_attribute source_attribute on source_attribute.attrelid=constraint_row.conrelid
          and source_attribute.attnum=constraint_row.conkey[1]
        where constraint_row.contype='f'
          and constraint_row.conrelid=format('public.%I',t.relname)::regclass
          and cardinality(constraint_row.conkey)=1
          and referenced_namespace.nspname='public'
          and referenced_class.relname in ('customers','employees','orders','bookings','customer_loan_applications','loan_products')
          and referenced_class.relname <> t.relname
          and source_attribute.attname <> 'customer_id'
          and not (source_attribute.attname='loan_product_id' and referenced_class.relname='loan_products')
      loop
        scope_expression := scope_expression || format(
          ' and exists (select 1 from public.%I scoped_parent where scoped_parent.id=public.%I.%I)',
          fk.referenced_table,t.relname,fk.source_column
        );
        check_expression := check_expression || format(
          ' and exists (select 1 from public.%I scoped_parent where scoped_parent.id=public.%I.%I)',
          fk.referenced_table,t.relname,fk.source_column
        );
      end loop;
    end if;

    execute format('drop policy if exists aeos_business_branch_scope on public.%I',t.relname);
    execute format(
      'create policy aeos_business_branch_scope on public.%I as restrictive for all to authenticated using (%s) with check (%s)',
      t.relname,scope_expression,check_expression
    );
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;

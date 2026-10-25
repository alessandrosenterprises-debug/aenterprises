-- Capture cash movements out of the till and the cash removed to a safe/bank.
alter table public.cash_register_entries
  add column if not exists direction text not null default 'in';

alter table public.cash_register_entries
  drop constraint if exists cash_register_entries_direction_check;
alter table public.cash_register_entries
  add constraint cash_register_entries_direction_check check (direction in ('in', 'out'));

alter table public.cash_register_entries
  drop constraint if exists cash_register_entries_source_check;
alter table public.cash_register_entries
  add constraint cash_register_entries_source_check check (source in ('Order', 'Booking', 'Loan', 'Expense', 'Refund', 'Other'));

alter table public.cash_daily_reconciliations
  add column if not exists cash_dropped numeric(14,2) not null default 0 check (cash_dropped >= 0);

create table if not exists public.cashier_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  assigned_by_profile_id uuid not null references public.profiles(id) on delete restrict,
  active boolean not null default true,
  notes text,
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_profile_id, business_id)
);
create index if not exists cashier_assignments_business_active_idx
  on public.cashier_assignments(business_id, active, staff_profile_id);
alter table public.cashier_assignments enable row level security;

drop policy if exists "Cash managers can view cashier assignments" on public.cashier_assignments;
create policy "Cash managers can view cashier assignments"
  on public.cashier_assignments for select to authenticated
  using (public.has_permission('cash.manage') or public.has_permission('cash.review') or public.has_permission('reports.view') or staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1));
drop policy if exists "Cash managers can assign cashiers" on public.cashier_assignments;
create policy "Cash managers can assign cashiers"
  on public.cashier_assignments for insert to authenticated
  with check (public.has_permission('cash.manage') and assigned_by_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1));
drop policy if exists "Cash managers can update cashier assignments" on public.cashier_assignments;
create policy "Cash managers can update cashier assignments"
  on public.cashier_assignments for update to authenticated
  using (public.has_permission('cash.manage')) with check (public.has_permission('cash.manage'));

insert into public.permissions (module, action, name, description, permission_key)
values ('cash', 'review', 'Review cash reconciliations', 'Review all submitted daily cash counts and their cash variances.', 'cash.review')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

insert into public.permissions (module, action, name, description, permission_key)
values ('cash', 'manage', 'Manage cashiers', 'Assign eligible cash-handling staff to businesses and manage their till access.', 'cash.manage')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

drop policy if exists "Cash staff and report viewers can read receipts" on public.cash_register_entries;
create policy "Cash staff and report viewers can read receipts"
  on public.cash_register_entries for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

drop policy if exists "Cash staff and report viewers can read reconciliations" on public.cash_daily_reconciliations;
create policy "Cash staff and report viewers can read reconciliations"
  on public.cash_daily_reconciliations for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

create or replace function public.get_cash_handler_roster()
returns table (id uuid, display_name text, first_name text, last_name text, email text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.display_name, p.first_name, p.last_name, p.email
  from public.profiles p
  join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
  join public.role_permissions rp on rp.role_id = r.id
  join public.permissions perm on perm.id = rp.permission_id and perm.permission_key = 'cash.reconcile'
  where p.active = true and (public.has_permission('reports.view') or public.has_permission('cash.review') or public.has_permission('cash.manage'))
  order by coalesce(nullif(trim(p.display_name), ''), p.first_name, p.email);
$$;

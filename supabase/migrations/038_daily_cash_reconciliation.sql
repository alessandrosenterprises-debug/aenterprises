-- Daily cash receipts and end-of-day till reconciliation.
create table if not exists public.cash_register_entries (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  source text not null default 'Other' check (source in ('Order', 'Booking', 'Loan', 'Other')),
  reference text,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists cash_register_entries_received_at_idx
  on public.cash_register_entries(received_at desc);
create index if not exists cash_register_entries_staff_business_idx
  on public.cash_register_entries(staff_profile_id, business_id, received_at desc);

create table if not exists public.cash_daily_reconciliations (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.profiles(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  reconciliation_date date not null,
  opening_float numeric(14,2) not null default 0 check (opening_float >= 0),
  counted_cash numeric(14,2) not null check (counted_cash >= 0),
  notes text,
  submitted_at timestamptz not null default now(),
  unique (staff_profile_id, business_id, reconciliation_date)
);

create index if not exists cash_daily_reconciliations_date_idx
  on public.cash_daily_reconciliations(reconciliation_date desc, business_id);

alter table public.cash_register_entries enable row level security;
alter table public.cash_daily_reconciliations enable row level security;

drop policy if exists "Cash handlers can record own receipts" on public.cash_register_entries;
create policy "Cash handlers can record own receipts"
  on public.cash_register_entries for insert to authenticated
  with check (
    public.has_permission('cash.reconcile')
    and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

drop policy if exists "Cash staff and report viewers can read receipts" on public.cash_register_entries;
create policy "Cash staff and report viewers can read receipts"
  on public.cash_register_entries for select to authenticated
  using (
    public.has_permission('reports.view')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

drop policy if exists "Cash handlers can submit own reconciliation" on public.cash_daily_reconciliations;
create policy "Cash handlers can submit own reconciliation"
  on public.cash_daily_reconciliations for insert to authenticated
  with check (
    public.has_permission('cash.reconcile')
    and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

drop policy if exists "Cash handlers can update own reconciliation" on public.cash_daily_reconciliations;
create policy "Cash handlers can update own reconciliation"
  on public.cash_daily_reconciliations for update to authenticated
  using (
    public.has_permission('cash.reconcile')
    and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  )
  with check (
    public.has_permission('cash.reconcile')
    and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

drop policy if exists "Cash staff and report viewers can read reconciliations" on public.cash_daily_reconciliations;
create policy "Cash staff and report viewers can read reconciliations"
  on public.cash_daily_reconciliations for select to authenticated
  using (
    public.has_permission('reports.view')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

insert into public.permissions (module, action, name, description, permission_key)
values ('cash', 'reconcile', 'Record cash and reconcile till', 'Record cash received and submit your daily cash count.', 'cash.reconcile')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

-- Report viewers can see the identity of users assigned to cash handling,
-- without exposing the rest of the staff profile directory.
create or replace function public.get_cash_handler_roster()
returns table (id uuid, display_name text, first_name text, last_name text, email text)
language sql stable security definer set search_path = public
as $$
  select p.id, p.display_name, p.first_name, p.last_name, p.email
  from public.profiles p
  join public.roles r on r.id = p.role_id and coalesce(r.status, 'Active') = 'Active'
  join public.role_permissions rp on rp.role_id = r.id
  join public.permissions perm on perm.id = rp.permission_id and perm.permission_key = 'cash.reconcile'
  where p.active = true and public.has_permission('reports.view')
  order by coalesce(nullif(trim(p.display_name), ''), p.first_name, p.email);
$$;
grant execute on function public.get_cash_handler_roster() to authenticated;

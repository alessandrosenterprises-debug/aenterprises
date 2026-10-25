-- Manager verified till cash-ups are locked pending an independent Accounts review.
alter table public.cash_daily_reconciliations
  add column if not exists status text not null default 'pending_accounts',
  add column if not exists expected_cash numeric(14,2) not null default 0,
  add column if not exists variance numeric(14,2) not null default 0,
  add column if not exists manager_verified_at timestamptz,
  add column if not exists salary_deduction_note text,
  add column if not exists salary_deduction_amount numeric(14,2) not null default 0,
  add column if not exists accounts_reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists accounts_reviewed_at timestamptz,
  add column if not exists accounts_review_note text;

alter table public.cash_daily_reconciliations
  drop constraint if exists cash_daily_reconciliations_status_check;
alter table public.cash_daily_reconciliations
  add constraint cash_daily_reconciliations_status_check
  check (status in ('pending_accounts', 'approved', 'returned'));
alter table public.cash_daily_reconciliations
  drop constraint if exists cash_daily_reconciliations_salary_deduction_amount_check;
alter table public.cash_daily_reconciliations
  add constraint cash_daily_reconciliations_salary_deduction_amount_check
  check (salary_deduction_amount >= 0);
alter table public.cash_daily_reconciliations
  drop constraint if exists cash_daily_reconciliations_variance_matches_amounts_check;
alter table public.cash_daily_reconciliations
  add constraint cash_daily_reconciliations_variance_matches_amounts_check
  check (variance = round(counted_cash - expected_cash, 2));

-- Historical counts go to Accounts for a first review; they remain locked.
update public.cash_daily_reconciliations
set status = 'pending_accounts',
    manager_verified_at = coalesce(manager_verified_at, submitted_at),
    expected_cash = opening_float
      + coalesce((
        select sum(case when e.direction = 'out' then -e.amount else e.amount end)
        from public.cash_register_entries e
        where e.staff_profile_id = cash_daily_reconciliations.staff_profile_id
          and e.business_id = cash_daily_reconciliations.business_id
          and (e.received_at at time zone 'Africa/Lusaka')::date = cash_daily_reconciliations.reconciliation_date
          and e.counts_toward_till
      ), 0)
      - cash_dropped,
    variance = counted_cash - (
      opening_float
      + coalesce((
        select sum(case when e.direction = 'out' then -e.amount else e.amount end)
        from public.cash_register_entries e
        where e.staff_profile_id = cash_daily_reconciliations.staff_profile_id
          and e.business_id = cash_daily_reconciliations.business_id
          and (e.received_at at time zone 'Africa/Lusaka')::date = cash_daily_reconciliations.reconciliation_date
          and e.counts_toward_till
      ), 0)
      - cash_dropped
    )
where status not in ('approved', 'returned');

insert into public.permissions (module, action, name, description, permission_key)
values ('cash', 'finalize', 'Finalize cash-ups', 'Review manager-verified cash-ups and approve or return them for correction.', 'cash.finalize')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

insert into public.roles (name, description)
values ('Accounts Department', 'Reviews and confirms manager-verified cashier cash-ups.')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_key = 'cash.finalize'
where r.name = 'Accounts Department'
on conflict (role_id, permission_id) do nothing;

drop policy if exists "Cash staff and report viewers can read reconciliations" on public.cash_daily_reconciliations;
create policy "Cash staff and reviewers can read reconciliations"
  on public.cash_daily_reconciliations for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
    or public.has_permission('cash.finalize')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

drop policy if exists "Cash staff and report viewers can read receipts" on public.cash_register_entries;
create policy "Cash staff and reviewers can read receipts"
  on public.cash_register_entries for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
    or public.has_permission('cash.finalize')
    or (public.has_permission('cash.reconcile') and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1))
  );

drop policy if exists "Cash managers can view cashier assignments" on public.cashier_assignments;
create policy "Cash managers and Accounts can view cashier assignments"
  on public.cashier_assignments for select to authenticated
  using (
    public.has_permission('cash.manage')
    or public.has_permission('cash.review')
    or public.has_permission('reports.view')
    or public.has_permission('cash.finalize')
    or staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

drop policy if exists "Cash staff can read transaction modes" on public.cash_transaction_modes;
drop policy if exists "Cash staff and Accounts can read transaction modes" on public.cash_transaction_modes;
create policy "Cash staff and Accounts can read transaction modes"
  on public.cash_transaction_modes for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.reconcile')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
    or public.has_permission('cash.finalize')
  );

drop policy if exists "Shift managers can update cashier cash-up" on public.cash_daily_reconciliations;
drop policy if exists "Shift managers can submit cashier cash-up" on public.cash_daily_reconciliations;
drop policy if exists "Cash handlers can submit own reconciliation" on public.cash_daily_reconciliations;
drop policy if exists "Cash handlers can update own reconciliation" on public.cash_daily_reconciliations;
create policy "Shift managers can submit verified cash-up"
  on public.cash_daily_reconciliations for insert to authenticated
  with check (
    (public.has_permission('cash.review') or public.has_permission('cash.manage'))
    and reconciled_by_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
    and status = 'pending_accounts'
    and manager_verified_at is not null
    and variance = round(counted_cash - expected_cash, 2)
    and (
      abs(variance) < 0.01
      or (
        variance <= -0.01
        and nullif(trim(coalesce(notes, '')), '') is not null
        and nullif(trim(coalesce(salary_deduction_note, '')), '') is not null
        and salary_deduction_amount = round(-variance, 2)
      )
    )
  );
create policy "Shift managers can resubmit returned cash-up"
  on public.cash_daily_reconciliations for update to authenticated
  using (
    status = 'returned'
    and (public.has_permission('cash.review') or public.has_permission('cash.manage'))
  )
  with check (
    status = 'pending_accounts'
    and (public.has_permission('cash.review') or public.has_permission('cash.manage'))
    and reconciled_by_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
    and accounts_reviewed_by_profile_id is null
    and manager_verified_at is not null
    and variance = round(counted_cash - expected_cash, 2)
    and (
      abs(variance) < 0.01
      or (
        variance <= -0.01
        and nullif(trim(coalesce(notes, '')), '') is not null
        and nullif(trim(coalesce(salary_deduction_note, '')), '') is not null
        and salary_deduction_amount = round(-variance, 2)
      )
    )
  );

-- A cash-up blocks new till entries for that cashier and business on that day.
drop policy if exists "Cash handlers can record own receipts" on public.cash_register_entries;
create policy "Cash handlers can record own receipts before cash-up"
  on public.cash_register_entries for insert to authenticated
  with check (
    public.has_permission('cash.reconcile')
    and staff_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
    and not exists (
      select 1 from public.cash_daily_reconciliations r
      where r.staff_profile_id = cash_register_entries.staff_profile_id
        and r.business_id = cash_register_entries.business_id
        and r.reconciliation_date = (now() at time zone 'Africa/Lusaka')::date
        and r.status in ('pending_accounts', 'approved')
    )
  );

create or replace function public.review_cash_reconciliation(
  p_reconciliation_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer_id uuid;
begin
  if auth.uid() is null or not public.has_permission('cash.finalize') then
    raise exception 'Accounts cash-up permission is required';
  end if;
  if p_decision not in ('approve', 'return') then
    raise exception 'Choose approve or return';
  end if;
  if p_decision = 'return' and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'Add a reason when returning a cash-up';
  end if;
  select id into reviewer_id from public.profiles where auth_user_id = auth.uid() and active = true limit 1;
  if reviewer_id is null then raise exception 'Active Accounts staff profile not found'; end if;

  update public.cash_daily_reconciliations
  set status = case when p_decision = 'approve' then 'approved' else 'returned' end,
      accounts_reviewed_by_profile_id = reviewer_id,
      accounts_reviewed_at = now(),
      accounts_review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_reconciliation_id and status = 'pending_accounts';
  if not found then raise exception 'This cash-up is no longer awaiting Accounts review'; end if;
end;
$$;
revoke all on function public.review_cash_reconciliation(uuid, text, text) from public;
grant execute on function public.review_cash_reconciliation(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

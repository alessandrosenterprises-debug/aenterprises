begin;

-- Ensure all cash-up review fields are present even if this script is run
-- against a database with an incomplete migration history. Apply migration 043
-- first in the normal sequence so it can backfill historical cash counts.
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

-- Accounts department access and statutory payroll remittance register.
insert into public.permissions (module, action, name, description, permission_key)
values
  ('accounts', 'view', 'View Accounts workspace', 'View enterprise finance queues, payroll liabilities and accounts reports.', 'accounts.view'),
  ('accounts', 'payroll', 'Manage payroll statutory remittances', 'Generate, review, file and confirm statutory payroll remittances.', 'accounts.payroll'),
  ('accounts', 'manage', 'Manage accounts journals', 'Manage finance journals, reconciliations and supporting records.', 'accounts.manage')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

insert into public.roles (name, description)
values ('Accounts Department', 'Manages accounts controls, payroll liabilities, statutory remittances and cash-up review.')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_key in ('accounts.view', 'accounts.payroll', 'accounts.manage', 'cash.finalize', 'reports.view')
where r.name = 'Accounts Department'
on conflict (role_id, permission_id) do nothing;

-- The HR department table is part of the deployed enterprise schema.
insert into public.departments (name, description, status)
select 'Accounts', 'Payroll liabilities, statutory returns, cash-up review and financial reporting.', 'Active'
where not exists (select 1 from public.departments where lower(name) = 'accounts');

-- Keep statutory values in editable rules. The values below match the official
-- Zambia guidance available for charge year 2026 and can be amended by policy.
update public.hr_payroll_rules
set description = 'NAPSA formal-sector contributions: employee 5%, employer 5%, on gross earnings up to the annual monthly ceiling. Review each year against NAPSA guidance.',
    rule_type = 'Contribution', calculation_type = 'Percentage',
    employee_rate = 5, employer_rate = 5, mandatory = true, active = true,
    effective_from = date '2026-01-01', effective_to = null,
    configuration = jsonb_build_object('employee_basis', 'gross_pay', 'employer_basis', 'gross_pay', 'monthly_earnings_ceiling', 28920.30, 'due_day_following_month', 10, 'source', 'https://www.napsa.co.zm/self-service/formal-sector', 'review_annually', true),
    updated_at = now()
where code = 'NAPSA';

update public.hr_payroll_rules
set description = 'NHIMA formal-sector contributions: employee and employer contributions are each 1%; verify the approved contribution base and current eNHIMA guidance before every payroll year.',
    rule_type = 'Contribution', calculation_type = 'Percentage',
    employee_rate = 1, employer_rate = 1, mandatory = true, active = true,
    effective_from = date '2026-01-01', effective_to = null,
    configuration = jsonb_build_object('employee_basis', 'gross_pay', 'employer_basis', 'basic_salary', 'due_day_following_month', 10, 'source', 'https://www.nhima.co.zm/elementor-1783/', 'review_annually', true),
    updated_at = now()
where code = 'NHIMA';

update public.hr_payroll_rules
set description = 'PAYE 2026 progressive monthly bands from ZRA. Recheck official tax tables for every charge year and special employee cases.',
    rule_type = 'Tax', calculation_type = 'Progressive',
    mandatory = true, active = true,
    effective_from = date '2026-01-01', effective_to = null,
    configuration = jsonb_build_object(
      'basis', 'taxable_pay', 'due_day_following_month', 10,
      'bands', jsonb_build_array(
        jsonb_build_object('up_to', 5100, 'rate', 0),
        jsonb_build_object('up_to', 7100, 'rate', 20),
        jsonb_build_object('up_to', 9200, 'rate', 30),
        jsonb_build_object('up_to', null, 'rate', 37)
      ),
      'source', 'https://www.zra.org.zm/tax-information/',
      'review_annually', true
    ),
    updated_at = now()
where code = 'PAYE';

create table if not exists public.accounts_statutory_schedules (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.hr_payroll_runs(id) on delete restrict,
  payroll_period_id uuid not null references public.hr_payroll_periods(id) on delete restrict,
  authority text not null check (authority in ('NAPSA', 'NHIMA', 'PAYE')),
  period_name text not null,
  period_end date not null,
  due_date date not null,
  employee_amount numeric(14,2) not null default 0 check (employee_amount >= 0),
  employer_amount numeric(14,2) not null default 0 check (employer_amount >= 0),
  total_amount numeric(14,2) generated always as (employee_amount + employer_amount) stored,
  status text not null default 'draft' check (status in ('draft', 'filed', 'paid')),
  filing_reference text,
  payment_reference text,
  notes text,
  filed_at timestamptz,
  paid_at timestamptz,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_run_id, authority)
);

create index if not exists accounts_statutory_schedules_status_due_idx
  on public.accounts_statutory_schedules(status, due_date);
create index if not exists accounts_statutory_schedules_period_idx
  on public.accounts_statutory_schedules(payroll_period_id, authority);

create table if not exists public.accounts_chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.accounts_chart_of_accounts (code, name, account_type) values
  ('1000', 'Cash on hand', 'asset'),
  ('1010', 'Bank accounts', 'asset'),
  ('1100', 'Trade receivables', 'asset'),
  ('1200', 'Inventory', 'asset'),
  ('1300', 'Loan receivables', 'asset'),
  ('1310', 'Employee shortage receivable', 'asset'),
  ('2000', 'Trade payables', 'liability'),
  ('2100', 'Payroll payable', 'liability'),
  ('2110', 'NAPSA payable', 'liability'),
  ('2120', 'NHIMA payable', 'liability'),
  ('2130', 'PAYE payable', 'liability'),
  ('2140', 'Other statutory payable', 'liability'),
  ('2200', 'Employee deductions payable', 'liability'),
  ('3000', 'Owner equity', 'equity'),
  ('4000', 'Product sales', 'income'),
  ('4100', 'Service income', 'income'),
  ('4200', 'Delivery income', 'income'),
  ('5000', 'Cost of goods sold', 'expense'),
  ('5100', 'Payroll expense', 'expense'),
  ('5110', 'Employer statutory contributions', 'expense'),
  ('5200', 'Cash shortages and losses', 'expense'),
  ('5300', 'Operating expenses', 'expense')
on conflict (code) do nothing;

create table if not exists public.accounts_journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_number bigint generated by default as identity unique,
  entry_date date not null,
  source_type text not null default 'manual',
  source_id text,
  memo text not null,
  status text not null default 'draft' check (status in ('draft', 'posted', 'void')),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  posted_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create table if not exists public.accounts_journal_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.accounts_journal_entries(id) on delete restrict,
  account_id uuid not null references public.accounts_chart_of_accounts(id) on delete restrict,
  line_number integer not null,
  description text,
  debit numeric(14,2) not null default 0 check (debit >= 0),
  credit numeric(14,2) not null default 0 check (credit >= 0),
  created_at timestamptz not null default now(),
  unique (entry_id, line_number),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

create index if not exists accounts_journal_entries_date_idx on public.accounts_journal_entries(entry_date desc, entry_number desc);
create unique index if not exists accounts_journal_source_unique_idx on public.accounts_journal_entries(source_type, source_id) where source_type <> 'manual' and source_id is not null;
create index if not exists accounts_journal_lines_entry_idx on public.accounts_journal_lines(entry_id, line_number);
alter table public.accounts_chart_of_accounts enable row level security;
alter table public.accounts_journal_entries enable row level security;
alter table public.accounts_journal_lines enable row level security;

drop policy if exists "Accounts staff read chart of accounts" on public.accounts_chart_of_accounts;
create policy "Accounts staff read chart of accounts" on public.accounts_chart_of_accounts
  for select to authenticated using (public.has_permission('accounts.view'));
drop policy if exists "Accounts managers maintain chart of accounts" on public.accounts_chart_of_accounts;
create policy "Accounts managers maintain chart of accounts" on public.accounts_chart_of_accounts
  for all to authenticated using (public.has_permission('accounts.manage'))
  with check (public.has_permission('accounts.manage'));
drop policy if exists "Accounts staff read journal entries" on public.accounts_journal_entries;
create policy "Accounts staff read journal entries" on public.accounts_journal_entries
  for select to authenticated using (public.has_permission('accounts.view'));
drop policy if exists "Accounts staff create journal drafts" on public.accounts_journal_entries;
drop policy if exists "Accounts staff post journal drafts" on public.accounts_journal_entries;
drop policy if exists "Accounts staff read journal lines" on public.accounts_journal_lines;
create policy "Accounts staff read journal lines" on public.accounts_journal_lines
  for select to authenticated using (public.has_permission('accounts.view'));
drop policy if exists "Accounts staff add lines to draft journals" on public.accounts_journal_lines;
drop policy if exists "Accounts staff update lines on draft journals" on public.accounts_journal_lines;

grant select, insert, update on public.accounts_chart_of_accounts to authenticated;
grant select on public.accounts_journal_entries to authenticated;
grant select on public.accounts_journal_lines to authenticated;

drop function if exists public.create_accounts_journal_draft(date, text, jsonb);
create function public.create_accounts_journal_draft(
  p_entry_date date, p_memo text, p_lines jsonb,
  p_source_type text default 'manual', p_source_id text default null
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  actor_id uuid;
  journal_id uuid;
  debit_total numeric(14,2);
  credit_total numeric(14,2);
  line_count integer;
begin
  if auth.uid() is null or not public.has_permission('accounts.manage') then
    raise exception 'Accounts journal permission is required';
  end if;
  if p_entry_date is null or nullif(trim(coalesce(p_memo, '')), '') is null or p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 2 then
    raise exception 'Enter a date, description and balanced journal lines';
  end if;
  if p_source_type is null or p_source_type not in ('manual', 'payroll_run') or (p_source_type <> 'manual' and nullif(trim(coalesce(p_source_id, '')), '') is null) then
    raise exception 'Choose a supported source record for this journal';
  end if;
  if p_source_type = 'payroll_run' and not exists (
    select 1 from public.hr_payroll_runs where id = p_source_id::uuid and status in ('Finalized', 'Paid')
  ) then raise exception 'Only finalized or paid payroll can be transferred'; end if;
  select count(*), coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into line_count, debit_total, credit_total
  from jsonb_to_recordset(p_lines) as l(account_id uuid, debit numeric, credit numeric);
  if line_count < 2 or abs(debit_total - credit_total) >= 0.01 or debit_total <= 0 then
    raise exception 'Journal debits and credits must balance and include at least two lines';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_lines) as l(account_id uuid, debit numeric, credit numeric)
    left join public.accounts_chart_of_accounts a on a.id = l.account_id and a.active
    where a.id is null or l.debit < 0 or l.credit < 0 or (l.debit > 0) = (l.credit > 0)
  ) then raise exception 'Choose active accounts and enter each line as a debit or a credit'; end if;
  select public.get_effective_profile_id() into actor_id;
  insert into public.accounts_journal_entries(entry_date, source_type, source_id, memo, created_by_profile_id)
  values (p_entry_date, p_source_type, p_source_id, trim(p_memo), actor_id) returning id into journal_id;
  insert into public.accounts_journal_lines(entry_id, account_id, line_number, description, debit, credit)
  select journal_id, l.account_id, n.line_number, nullif(trim(l.description), ''), l.debit, l.credit
  from jsonb_to_recordset(p_lines) with ordinality as l(account_id uuid, debit numeric, credit numeric, description text, ordinality bigint)
  cross join lateral (select l.ordinality::integer as line_number) n;
  return journal_id;
end;
$$;
revoke all on function public.create_accounts_journal_draft(date, text, jsonb, text, text) from public;
grant execute on function public.create_accounts_journal_draft(date, text, jsonb, text, text) to authenticated;

create or replace function public.post_accounts_journal(p_entry_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare actor_id uuid; debit_total numeric(14,2); credit_total numeric(14,2); line_count integer;
begin
  if auth.uid() is null or not public.has_permission('accounts.manage') then
    raise exception 'Accounts journal permission is required';
  end if;
  select count(*), coalesce(sum(debit), 0), coalesce(sum(credit), 0)
    into line_count, debit_total, credit_total
  from public.accounts_journal_lines where entry_id = p_entry_id;
  if line_count < 2 or debit_total <= 0 or abs(debit_total - credit_total) >= 0.01 then
    raise exception 'This journal is not balanced and cannot be posted';
  end if;
  select public.get_effective_profile_id() into actor_id;
  update public.accounts_journal_entries set status = 'posted', posted_by_profile_id = actor_id, posted_at = now()
  where id = p_entry_id and status = 'draft';
  if not found then raise exception 'This journal is no longer a draft'; end if;
end;
$$;
revoke all on function public.post_accounts_journal(uuid) from public;
grant execute on function public.post_accounts_journal(uuid) to authenticated;

create table if not exists public.accounts_statutory_schedule_lines (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.accounts_statutory_schedules(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  napsa_number text,
  nhima_number text,
  employee_amount numeric(14,2) not null default 0 check (employee_amount >= 0),
  employer_amount numeric(14,2) not null default 0 check (employer_amount >= 0),
  created_at timestamptz not null default now(),
  unique (schedule_id, employee_id)
);

create or replace function public.save_accounts_statutory_schedule(p_schedule jsonb, p_lines jsonb)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  actor_id uuid;
  schedule_id_value uuid;
  existing_status text;
  employee_total numeric(14,2);
  employer_total numeric(14,2);
  line_employee_total numeric(14,2);
  line_employer_total numeric(14,2);
begin
  if auth.uid() is null or not public.has_permission('accounts.payroll') then
    raise exception 'Accounts statutory payroll permission is required';
  end if;
  if p_schedule is null or p_lines is null or jsonb_typeof(p_schedule) <> 'object' or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'A payroll period and employee schedule are required';
  end if;
  if p_schedule->>'authority' not in ('NAPSA', 'NHIMA', 'PAYE') then raise exception 'Choose a supported statutory authority'; end if;
  if not exists (
    select 1 from public.hr_payroll_runs r
    join public.hr_payroll_periods p on p.id = r.payroll_period_id
    where r.id = (p_schedule->>'payroll_run_id')::uuid
      and r.payroll_period_id = (p_schedule->>'payroll_period_id')::uuid
      and p.period_end = (p_schedule->>'period_end')::date
      and r.status in ('Finalized', 'Paid')
  ) then raise exception 'Statutory schedules can only be generated from finalized payroll'; end if;
  employee_total := coalesce((p_schedule->>'employee_amount')::numeric, 0);
  employer_total := coalesce((p_schedule->>'employer_amount')::numeric, 0);
  select coalesce(sum(employee_amount), 0), coalesce(sum(employer_amount), 0)
    into line_employee_total, line_employer_total
  from jsonb_to_recordset(p_lines) as line(employee_amount numeric, employer_amount numeric);
  if abs(employee_total - line_employee_total) >= 0.01 or abs(employer_total - line_employer_total) >= 0.01 then
    raise exception 'Schedule totals must match the employee breakdown';
  end if;
  select public.get_effective_profile_id() into actor_id;
  select id, status into schedule_id_value, existing_status
  from public.accounts_statutory_schedules
  where payroll_run_id = (p_schedule->>'payroll_run_id')::uuid and authority = p_schedule->>'authority'
  for update;
  if schedule_id_value is not null and existing_status <> 'draft' then return schedule_id_value; end if;
  if schedule_id_value is null then
    insert into public.accounts_statutory_schedules (
      payroll_run_id, payroll_period_id, authority, period_name, period_end, due_date,
      employee_amount, employer_amount, created_by_profile_id, updated_by_profile_id
    ) values (
      (p_schedule->>'payroll_run_id')::uuid,
      (p_schedule->>'payroll_period_id')::uuid,
      p_schedule->>'authority', p_schedule->>'period_name',
      (p_schedule->>'period_end')::date, (p_schedule->>'due_date')::date,
      employee_total, employer_total, actor_id, actor_id
    ) returning id into schedule_id_value;
  else
    update public.accounts_statutory_schedules set
      period_name = p_schedule->>'period_name', period_end = (p_schedule->>'period_end')::date,
      due_date = (p_schedule->>'due_date')::date, employee_amount = employee_total,
      employer_amount = employer_total, updated_by_profile_id = actor_id, updated_at = now()
    where id = schedule_id_value and status = 'draft';
    delete from public.accounts_statutory_schedule_lines where schedule_id = schedule_id_value;
  end if;
  insert into public.accounts_statutory_schedule_lines (
    schedule_id, employee_id, napsa_number, nhima_number, employee_amount, employer_amount
  )
  select schedule_id_value, line.employee_id, line.napsa_number, line.nhima_number,
         line.employee_amount, line.employer_amount
  from jsonb_to_recordset(p_lines) as line(
    employee_id uuid, napsa_number text, nhima_number text,
    employee_amount numeric, employer_amount numeric
  );
  return schedule_id_value;
end;
$$;
revoke all on function public.save_accounts_statutory_schedule(jsonb, jsonb) from public;
grant execute on function public.save_accounts_statutory_schedule(jsonb, jsonb) to authenticated;

create or replace function public.advance_accounts_statutory_schedule(
  p_schedule_id uuid, p_next_status text, p_filing_reference text default null,
  p_payment_reference text default null
)
returns void language plpgsql security definer set search_path = public
as $$
declare actor_id uuid; current_status text;
begin
  if auth.uid() is null or not public.has_permission('accounts.payroll') then
    raise exception 'Accounts statutory payroll permission is required';
  end if;
  select status into current_status from public.accounts_statutory_schedules where id = p_schedule_id for update;
  if current_status is null then raise exception 'Statutory schedule was not found'; end if;
  select public.get_effective_profile_id() into actor_id;
  if current_status = 'draft' and p_next_status = 'filed' and nullif(trim(coalesce(p_filing_reference, '')), '') is not null then
    update public.accounts_statutory_schedules set status = 'filed', filing_reference = trim(p_filing_reference), filed_at = now(), updated_by_profile_id = actor_id, updated_at = now() where id = p_schedule_id;
  elsif current_status = 'filed' and p_next_status = 'paid' and nullif(trim(coalesce(p_payment_reference, '')), '') is not null then
    update public.accounts_statutory_schedules set status = 'paid', payment_reference = trim(p_payment_reference), paid_at = now(), updated_by_profile_id = actor_id, updated_at = now() where id = p_schedule_id;
  else
    raise exception 'Add the required reference and follow the filing then payment sequence';
  end if;
end;
$$;
revoke all on function public.advance_accounts_statutory_schedule(uuid, text, text, text) from public;
grant execute on function public.advance_accounts_statutory_schedule(uuid, text, text, text) to authenticated;

alter table public.accounts_statutory_schedules enable row level security;
alter table public.accounts_statutory_schedule_lines enable row level security;

drop policy if exists "Accounts staff view statutory schedules" on public.accounts_statutory_schedules;
create policy "Accounts staff view statutory schedules"
  on public.accounts_statutory_schedules for select to authenticated
  using (public.has_permission('accounts.view') or public.has_permission('accounts.payroll'));
drop policy if exists "Accounts staff manage statutory schedules" on public.accounts_statutory_schedules;

drop policy if exists "Accounts staff view statutory schedule lines" on public.accounts_statutory_schedule_lines;
create policy "Accounts staff view statutory schedule lines"
  on public.accounts_statutory_schedule_lines for select to authenticated
  using (public.has_permission('accounts.view') or public.has_permission('accounts.payroll'));
drop policy if exists "Accounts staff manage statutory schedule lines" on public.accounts_statutory_schedule_lines;

grant select on public.accounts_statutory_schedules to authenticated;
grant select on public.accounts_statutory_schedule_lines to authenticated;

-- Approved till shortages are queued as explicit payroll deductions so a
-- manager's cash-up note cannot be lost between Accounts and payroll.
alter table public.hr_payroll_deductions
  drop constraint if exists hr_payroll_deductions_deduction_type_check;
alter table public.hr_payroll_deductions
  add constraint hr_payroll_deductions_deduction_type_check
  check (deduction_type in ('PAYE', 'NAPSA', 'NHIMA', 'Loan', 'Advance', 'Pension', 'Shortage', 'Other'));

create table if not exists public.accounts_salary_deductions (
  id uuid primary key default gen_random_uuid(),
  reconciliation_id uuid not null unique references public.cash_daily_reconciliations(id) on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  status text not null default 'pending_payroll' check (status in ('pending_payroll', 'included', 'paid', 'cancelled')),
  payroll_entry_id uuid references public.hr_payroll_entries(id) on delete restrict,
  approved_by_profile_id uuid references public.profiles(id) on delete set null,
  approved_at timestamptz not null default now(),
  included_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accounts_salary_deductions_status_idx on public.accounts_salary_deductions(status, created_at);
alter table public.accounts_salary_deductions enable row level security;
drop policy if exists "Accounts staff read shortage deductions" on public.accounts_salary_deductions;
create policy "Accounts staff read shortage deductions" on public.accounts_salary_deductions
  for select to authenticated using (public.has_permission('accounts.view') or public.has_permission('accounts.payroll'));
grant select on public.accounts_salary_deductions to authenticated;

insert into public.accounts_salary_deductions (
  reconciliation_id, employee_id, amount, reason, approved_by_profile_id, approved_at
)
select r.id, e.id, r.salary_deduction_amount, trim(r.salary_deduction_note), r.accounts_reviewed_by_profile_id,
       coalesce(r.accounts_reviewed_at, r.submitted_at, now())
from public.cash_daily_reconciliations r
join public.profiles p on p.id = r.staff_profile_id
join public.employees e on e.user_id = p.auth_user_id and coalesce(e.is_active, true)
where r.status = 'approved' and r.variance <= -0.01 and r.salary_deduction_amount > 0
  and nullif(trim(coalesce(r.salary_deduction_note, '')), '') is not null
on conflict (reconciliation_id) do nothing;

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
  reconciliation_row public.cash_daily_reconciliations%rowtype;
  employee_id_value uuid;
begin
  if auth.uid() is null or not public.has_permission('cash.finalize') then
    raise exception 'Accounts cash-up permission is required';
  end if;
  if p_decision not in ('approve', 'return') then raise exception 'Choose approve or return'; end if;
  if p_decision = 'return' and nullif(trim(coalesce(p_note, '')), '') is null then raise exception 'Add a reason when returning a cash-up'; end if;
  select id into reviewer_id from public.profiles where id = public.get_effective_profile_id() and active = true limit 1;
  if reviewer_id is null then raise exception 'Active Accounts staff profile not found'; end if;
  select * into reconciliation_row from public.cash_daily_reconciliations
  where id = p_reconciliation_id and status = 'pending_accounts' for update;
  if reconciliation_row.id is null then raise exception 'This cash-up is no longer awaiting Accounts review'; end if;

  if p_decision = 'approve' and reconciliation_row.variance <= -0.01 and reconciliation_row.salary_deduction_amount > 0 then
    select e.id into employee_id_value
    from public.profiles p join public.employees e on e.user_id = p.auth_user_id
    where p.id = reconciliation_row.staff_profile_id and coalesce(e.is_active, true)
    order by e.created_at desc limit 1;
    if employee_id_value is null then
      raise exception 'Link this cashier profile to an active employee record before approving a shortage deduction';
    end if;
  end if;

  update public.cash_daily_reconciliations
  set status = case when p_decision = 'approve' then 'approved' else 'returned' end,
      accounts_reviewed_by_profile_id = reviewer_id,
      accounts_reviewed_at = now(),
      accounts_review_note = nullif(trim(coalesce(p_note, '')), '')
  where id = p_reconciliation_id;

  if p_decision = 'approve' and reconciliation_row.variance <= -0.01 and reconciliation_row.salary_deduction_amount > 0 then
    insert into public.accounts_salary_deductions (
      reconciliation_id, employee_id, amount, reason, approved_by_profile_id
    ) values (
      reconciliation_row.id, employee_id_value, reconciliation_row.salary_deduction_amount,
      trim(reconciliation_row.salary_deduction_note), reviewer_id
    ) on conflict (reconciliation_id) do nothing;
  end if;
end;
$$;
revoke all on function public.review_cash_reconciliation(uuid, text, text) from public;
grant execute on function public.review_cash_reconciliation(uuid, text, text) to authenticated;

create or replace function public.apply_accounts_shortage_deductions(p_payroll_run_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare deduction_row record; entry_id_value uuid; applied_count integer := 0;
begin
  if auth.uid() is null or not public.has_permission('accounts.payroll') then
    raise exception 'Accounts payroll permission is required';
  end if;
  if not exists(select 1 from public.hr_payroll_runs where id = p_payroll_run_id and status in ('Draft', 'Processing')) then
    raise exception 'Shortage deductions can only be added to a draft or processing payroll run';
  end if;
  for deduction_row in
    select * from public.accounts_salary_deductions where status = 'pending_payroll' order by approved_at for update
  loop
    select id into entry_id_value from public.hr_payroll_entries
      where payroll_run_id = p_payroll_run_id and employee_id = deduction_row.employee_id and status <> 'Cancelled' limit 1;
    if entry_id_value is null then
      raise exception 'A payroll entry is missing for an employee with an approved shortage';
    end if;
    insert into public.hr_payroll_deductions (
      payroll_entry_id, name, description, amount, deduction_type, mandatory, recurring
    ) values (
      entry_id_value, 'Cash shortage recovery', deduction_row.reason,
      deduction_row.amount, 'Shortage', true, false
    );
    update public.accounts_salary_deductions set status = 'included', payroll_entry_id = entry_id_value,
      included_at = now(), updated_at = now() where id = deduction_row.id;
    entry_id_value := null;
    applied_count := applied_count + 1;
  end loop;
  return applied_count;
end;
$$;
revoke all on function public.apply_accounts_shortage_deductions(uuid) from public;
grant execute on function public.apply_accounts_shortage_deductions(uuid) to authenticated;

create or replace function public.mark_accounts_shortage_deductions_paid()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'Paid' and old.status is distinct from new.status then
    update public.accounts_salary_deductions set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
    where payroll_entry_id = new.id and status = 'included';
  end if;
  return new;
end;
$$;
drop trigger if exists accounts_shortage_deductions_paid on public.hr_payroll_entries;
create trigger accounts_shortage_deductions_paid after update of status on public.hr_payroll_entries
for each row execute function public.mark_accounts_shortage_deductions_paid();

notify pgrst, 'reload schema';
commit;

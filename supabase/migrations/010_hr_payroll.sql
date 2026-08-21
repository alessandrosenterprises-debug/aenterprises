/* ============================================================
   010_hr_payroll.sql
   Alessandro Enterprises
   HR + Payroll Foundation
============================================================ */

begin;


/* ============================================================
   1. PAYROLL PERIODS
   Example:
   August 2026
   September 2026
============================================================ */

create table if not exists public.hr_payroll_periods (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    period_start date not null,

    period_end date not null,

    payment_date date,

    status text not null default 'Draft'
        check (
            status in (
                'Draft',
                'Open',
                'Processing',
                'Finalized',
                'Paid',
                'Cancelled'
            )
        ),

    notes text,

    created_by uuid
        references auth.users(id)
        on delete set null,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint hr_payroll_periods_dates_check
        check (period_end >= period_start)
);


/* ============================================================
   2. PAYROLL RUNS
   A payroll run belongs to a payroll period.
   This allows us to re-run or process payroll safely.
============================================================ */

create table if not exists public.hr_payroll_runs (
    id uuid primary key default gen_random_uuid(),

    payroll_period_id uuid not null
        references public.hr_payroll_periods(id)
        on delete restrict,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    branch_id uuid
        references public.branches(id)
        on delete set null,

    status text not null default 'Draft'
        check (
            status in (
                'Draft',
                'Processing',
                'Finalized',
                'Paid',
                'Cancelled'
            )
        ),

    employee_count integer not null default 0,

    gross_pay numeric(14,2) not null default 0,

    total_allowances numeric(14,2) not null default 0,

    total_deductions numeric(14,2) not null default 0,

    total_tax numeric(14,2) not null default 0,

    net_pay numeric(14,2) not null default 0,

    notes text,

    processed_by uuid
        references auth.users(id)
        on delete set null,

    processed_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


/* ============================================================
   3. PAYROLL ENTRIES
   One employee's payroll calculation for one payroll run.
============================================================ */

create table if not exists public.hr_payroll_entries (
    id uuid primary key default gen_random_uuid(),

    payroll_run_id uuid not null
        references public.hr_payroll_runs(id)
        on delete cascade,

    employee_id uuid not null
        references public.employees(id)
        on delete restrict,

    business_id uuid
        references public.businesses(id)
        on delete set null,

    branch_id uuid
        references public.branches(id)
        on delete set null,

    department_id uuid
        references public.departments(id)
        on delete set null,

    /* Employee salary snapshot for this payroll */
    basic_salary numeric(14,2) not null default 0,

    taxable_pay numeric(14,2) not null default 0,

    gross_pay numeric(14,2) not null default 0,

    total_allowances numeric(14,2) not null default 0,

    total_deductions numeric(14,2) not null default 0,

    total_tax numeric(14,2) not null default 0,

    net_pay numeric(14,2) not null default 0,

    /* Attendance / payroll adjustments */
    days_worked numeric(8,2) not null default 0,

    days_absent numeric(8,2) not null default 0,

    unpaid_leave_days numeric(8,2) not null default 0,

    overtime_hours numeric(8,2) not null default 0,

    overtime_amount numeric(14,2) not null default 0,

    status text not null default 'Draft'
        check (
            status in (
                'Draft',
                'Calculated',
                'Approved',
                'Paid',
                'Cancelled'
            )
        ),

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint hr_payroll_entries_unique_employee
        unique (payroll_run_id, employee_id)
);


/* ============================================================
   4. PAYROLL ALLOWANCES
   Flexible.
   We don't hard-code allowance types.
============================================================ */

create table if not exists public.hr_payroll_allowances (
    id uuid primary key default gen_random_uuid(),

    payroll_entry_id uuid not null
        references public.hr_payroll_entries(id)
        on delete cascade,

    name text not null,

    description text,

    amount numeric(14,2) not null default 0,

    taxable boolean not null default true,

    recurring boolean not null default false,

    created_at timestamptz not null default now()
);


/* ============================================================
   5. PAYROLL DEDUCTIONS
   Flexible.
   PAYE, NAPSA, NHIMA, loans, advances, etc.
   are represented as configurable deductions.
============================================================ */

create table if not exists public.hr_payroll_deductions (
    id uuid primary key default gen_random_uuid(),

    payroll_entry_id uuid not null
        references public.hr_payroll_entries(id)
        on delete cascade,

    name text not null,

    description text,

    amount numeric(14,2) not null default 0,

    deduction_type text not null default 'Other'
        check (
            deduction_type in (
                'PAYE',
                'NAPSA',
                'NHIMA',
                'Loan',
                'Advance',
                'Pension',
                'Other'
            )
        ),

    mandatory boolean not null default false,

    recurring boolean not null default false,

    created_at timestamptz not null default now()
);


/* ============================================================
   6. PAYSLIPS
   A finalized record of what the employee was paid.
============================================================ */

create table if not exists public.hr_payslips (
    id uuid primary key default gen_random_uuid(),

    payroll_entry_id uuid not null unique
        references public.hr_payroll_entries(id)
        on delete restrict,

    employee_id uuid not null
        references public.employees(id)
        on delete restrict,

    payroll_period_id uuid not null
        references public.hr_payroll_periods(id)
        on delete restrict,

    payslip_number text not null unique,

    issued_date date not null default current_date,

    payment_date date,

    basic_salary numeric(14,2) not null default 0,

    gross_pay numeric(14,2) not null default 0,

    total_allowances numeric(14,2) not null default 0,

    total_deductions numeric(14,2) not null default 0,

    total_tax numeric(14,2) not null default 0,

    net_pay numeric(14,2) not null default 0,

    currency text not null default 'ZMW',

    status text not null default 'Generated'
        check (
            status in (
                'Generated',
                'Issued',
                'Paid',
                'Cancelled'
            )
        ),

    pdf_url text,

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


/* ============================================================
   7. PAYROLL CONFIGURATION
   This is the important part.
   
   Tax and statutory rules live here rather than inside
   employees or payroll code.

   We can later configure:
   - PAYE
   - NAPSA
   - NHIMA
   - pension
   - other statutory deductions
   - effective dates
============================================================ */

create table if not exists public.hr_payroll_rules (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    code text not null unique,

    description text,

    rule_type text not null default 'Deduction'
        check (
            rule_type in (
                'Tax',
                'Deduction',
                'Contribution',
                'Allowance'
            )
        ),

    calculation_type text not null default 'Percentage'
        check (
            calculation_type in (
                'Percentage',
                'Fixed',
                'Progressive',
                'Formula'
            )
        ),

    rate numeric(10,4),

    fixed_amount numeric(14,2),

    minimum_amount numeric(14,2),

    maximum_amount numeric(14,2),

    employer_rate numeric(10,4),

    employee_rate numeric(10,4),

    taxable boolean not null default false,

    mandatory boolean not null default false,

    active boolean not null default true,

    effective_from date,

    effective_to date,

    configuration jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


/* ============================================================
   8. EMPLOYEE PAYROLL SETTINGS
   Employee-specific payroll information that should NOT
   clutter the employees table.
============================================================ */

create table if not exists public.hr_employee_payroll_settings (
    id uuid primary key default gen_random_uuid(),

    employee_id uuid not null unique
        references public.employees(id)
        on delete cascade,

    bank_name text,

    bank_account_name text,

    bank_account_number text,

    branch_code text,

    payment_method text not null default 'Bank'
        check (
            payment_method in (
                'Bank',
                'Mobile Money',
                'Cash',
                'Other'
            )
        ),

    tax_number text,

    napsa_number text,

    nhima_number text,

    pension_number text,

    loan_deduction_enabled boolean not null default false,

    default_loan_deduction numeric(14,2) not null default 0,

    default_advance_deduction numeric(14,2) not null default 0,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


/* ============================================================
   9. INDEXES
============================================================ */

create index if not exists idx_hr_payroll_periods_status
    on public.hr_payroll_periods(status);

create index if not exists idx_hr_payroll_periods_dates
    on public.hr_payroll_periods(period_start, period_end);

create index if not exists idx_hr_payroll_runs_period
    on public.hr_payroll_runs(payroll_period_id);

create index if not exists idx_hr_payroll_runs_business
    on public.hr_payroll_runs(business_id);

create index if not exists idx_hr_payroll_runs_branch
    on public.hr_payroll_runs(branch_id);

create index if not exists idx_hr_payroll_entries_run
    on public.hr_payroll_entries(payroll_run_id);

create index if not exists idx_hr_payroll_entries_employee
    on public.hr_payroll_entries(employee_id);

create index if not exists idx_hr_payroll_allowances_entry
    on public.hr_payroll_allowances(payroll_entry_id);

create index if not exists idx_hr_payroll_deductions_entry
    on public.hr_payroll_deductions(payroll_entry_id);

create index if not exists idx_hr_payslips_employee
    on public.hr_payslips(employee_id);

create index if not exists idx_hr_payslips_period
    on public.hr_payslips(payroll_period_id);

create index if not exists idx_hr_payroll_rules_code
    on public.hr_payroll_rules(code);

create index if not exists idx_hr_payroll_rules_active
    on public.hr_payroll_rules(active);

create index if not exists idx_hr_employee_payroll_employee
    on public.hr_employee_payroll_settings(employee_id);


/* ============================================================
   10. UPDATED_AT FUNCTION
============================================================ */

create or replace function public.hr_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


/* ============================================================
   11. UPDATED_AT TRIGGERS
============================================================ */

drop trigger if exists hr_payroll_periods_updated_at
on public.hr_payroll_periods;

create trigger hr_payroll_periods_updated_at
before update on public.hr_payroll_periods
for each row
execute function public.hr_set_updated_at();


drop trigger if exists hr_payroll_runs_updated_at
on public.hr_payroll_runs;

create trigger hr_payroll_runs_updated_at
before update on public.hr_payroll_runs
for each row
execute function public.hr_set_updated_at();


drop trigger if exists hr_payroll_entries_updated_at
on public.hr_payroll_entries;

create trigger hr_payroll_entries_updated_at
before update on public.hr_payroll_entries
for each row
execute function public.hr_set_updated_at();


drop trigger if exists hr_payslips_updated_at
on public.hr_payslips;

create trigger hr_payslips_updated_at
before update on public.hr_payslips
for each row
execute function public.hr_set_updated_at();


drop trigger if exists hr_payroll_rules_updated_at
on public.hr_payroll_rules;

create trigger hr_payroll_rules_updated_at
before update on public.hr_payroll_rules
for each row
execute function public.hr_set_updated_at();


drop trigger if exists hr_employee_payroll_settings_updated_at
on public.hr_employee_payroll_settings;

create trigger hr_employee_payroll_settings_updated_at
before update on public.hr_employee_payroll_settings
for each row
execute function public.hr_set_updated_at();


/* ============================================================
   12. ROW LEVEL SECURITY
============================================================ */

alter table public.hr_payroll_periods enable row level security;

alter table public.hr_payroll_runs enable row level security;

alter table public.hr_payroll_entries enable row level security;

alter table public.hr_payroll_allowances enable row level security;

alter table public.hr_payroll_deductions enable row level security;

alter table public.hr_payslips enable row level security;

alter table public.hr_payroll_rules enable row level security;

alter table public.hr_employee_payroll_settings enable row level security;


/* ============================================================
   13. AUTHENTICATED USER POLICIES
============================================================ */

/* Payroll periods */

create policy "Authenticated users can view payroll periods"
on public.hr_payroll_periods
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll periods"
on public.hr_payroll_periods
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll periods"
on public.hr_payroll_periods
for update
to authenticated
using (true)
with check (true);


/* Payroll runs */

create policy "Authenticated users can view payroll runs"
on public.hr_payroll_runs
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll runs"
on public.hr_payroll_runs
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll runs"
on public.hr_payroll_runs
for update
to authenticated
using (true)
with check (true);


/* Payroll entries */

create policy "Authenticated users can view payroll entries"
on public.hr_payroll_entries
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll entries"
on public.hr_payroll_entries
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll entries"
on public.hr_payroll_entries
for update
to authenticated
using (true)
with check (true);


/* Allowances */

create policy "Authenticated users can view payroll allowances"
on public.hr_payroll_allowances
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll allowances"
on public.hr_payroll_allowances
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll allowances"
on public.hr_payroll_allowances
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete payroll allowances"
on public.hr_payroll_allowances
for delete
to authenticated
using (true);


/* Deductions */

create policy "Authenticated users can view payroll deductions"
on public.hr_payroll_deductions
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll deductions"
on public.hr_payroll_deductions
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll deductions"
on public.hr_payroll_deductions
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete payroll deductions"
on public.hr_payroll_deductions
for delete
to authenticated
using (true);


/* Payslips */

create policy "Authenticated users can view payslips"
on public.hr_payslips
for select
to authenticated
using (true);

create policy "Authenticated users can insert payslips"
on public.hr_payslips
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payslips"
on public.hr_payslips
for update
to authenticated
using (true)
with check (true);


/* Payroll rules */

create policy "Authenticated users can view payroll rules"
on public.hr_payroll_rules
for select
to authenticated
using (true);

create policy "Authenticated users can insert payroll rules"
on public.hr_payroll_rules
for insert
to authenticated
with check (true);

create policy "Authenticated users can update payroll rules"
on public.hr_payroll_rules
for update
to authenticated
using (true)
with check (true);


/* Employee payroll settings */

create policy "Authenticated users can view employee payroll settings"
on public.hr_employee_payroll_settings
for select
to authenticated
using (true);

create policy "Authenticated users can insert employee payroll settings"
on public.hr_employee_payroll_settings
for insert
to authenticated
with check (true);

create policy "Authenticated users can update employee payroll settings"
on public.hr_employee_payroll_settings
for update
to authenticated
using (true)
with check (true);


/* ============================================================
   14. INITIAL PAYROLL RULE PLACEHOLDERS
============================================================ */

insert into public.hr_payroll_rules
(
    name,
    code,
    description,
    rule_type,
    calculation_type,
    taxable,
    mandatory,
    active
)
values

(
    'PAYE',
    'PAYE',
    'Pay As You Earn income tax. Rates and thresholds will be configured separately.',
    'Tax',
    'Progressive',
    false,
    true,
    true
),

(
    'NAPSA',
    'NAPSA',
    'National Pension Scheme contribution.',
    'Contribution',
    'Percentage',
    false,
    true,
    true
),

(
    'NHIMA',
    'NHIMA',
    'National Health Insurance contribution.',
    'Contribution',
    'Percentage',
    false,
    true,
    true
)

on conflict (code) do nothing;


commit;
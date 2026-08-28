begin;

-- ============================================================
-- 011_customer_loans_staff_workflow.sql
-- Alessandro Enterprises
-- Customer Loans - Staff Operational Workflow
-- ============================================================


-- ============================================================
-- 1. CUSTOMER NRC
-- ============================================================

alter table public.customers
add column if not exists national_id text;


-- ============================================================
-- 2. COLLATERAL CATALOGUE
-- ============================================================

create table if not exists public.collateral_catalogue (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    description text,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint collateral_catalogue_name_unique
        unique (name)
);


-- ============================================================
-- 3. ADD OPERATIONAL LOAN FIELDS
-- ============================================================

alter table public.customer_loan_applications
add column if not exists collateral_id uuid
    references public.collateral_catalogue(id)
    on delete set null,

add column if not exists collateral_worth numeric(14,2),

add column if not exists account_operator_id uuid
    references public.operators(id)
    on delete set null,

add column if not exists due_date date;


-- ============================================================
-- 4. FINANCIAL VALIDATION
-- ============================================================

alter table public.customer_loan_applications
add constraint customer_loan_requested_amount_positive
check (requested_amount > 0);


alter table public.customer_loan_applications
add constraint customer_loan_amount_paid_non_negative
check (amount_paid >= 0);


alter table public.customer_loan_applications
add constraint customer_loan_collateral_worth_non_negative
check (
    collateral_worth is null
    or collateral_worth >= 0
);


-- ============================================================
-- 5. INDEXES
-- ============================================================

create index if not exists
idx_customer_loan_applications_customer
on public.customer_loan_applications(customer_id);


create index if not exists
idx_customer_loan_applications_operator
on public.customer_loan_applications(account_operator_id);


create index if not exists
idx_customer_loan_applications_collateral
on public.customer_loan_applications(collateral_id);


create index if not exists
idx_customer_loan_applications_due_date
on public.customer_loan_applications(due_date);


create index if not exists
idx_collateral_catalogue_active
on public.collateral_catalogue(active);


-- ============================================================
-- 6. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.customer_loan_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists
customer_loan_applications_updated_at
on public.customer_loan_applications;


create trigger customer_loan_applications_updated_at
before update on public.customer_loan_applications
for each row
execute function public.customer_loan_set_updated_at();


drop trigger if exists
collateral_catalogue_updated_at
on public.collateral_catalogue;


create trigger collateral_catalogue_updated_at
before update on public.collateral_catalogue
for each row
execute function public.customer_loan_set_updated_at();


-- ============================================================
-- 7. COLLATERAL CATALOGUE RLS
-- ============================================================

alter table public.collateral_catalogue
enable row level security;


create policy "Authenticated users can view active collateral"
on public.collateral_catalogue
for select
to authenticated
using (true);


create policy "Configuration admins can insert collateral"
on public.collateral_catalogue
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update collateral"
on public.collateral_catalogue
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete collateral"
on public.collateral_catalogue
for delete
to authenticated
using (
    public.is_configuration_admin()
);


-- ============================================================
-- 8. INITIAL COLLATERAL CATALOGUE
-- ============================================================

insert into public.collateral_catalogue
(name, description)
values
    ('TV', 'Television'),
    ('Stove', 'Cooking stove'),
    ('Fridge', 'Refrigerator'),
    ('Microwave', 'Microwave oven'),
    ('Phone', 'Mobile phone'),
    ('Laptop', 'Laptop computer')
on conflict (name) do nothing;


commit;
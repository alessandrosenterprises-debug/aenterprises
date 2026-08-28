begin;

-- ============================================================
-- 011_customer_loans.sql
-- Alessandro Enterprises
-- Customer Loan Application Foundation
--
-- Used by:
-- 1. Customer App
-- 2. Walk-in customer applications entered by staff
--
-- Separate from HR employee loans/advances.
-- ============================================================


-- ============================================================
-- CUSTOMER LOAN APPLICATIONS
-- ============================================================

create table if not exists public.customer_loan_applications (
    id uuid primary key default gen_random_uuid(),

    customer_id uuid not null
        references public.customers(id)
        on delete restrict,

    loan_product_id uuid
        references public.loan_products(id)
        on delete set null,

    -- --------------------------------------------------------
    -- Application information
    -- --------------------------------------------------------

    application_number text unique,

    application_source text not null default 'Customer App'
        check (
            application_source in (
                'Customer App',
                'Walk-in'
            )
        ),

    application_date date not null default current_date,

    -- --------------------------------------------------------
    -- Loan information
    -- --------------------------------------------------------

    loan_type text not null,

    requested_amount numeric(14,2) not null,

    approved_amount numeric(14,2),

    interest_rate numeric(8,2),

    repayment_period integer,

    monthly_installment numeric(14,2),

    total_payable numeric(14,2),

    amount_paid numeric(14,2) not null default 0,

    outstanding_balance numeric(14,2),

    -- --------------------------------------------------------
    -- Purpose
    -- --------------------------------------------------------

    loan_purpose text,

    -- --------------------------------------------------------
    -- Collateral
    -- --------------------------------------------------------

    collateral_required boolean not null default false,

    collateral_description text,

    -- --------------------------------------------------------
    -- Application status
    -- --------------------------------------------------------

    status text not null default 'Pending'
        check (
            status in (
                'Pending',
                'Under Review',
                'Approved',
                'Rejected',
                'Active',
                'Completed',
                'Cancelled'
            )
        ),

    -- --------------------------------------------------------
    -- Approval / rejection
    -- --------------------------------------------------------

    approved_by uuid
        references auth.users(id)
        on delete set null,

    approved_at timestamptz,

    rejection_reason text,

    -- --------------------------------------------------------
    -- Additional information
    -- --------------------------------------------------------

    notes text,

    -- --------------------------------------------------------
    -- Audit timestamps
    -- --------------------------------------------------------

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_customer_loan_applications_customer
    on public.customer_loan_applications(customer_id);

create index if not exists idx_customer_loan_applications_product
    on public.customer_loan_applications(loan_product_id);

create index if not exists idx_customer_loan_applications_status
    on public.customer_loan_applications(status);

create index if not exists idx_customer_loan_applications_date
    on public.customer_loan_applications(application_date);

create index if not exists idx_customer_loan_applications_source
    on public.customer_loan_applications(application_source);


-- ============================================================
-- UPDATED_AT FUNCTION
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


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists customer_loan_applications_updated_at
on public.customer_loan_applications;

create trigger customer_loan_applications_updated_at
before update on public.customer_loan_applications
for each row
execute function public.customer_loan_set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.customer_loan_applications
enable row level security;


-- ============================================================
-- AUTHENTICATED USERS CAN VIEW APPLICATIONS
-- ============================================================

create policy "Authenticated users can view customer loan applications"
on public.customer_loan_applications
for select
to authenticated
using (true);


-- ============================================================
-- AUTHENTICATED USERS CAN CREATE APPLICATIONS
-- ============================================================

create policy "Authenticated users can create customer loan applications"
on public.customer_loan_applications
for insert
to authenticated
with check (true);


-- ============================================================
-- AUTHENTICATED USERS CAN UPDATE APPLICATIONS
-- ============================================================

create policy "Authenticated users can update customer loan applications"
on public.customer_loan_applications
for update
to authenticated
using (true)
with check (true);


-- ============================================================
-- AUTHENTICATED USERS CAN DELETE APPLICATIONS
-- ============================================================

create policy "Authenticated users can delete customer loan applications"
on public.customer_loan_applications
for delete
to authenticated
using (true);


commit;
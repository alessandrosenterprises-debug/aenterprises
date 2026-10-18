-- Loan repayment terms are separate from loan product eligibility.
-- This is idempotent so it also supports databases where the table was
-- previously created manually.

create table if not exists public.loan_product_terms (
  id uuid primary key default gen_random_uuid(),
  loan_product_id uuid not null references public.loan_products(id) on delete cascade,
  period_days integer not null check (period_days > 0),
  interest_rate numeric(8,2) not null default 0 check (interest_rate >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.loan_product_terms
  add column if not exists loan_product_id uuid references public.loan_products(id) on delete cascade,
  add column if not exists period_days integer,
  add column if not exists interest_rate numeric(8,2) default 0,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_loan_product_terms_product_active_period
  on public.loan_product_terms(loan_product_id, active, period_days);

alter table public.loan_product_terms enable row level security;

drop policy if exists "Authenticated users can read loan product terms"
  on public.loan_product_terms;
create policy "Authenticated users can read loan product terms"
  on public.loan_product_terms for select to authenticated using (true);

drop policy if exists "Configuration admins can insert loan product terms"
  on public.loan_product_terms;
create policy "Configuration admins can insert loan product terms"
  on public.loan_product_terms for insert to authenticated
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can update loan product terms"
  on public.loan_product_terms;
create policy "Configuration admins can update loan product terms"
  on public.loan_product_terms for update to authenticated
  using (public.is_configuration_admin())
  with check (public.is_configuration_admin());

drop policy if exists "Configuration admins can delete loan product terms"
  on public.loan_product_terms;
create policy "Configuration admins can delete loan product terms"
  on public.loan_product_terms for delete to authenticated
  using (public.is_configuration_admin());

grant select, insert, update, delete on public.loan_product_terms to authenticated;

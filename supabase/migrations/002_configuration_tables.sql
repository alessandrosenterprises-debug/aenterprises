-- ============================================================
-- Alessandro Enterprises
-- Migration 002: Configuration Tables
-- ============================================================

-- ============================================================
-- Helper function
-- Determines whether the currently authenticated user has
-- permission to manage enterprise configuration.
-- ============================================================

create or replace function public.is_configuration_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    user_role text;
begin
    select r.name
    into user_role
    from public.profiles p
    join public.roles r
        on r.id = p.role_id
    where p.auth_user_id = auth.uid()
      and p.active = true
    limit 1;

    return user_role in (
        'Super Administrator',
        'Enterprise Manager'
    );
end;
$$;

grant execute on function public.is_configuration_admin()
to authenticated;


-- ============================================================
-- Mobile Money Services
-- ============================================================

create table if not exists public.mobile_money_services (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    service_type text not null,

    description text,

    status text not null default 'Active',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint mobile_money_services_status_check
        check (status in ('Active', 'Inactive'))
);


-- ============================================================
-- Loan Products
-- ============================================================

create table if not exists public.loan_products (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    description text,

    min_amount numeric(14,2),

    max_amount numeric(14,2),

    interest_rate numeric(8,2),

    repayment_period integer,

    requires_collateral boolean not null default false,

    status text not null default 'Active',

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint loan_products_status_check
        check (status in ('Active', 'Inactive')),

    constraint loan_products_amount_check
        check (
            min_amount is null
            or max_amount is null
            or max_amount >= min_amount
        ),

    constraint loan_products_interest_check
        check (
            interest_rate is null
            or interest_rate >= 0
        ),

    constraint loan_products_repayment_check
        check (
            repayment_period is null
            or repayment_period > 0
        )
);


-- ============================================================
-- Company Settings
-- One enterprise-wide settings record.
-- ============================================================

create table if not exists public.company_settings (
    id uuid primary key default gen_random_uuid(),

    company_name text not null default 'Alessandro Enterprises',

    tagline text,

    description text,

    logo_url text,

    phone text,

    email text,

    address text,

    city text,

    country text default 'Zambia',

    website text,

    currency text not null default 'ZMW',

    timezone text not null default 'Africa/Lusaka',

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    singleton_key text not null default 'default',

    constraint company_settings_singleton
        unique (singleton_key)
);


-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_mobile_money_services_status
on public.mobile_money_services(status);

create index if not exists idx_mobile_money_services_service_type
on public.mobile_money_services(service_type);

create index if not exists idx_loan_products_status
on public.loan_products(status);

create index if not exists idx_company_settings_active
on public.company_settings(active);


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.mobile_money_services
enable row level security;

alter table public.loan_products
enable row level security;

alter table public.company_settings
enable row level security;


-- ============================================================
-- READ POLICIES
-- Authenticated users may read configuration.
-- ============================================================

create policy "Authenticated users can read mobile money services"
on public.mobile_money_services
for select
to authenticated
using (true);


create policy "Authenticated users can read loan products"
on public.loan_products
for select
to authenticated
using (true);


create policy "Authenticated users can read company settings"
on public.company_settings
for select
to authenticated
using (true);


-- ============================================================
-- WRITE POLICIES
-- Only Super Administrator and Enterprise Manager.
-- ============================================================

create policy "Configuration admins can insert mobile money services"
on public.mobile_money_services
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update mobile money services"
on public.mobile_money_services
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete mobile money services"
on public.mobile_money_services
for delete
to authenticated
using (
    public.is_configuration_admin()
);


create policy "Configuration admins can insert loan products"
on public.loan_products
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update loan products"
on public.loan_products
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete loan products"
on public.loan_products
for delete
to authenticated
using (
    public.is_configuration_admin()
);


create policy "Configuration admins can insert company settings"
on public.company_settings
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update company settings"
on public.company_settings
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete company settings"
on public.company_settings
for delete
to authenticated
using (
    public.is_configuration_admin()
);


-- ============================================================
-- Default Company Settings
-- ============================================================

insert into public.company_settings (
    company_name,
    country,
    currency,
    timezone,
    singleton_key
)
values (
    'Alessandro Enterprises',
    'Zambia',
    'ZMW',
    'Africa/Lusaka',
    'default'
)
on conflict (singleton_key) do nothing;
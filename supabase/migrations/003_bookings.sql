-- ============================================================
-- Alessandro Enterprises
-- Migration 003: Bookings and Reporting Foundation
-- ============================================================

create table if not exists public.bookings (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete restrict,

    customer_id uuid
        references public.customers(id)
        on delete set null,

    employee_id uuid
        references public.employees(id)
        on delete set null,

    branch_id uuid
        references public.branches(id)
        on delete set null,

    catalog_item_id uuid
        references public.enterprise_catalog(id)
        on delete set null,

    booking_date date not null default current_date,

    booking_time time,

    status text not null default 'Pending',

    payment_status text not null default 'Pending',

    amount numeric(14,2) not null default 0,

    notes text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint bookings_status_check
        check (
            status in (
                'Pending',
                'Confirmed',
                'Completed',
                'Cancelled'
            )
        ),

    constraint bookings_payment_status_check
        check (
            payment_status in (
                'Pending',
                'Partial',
                'Paid',
                'Refunded'
            )
        ),

    constraint bookings_amount_check
        check (amount >= 0)
);


-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_bookings_business_id
on public.bookings(business_id);

create index if not exists idx_bookings_customer_id
on public.bookings(customer_id);

create index if not exists idx_bookings_employee_id
on public.bookings(employee_id);

create index if not exists idx_bookings_branch_id
on public.bookings(branch_id);

create index if not exists idx_bookings_catalog_item_id
on public.bookings(catalog_item_id);

create index if not exists idx_bookings_booking_date
on public.bookings(booking_date);

create index if not exists idx_bookings_status
on public.bookings(status);

create index if not exists idx_bookings_payment_status
on public.bookings(payment_status);


-- ============================================================
-- Updated-at helper
-- ============================================================

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


drop trigger if exists bookings_set_updated_at
on public.bookings;

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_bookings_updated_at();


-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.bookings enable row level security;


-- ============================================================
-- Read policy
-- ============================================================

create policy "Authenticated users can read bookings"
on public.bookings
for select
to authenticated
using (true);


-- ============================================================
-- Write policies
--
-- Configuration administrators can manage all bookings.
-- ============================================================

create policy "Configuration admins can insert bookings"
on public.bookings
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update bookings"
on public.bookings
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete bookings"
on public.bookings
for delete
to authenticated
using (
    public.is_configuration_admin()
);
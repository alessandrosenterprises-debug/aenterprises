create table if not exists public.technology_consultation_requests (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid references public.customers(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,

  name text not null,
  phone text not null,
  email text,

  consultation_type text not null default 'general',

  preferred_date date,
  preferred_time text,

  subject text,
  message text not null,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Contacted',
        'Scheduled',
        'Completed',
        'Cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_technology_consultations_customer
  on public.technology_consultation_requests(customer_id);

create index if not exists idx_technology_consultations_business
  on public.technology_consultation_requests(business_id);

create index if not exists idx_technology_consultations_status
  on public.technology_consultation_requests(status);

create index if not exists idx_technology_consultations_created_at
  on public.technology_consultation_requests(created_at desc);

alter table public.technology_consultation_requests
enable row level security;

create policy "Customers can view their own technology consultations"
on public.technology_consultation_requests
for select
to authenticated
using (
  customer_id in (
    select id
    from public.customers
    where auth_user_id = auth.uid()
  )
);

create policy "Customers can create their own technology consultations"
on public.technology_consultation_requests
for insert
to authenticated
with check (
  customer_id in (
    select id
    from public.customers
    where auth_user_id = auth.uid()
  )
);

create or replace function public.update_technology_consultation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists technology_consultation_updated_at
on public.technology_consultation_requests;

create trigger technology_consultation_updated_at
before update on public.technology_consultation_requests
for each row
execute function public.update_technology_consultation_updated_at();
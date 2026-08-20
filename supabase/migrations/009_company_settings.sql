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

  currency text default 'ZMW',
  timezone text default 'Africa/Lusaka',

  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_settings_company_name_idx
on public.company_settings(company_name);
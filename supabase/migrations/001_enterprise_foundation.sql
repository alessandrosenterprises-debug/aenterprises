create table if not exists public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz default now()
);

insert into public.roles (name, description)
values
('Super Administrator','Full enterprise access'),
('Enterprise Manager','Manages the enterprise'),
('Business Manager','Manages assigned businesses'),
('Supervisor','Supervises employees'),
('Employee','Standard employee'),
('Customer','Customer portal user')
on conflict (name) do nothing;
create table if not exists public.businesses (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    description text,
    logo_url text,
    active boolean default true,
    created_at timestamptz default now()
);

insert into public.businesses
(name,slug)
values
('Alessandro Elite Fashion','elite-fashion'),
('Alessandro Classic Barbershop','classic-barbershop'),
('Alessandro Mobile Money','mobile-money'),
('Alessandro Soft Loans','soft-loans'),
('Alessandro Tech Solutions','tech-solutions')
on conflict (slug) do nothing;

create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),

    auth_user_id uuid unique not null references auth.users(id) on delete cascade,

    first_name text,
    last_name text,
    display_name text,

    email text not null,

    phone text,

    avatar_url text,

    role_id uuid references public.roles(id),

    active boolean default true,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);
create table if not exists public.user_businesses (
    user_id uuid references public.profiles(id) on delete cascade,

    business_id uuid references public.businesses(id) on delete cascade,

    primary key (user_id,business_id)
);
alter table public.roles enable row level security;

alter table public.businesses enable row level security;

alter table public.profiles enable row level security;

alter table public.user_businesses enable row level security;

create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);

create policy "Authenticated users can read businesses"
on public.businesses
for select
to authenticated
using (true);

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
    auth.uid() = auth_user_id
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
    auth.uid() = auth_user_id
);

create policy "Authenticated users can read user businesses"
on public.user_businesses
for select
to authenticated
using (true);
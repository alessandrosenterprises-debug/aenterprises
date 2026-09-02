-- ============================================================
-- 013 BUSINESS CONTENT
-- Gallery, Promotions and Business Posts
-- ============================================================

-- ============================================================
-- BUSINESS GALLERY
-- ============================================================

create table if not exists public.business_gallery (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    image_url text not null,

    title text,

    caption text,

    is_featured boolean not null default false,

    display_order integer not null default 0,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- BUSINESS PROMOTIONS
-- ============================================================

create table if not exists public.business_promotions (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    title text not null,

    description text,

    image_url text,

    discount_text text,

    price numeric(14,2),

    start_date timestamptz,

    end_date timestamptz,

    featured boolean not null default false,

    published boolean not null default true,

    active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- BUSINESS POSTS / UPDATES
-- ============================================================

create table if not exists public.business_posts (
    id uuid primary key default gen_random_uuid(),

    business_id uuid not null
        references public.businesses(id)
        on delete cascade,

    title text not null,

    content text,

    image_url text,

    post_type text not null default 'update',

    published boolean not null default true,

    featured boolean not null default false,

    published_at timestamptz default now(),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists business_gallery_business_id_idx
    on public.business_gallery(business_id);

create index if not exists business_gallery_active_idx
    on public.business_gallery(active);

create index if not exists business_gallery_order_idx
    on public.business_gallery(
        business_id,
        display_order
    );


create index if not exists business_promotions_business_id_idx
    on public.business_promotions(business_id);

create index if not exists business_promotions_active_idx
    on public.business_promotions(active);

create index if not exists business_promotions_dates_idx
    on public.business_promotions(
        business_id,
        start_date,
        end_date
    );


create index if not exists business_posts_business_id_idx
    on public.business_posts(business_id);

create index if not exists business_posts_published_idx
    on public.business_posts(published);

create index if not exists business_posts_published_at_idx
    on public.business_posts(
        business_id,
        published_at desc
    );


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.business_gallery
    enable row level security;

alter table public.business_promotions
    enable row level security;

alter table public.business_posts
    enable row level security;


-- ============================================================
-- CUSTOMER READ POLICIES
-- ============================================================

create policy "Authenticated users can read active gallery"
on public.business_gallery
for select
to authenticated
using (
    active = true
);


create policy "Authenticated users can read published promotions"
on public.business_promotions
for select
to authenticated
using (
    active = true
    and published = true
);


create policy "Authenticated users can read published posts"
on public.business_posts
for select
to authenticated
using (
    published = true
);


-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists business_gallery_updated_at
on public.business_gallery;

create trigger business_gallery_updated_at
before update on public.business_gallery
for each row
execute function public.set_updated_at();


drop trigger if exists business_promotions_updated_at
on public.business_promotions;

create trigger business_promotions_updated_at
before update on public.business_promotions
for each row
execute function public.set_updated_at();


drop trigger if exists business_posts_updated_at
on public.business_posts;

create trigger business_posts_updated_at
before update on public.business_posts
for each row
execute function public.set_updated_at();
-- Facebook Page publishing queue for AEOS website content.
-- OAuth tokens are kept in server environment secrets, never in this table.

alter table if exists public.enterprise_catalog
  add column if not exists facebook_auto_publish boolean not null default true,
  add column if not exists facebook_publish_at timestamptz;
alter table if exists public.business_promotions
  add column if not exists facebook_auto_publish boolean not null default true,
  add column if not exists facebook_publish_at timestamptz;
alter table if exists public.business_posts
  add column if not exists facebook_auto_publish boolean not null default true,
  add column if not exists facebook_publish_at timestamptz;
alter table if exists public.mobile_money_services
  add column if not exists facebook_auto_publish boolean not null default true,
  add column if not exists facebook_publish_at timestamptz;
alter table if exists public.loan_products
  add column if not exists facebook_auto_publish boolean not null default true,
  add column if not exists facebook_publish_at timestamptz;

create table if not exists public.facebook_publish_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  content_type text not null check (content_type in ('product', 'service', 'promotion', 'announcement')),
  content_id uuid not null,
  title text not null,
  message text not null,
  media_url text,
  link_url text,
  idempotency_key text not null unique,
  scheduled_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'processing', 'retrying', 'published', 'failed', 'paused', 'needs_review', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  locked_at timestamptz,
  facebook_post_id text,
  published_at timestamptz,
  last_error text,
  created_by_auth_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facebook_publish_queue_due_idx
  on public.facebook_publish_queue(status, scheduled_at, next_attempt_at)
  where status in ('pending', 'retrying');

create index if not exists facebook_publish_queue_business_created_idx
  on public.facebook_publish_queue(business_id, created_at desc);

alter table public.facebook_publish_queue enable row level security;
revoke all on table public.facebook_publish_queue from anon, authenticated;
grant select on table public.facebook_publish_queue to authenticated;
grant all on table public.facebook_publish_queue to service_role;

drop policy if exists facebook_publish_queue_read on public.facebook_publish_queue;
create policy facebook_publish_queue_read
  on public.facebook_publish_queue for select to authenticated
  using (public.has_permission('businesses.manage') and public.can_access_business(business_id));

drop trigger if exists facebook_publish_queue_updated_at on public.facebook_publish_queue;
create trigger facebook_publish_queue_updated_at
  before update on public.facebook_publish_queue
  for each row execute function public.set_updated_at();

create or replace function public.claim_due_facebook_publish_queue(p_limit integer default 10, p_queue_id uuid default null)
returns setof public.facebook_publish_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A worker that vanished while holding a row may have already posted to
  -- Facebook. Do not retry it automatically; send it for human review.
  update public.facebook_publish_queue
  set status = 'needs_review',
      locked_at = null,
      last_error = 'Publisher stopped before recording Facebook confirmation. Check the Page before retrying to avoid a duplicate.'
  where status = 'processing'
    and locked_at < now() - interval '10 minutes';

  return query
  with candidates as (
    select q.id
    from public.facebook_publish_queue q
    where (
      (q.status = 'pending' and q.scheduled_at <= now())
      or (q.status = 'retrying' and coalesce(q.next_attempt_at, q.scheduled_at) <= now())
    )
      and (p_queue_id is null or q.id = p_queue_id)
    order by coalesce(q.next_attempt_at, q.scheduled_at), q.created_at
    for update skip locked
    limit least(greatest(coalesce(p_limit, 10), 1), 50)
  )
  update public.facebook_publish_queue q
  set status = 'processing', locked_at = now(), attempt_count = q.attempt_count + 1
  from candidates c
  where q.id = c.id
  returning q.*;
end;
$$;

revoke all on function public.claim_due_facebook_publish_queue(integer, uuid) from public, anon, authenticated;
grant execute on function public.claim_due_facebook_publish_queue(integer, uuid) to service_role;

comment on table public.facebook_publish_queue is 'Server-side queue and audit history for Facebook Page posts initiated from AEOS website content.';

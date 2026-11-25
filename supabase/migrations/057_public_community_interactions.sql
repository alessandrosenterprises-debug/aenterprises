-- Public website community reactions and comments.
-- Writes are handled by the validated server API; browser roles cannot access
-- these tables directly.
create table if not exists public.website_community_likes (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('post', 'offer')),
  content_id uuid not null,
  visitor_key uuid not null,
  created_at timestamptz not null default now(),
  unique (content_type, content_id, visitor_key)
);

create table if not exists public.website_community_comments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('post', 'offer')),
  content_id uuid not null,
  visitor_key uuid not null,
  visitor_name text not null check (char_length(visitor_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists website_community_likes_content_idx
  on public.website_community_likes (content_type, content_id);
create index if not exists website_community_comments_content_idx
  on public.website_community_comments (content_type, content_id, created_at desc);
create index if not exists website_community_comments_visitor_idx
  on public.website_community_comments (visitor_key, created_at desc);

alter table public.website_community_likes enable row level security;
alter table public.website_community_comments enable row level security;

revoke all on public.website_community_likes from anon, authenticated;
revoke all on public.website_community_comments from anon, authenticated;
grant all on public.website_community_likes to service_role;
grant all on public.website_community_comments to service_role;

create or replace function public.get_website_community_stats(p_targets jsonb, p_visitor_key uuid)
returns table (
  content_type text,
  content_id uuid,
  like_count bigint,
  comment_count bigint,
  liked_by_visitor boolean,
  recent_comments jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    target.content_type,
    target.content_id,
    (select count(*) from public.website_community_likes as likes where likes.content_type = target.content_type and likes.content_id = target.content_id),
    (select count(*) from public.website_community_comments as comments where comments.content_type = target.content_type and comments.content_id = target.content_id),
    exists(select 1 from public.website_community_likes as likes where likes.content_type = target.content_type and likes.content_id = target.content_id and likes.visitor_key = p_visitor_key),
    coalesce((
      select jsonb_agg(jsonb_build_object('id', recent.id, 'visitor_name', recent.visitor_name, 'message', recent.message, 'created_at', recent.created_at) order by recent.created_at desc)
      from (
        select comments.id, comments.visitor_name, comments.message, comments.created_at
        from public.website_community_comments as comments
        where comments.content_type = target.content_type and comments.content_id = target.content_id
        order by comments.created_at desc
        limit 3
      ) as recent
    ), '[]'::jsonb)
  from jsonb_to_recordset(p_targets) as target(content_type text, content_id uuid)
  where target.content_type in ('post', 'offer');
$$;

revoke all on function public.get_website_community_stats(jsonb, uuid) from public;
grant execute on function public.get_website_community_stats(jsonb, uuid) to anon, authenticated, service_role;

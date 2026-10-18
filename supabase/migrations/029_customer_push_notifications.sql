begin;

-- Store one Expo push token per signed-in device. Tokens are private to their owner.
create table if not exists public.customer_push_tokens (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  is_enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id, expo_push_token)
);

create index if not exists idx_customer_push_tokens_enabled_user
  on public.customer_push_tokens(auth_user_id) where is_enabled;

alter table public.customer_push_tokens enable row level security;
drop policy if exists "Customers manage their own push tokens" on public.customer_push_tokens;
create policy "Customers manage their own push tokens"
  on public.customer_push_tokens
  for all
  to authenticated
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);
grant select, insert, update, delete on public.customer_push_tokens to authenticated;

-- pg_net queues the Expo request outside the notification transaction. A temporary
-- push-provider/network failure must never prevent AEOS from saving the notification.
create extension if not exists pg_net;

create or replace function public.send_customer_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  push_messages jsonb;
  unread_count bigint;
begin
  if new.user_id is null or coalesce(new.unread, false) is not true then
    return new;
  end if;

  select count(*) into unread_count
  from public.notifications notification
  where notification.user_id = new.user_id
    and notification.unread is true;

  select coalesce(jsonb_agg(device_message), '[]'::jsonb)
    into push_messages
  from (
    select jsonb_build_object(
      'to', token.expo_push_token,
      'title', coalesce(nullif(new.title, ''), 'Alessandro Enterprises'),
      'body', coalesce(nullif(new.preview, ''), nullif(new.message, ''), 'You have a new update.'),
      'sound', 'default',
      'badge', unread_count,
      'priority', 'high',
      'channelId', 'customer-updates-v2',
      'data', jsonb_build_object('action_url', new.action_url, 'notification_id', new.id)
    ) as device_message
    from public.customer_push_tokens token
    join public.profiles profile on profile.auth_user_id = token.auth_user_id
    where profile.id = new.user_id
      and token.is_enabled is true
    order by token.last_seen_at desc
    limit 100
  ) enabled_devices;

  if jsonb_array_length(push_messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb,
      body := push_messages,
      timeout_milliseconds := 5000
    );
  end if;
  return new;
exception when others then
  -- Keep notification creation reliable even if pg_net or Expo is temporarily down.
  raise warning 'Customer push notification could not be queued (SQLSTATE %)', SQLSTATE;
  return new;
end;
$$;

drop trigger if exists notifications_send_customer_push on public.notifications;
create trigger notifications_send_customer_push
  after insert on public.notifications
  for each row execute function public.send_customer_push_notification();

commit;

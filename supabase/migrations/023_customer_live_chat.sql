-- Dedicated customer-to-AEOS live chat, separate from the Messages module.
create or replace function public.is_live_chat_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid()
      and p.active = true
      and lower(r.name) <> 'customer'
  );
$$;

revoke all on function public.is_live_chat_staff() from public;
grant execute on function public.is_live_chat_staff() to authenticated;

create table if not exists public.customer_live_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'Open' check (status in ('Open', 'Closed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_live_chat_sessions(id) on delete cascade,
  sender_auth_user_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'staff')),
  sender_name text not null,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists customer_live_chat_sessions_customer_idx
  on public.customer_live_chat_sessions(customer_id, last_message_at desc);
create index if not exists customer_live_chat_sessions_queue_idx
  on public.customer_live_chat_sessions(status, last_message_at desc);
create index if not exists customer_live_chat_messages_session_idx
  on public.customer_live_chat_messages(session_id, created_at);

alter table public.customer_live_chat_sessions enable row level security;
alter table public.customer_live_chat_messages enable row level security;
grant select, insert, update on public.customer_live_chat_sessions to authenticated;
grant select, insert on public.customer_live_chat_messages to authenticated;

drop policy if exists "Customers and staff can view live chat sessions" on public.customer_live_chat_sessions;
create policy "Customers and staff can view live chat sessions"
on public.customer_live_chat_sessions for select to authenticated
using (
  public.is_live_chat_staff()
  or customer_id in (
    select c.id from public.customers c where c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can start live chat sessions" on public.customer_live_chat_sessions;
create policy "Customers can start live chat sessions"
on public.customer_live_chat_sessions for insert to authenticated
with check (
  status = 'Open'
  and assigned_to is null
  and customer_id in (
    select c.id from public.customers c where c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage live chat sessions" on public.customer_live_chat_sessions;
create policy "Staff can manage live chat sessions"
on public.customer_live_chat_sessions for update to authenticated
using (public.is_live_chat_staff())
with check (public.is_live_chat_staff());

drop policy if exists "Customers and staff can read live chat messages" on public.customer_live_chat_messages;
create policy "Customers and staff can read live chat messages"
on public.customer_live_chat_messages for select to authenticated
using (
  public.is_live_chat_staff()
  or exists (
    select 1
    from public.customer_live_chat_sessions s
    join public.customers c on c.id = s.customer_id
    where s.id = session_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists "Chat participants can send live chat messages" on public.customer_live_chat_messages;
create policy "Chat participants can send live chat messages"
on public.customer_live_chat_messages for insert to authenticated
with check (
  sender_auth_user_id = auth.uid()
  and (
    (sender_role = 'staff' and public.is_live_chat_staff())
    or (sender_role = 'customer' and exists (
      select 1
      from public.customer_live_chat_sessions s
      join public.customers c on c.id = s.customer_id
      where s.id = session_id and s.status = 'Open' and c.auth_user_id = auth.uid()
    ))
  )
);

create or replace function public.touch_customer_live_chat_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.customer_live_chat_sessions
  set last_message_at = new.created_at, updated_at = now()
  where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists customer_live_chat_touch_session on public.customer_live_chat_messages;
create trigger customer_live_chat_touch_session
after insert on public.customer_live_chat_messages
for each row execute function public.touch_customer_live_chat_session();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customer_live_chat_sessions') then
      alter publication supabase_realtime add table public.customer_live_chat_sessions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'customer_live_chat_messages') then
      alter publication supabase_realtime add table public.customer_live_chat_messages;
    end if;
  end if;
end $$;

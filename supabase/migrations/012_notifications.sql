/* ============================================================
   011_notifications.sql
   Alessandro Enterprises
   Persistent Management Notifications
============================================================ */

begin;

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),

    type text not null default 'system'
        check (
            type in (
                'booking',
                'message',
                'issue',
                'system'
            )
        ),

    title text not null,

    sender text not null,

    preview text not null,

    message text not null,

    business text,

    notification_date text,

    amount text,

    subject text,

    is_read boolean not null default false,

    created_at timestamptz not null default now(),

    read_at timestamptz
);


/* ============================================================
   INDEXES
============================================================ */

create index if not exists idx_notifications_is_read
on public.notifications(is_read);

create index if not exists idx_notifications_created_at
on public.notifications(created_at desc);


/* ============================================================
   ROW LEVEL SECURITY
============================================================ */

alter table public.notifications enable row level security;


/* ============================================================
   READ POLICY
============================================================ */

create policy "Authenticated users can read notifications"
on public.notifications
for select
to authenticated
using (true);


/* ============================================================
   UPDATE POLICY
============================================================ */

create policy "Authenticated users can update notifications"
on public.notifications
for update
to authenticated
using (true)
with check (true);


/* ============================================================
   INSERT POLICY
============================================================ */

create policy "Authenticated users can insert notifications"
on public.notifications
for insert
to authenticated
with check (true);


/* ============================================================
   UPDATED READ TIMESTAMP
============================================================ */

create or replace function public.set_notification_read_at()
returns trigger
language plpgsql
as $$
begin
    if new.is_read = true
       and old.is_read = false then
        new.read_at = now();
    end if;

    if new.is_read = false then
        new.read_at = null;
    end if;

    return new;
end;
$$;


drop trigger if exists notifications_set_read_at
on public.notifications;

create trigger notifications_set_read_at
before update on public.notifications
for each row
execute function public.set_notification_read_at();

commit;
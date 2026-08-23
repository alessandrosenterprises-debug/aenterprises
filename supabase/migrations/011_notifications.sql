/* ============================================================
   011_notifications.sql
   Alessandro Enterprises
   Persistent Management Notifications
============================================================ */

begin;


/* ============================================================
   1. NOTIFICATIONS
============================================================ */

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),

    user_id uuid
        references public.profiles(id)
        on delete cascade,

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

    action_url text,

    unread boolean not null default true,

    read_at timestamptz,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


/* ============================================================
   2. INDEXES
============================================================ */

create index if not exists idx_notifications_user_id
on public.notifications(user_id);

create index if not exists idx_notifications_unread
on public.notifications(unread);

create index if not exists idx_notifications_created_at
on public.notifications(created_at desc);

create index if not exists idx_notifications_user_unread
on public.notifications(user_id, unread);


/* ============================================================
   3. UPDATED-AT FUNCTION
============================================================ */

create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


/* ============================================================
   4. UPDATED-AT TRIGGER
============================================================ */

drop trigger if exists notifications_set_updated_at
on public.notifications;

create trigger notifications_set_updated_at
before update on public.notifications
for each row
execute function public.set_notifications_updated_at();


/* ============================================================
   5. ROW LEVEL SECURITY
============================================================ */

alter table public.notifications enable row level security;


/* ============================================================
   6. READ POLICY
============================================================ */

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (
    user_id = (
        select id
        from public.profiles
        where auth_user_id = auth.uid()
    )
);


/* ============================================================
   7. MARK AS READ / UPDATE POLICY
============================================================ */

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (
    user_id = (
        select id
        from public.profiles
        where auth_user_id = auth.uid()
    )
)
with check (
    user_id = (
        select id
        from public.profiles
        where auth_user_id = auth.uid()
    )
);


/* ============================================================
   8. MANAGEMENT INSERT POLICY
============================================================ */

create policy "Configuration admins can insert notifications"
on public.notifications
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


/* ============================================================
   9. MANAGEMENT DELETE POLICY
============================================================ */

create policy "Configuration admins can delete notifications"
on public.notifications
for delete
to authenticated
using (
    public.is_configuration_admin()
);


commit;
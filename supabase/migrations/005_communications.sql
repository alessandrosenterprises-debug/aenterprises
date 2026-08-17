-- ============================================================
-- Alessandro Enterprises
-- Migration 005: Messages and Email Communications
-- ============================================================


-- ============================================================
-- CUSTOMER / BUSINESS MESSAGES
-- ============================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),

    business_id uuid
        references public.businesses(id)
        on delete set null,

    customer_id uuid
        references public.customers(id)
        on delete set null,

    assigned_to uuid
        references public.profiles(id)
        on delete set null,

    parent_message_id uuid
        references public.messages(id)
        on delete set null,

    sender_name text not null,

    sender_email text,

    sender_phone text,

    subject text,

    body text not null,

    source text not null default 'Customer',

    status text not null default 'Unread',

    priority text not null default 'Normal',

    created_at timestamptz not null default now(),

    read_at timestamptz,

    replied_at timestamptz,

    archived_at timestamptz,

    updated_at timestamptz not null default now(),

    constraint messages_status_check
        check (
            status in (
                'Unread',
                'Read',
                'Replied',
                'Archived'
            )
        ),

    constraint messages_priority_check
        check (
            priority in (
                'Low',
                'Normal',
                'High',
                'Urgent'
            )
        )
);


-- ============================================================
-- EMAILS
-- ============================================================

create table if not exists public.emails (
    id uuid primary key default gen_random_uuid(),

    business_id uuid
        references public.businesses(id)
        on delete set null,

    customer_id uuid
        references public.customers(id)
        on delete set null,

    assigned_to uuid
        references public.profiles(id)
        on delete set null,

    parent_email_id uuid
        references public.emails(id)
        on delete set null,

    sender_name text not null,

    sender_email text not null,

    recipient_email text,

    cc text,

    bcc text,

    subject text,

    body text not null,

    source text not null default 'Incoming',

    status text not null default 'Unread',

    priority text not null default 'Normal',

    created_at timestamptz not null default now(),

    read_at timestamptz,

    replied_at timestamptz,

    archived_at timestamptz,

    updated_at timestamptz not null default now(),

    constraint emails_status_check
        check (
            status in (
                'Unread',
                'Read',
                'Replied',
                'Archived'
            )
        ),

    constraint emails_priority_check
        check (
            priority in (
                'Low',
                'Normal',
                'High',
                'Urgent'
            )
        )
);


-- ============================================================
-- MESSAGE INDEXES
-- ============================================================

create index if not exists idx_messages_business_id
on public.messages(business_id);

create index if not exists idx_messages_customer_id
on public.messages(customer_id);

create index if not exists idx_messages_assigned_to
on public.messages(assigned_to);

create index if not exists idx_messages_parent_message_id
on public.messages(parent_message_id);

create index if not exists idx_messages_status
on public.messages(status);

create index if not exists idx_messages_priority
on public.messages(priority);

create index if not exists idx_messages_created_at
on public.messages(created_at);


-- ============================================================
-- EMAIL INDEXES
-- ============================================================

create index if not exists idx_emails_business_id
on public.emails(business_id);

create index if not exists idx_emails_customer_id
on public.emails(customer_id);

create index if not exists idx_emails_assigned_to
on public.emails(assigned_to);

create index if not exists idx_emails_parent_email_id
on public.emails(parent_email_id);

create index if not exists idx_emails_status
on public.emails(status);

create index if not exists idx_emails_priority
on public.emails(priority);

create index if not exists idx_emails_created_at
on public.emails(created_at);


-- ============================================================
-- UPDATED-AT FUNCTIONS
-- ============================================================

create or replace function public.set_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


create or replace function public.set_emails_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- UPDATED-AT TRIGGERS
-- ============================================================

drop trigger if exists messages_set_updated_at
on public.messages;

create trigger messages_set_updated_at
before update on public.messages
for each row
execute function public.set_messages_updated_at();


drop trigger if exists emails_set_updated_at
on public.emails;

create trigger emails_set_updated_at
before update on public.emails
for each row
execute function public.set_emails_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.messages enable row level security;

alter table public.emails enable row level security;


-- ============================================================
-- READ POLICIES
-- ============================================================

create policy "Authenticated users can read messages"
on public.messages
for select
to authenticated
using (true);


create policy "Authenticated users can read emails"
on public.emails
for select
to authenticated
using (true);


-- ============================================================
-- MESSAGE WRITE POLICIES
-- ============================================================

create policy "Configuration admins can insert messages"
on public.messages
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update messages"
on public.messages
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete messages"
on public.messages
for delete
to authenticated
using (
    public.is_configuration_admin()
);


-- ============================================================
-- EMAIL WRITE POLICIES
-- ============================================================

create policy "Configuration admins can insert emails"
on public.emails
for insert
to authenticated
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can update emails"
on public.emails
for update
to authenticated
using (
    public.is_configuration_admin()
)
with check (
    public.is_configuration_admin()
);


create policy "Configuration admins can delete emails"
on public.emails
for delete
to authenticated
using (
    public.is_configuration_admin()
);
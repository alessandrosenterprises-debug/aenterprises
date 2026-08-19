-- ============================================================
-- Alessandro Enterprises
-- Migration 006: Gmail Synchronization
-- ============================================================

alter table public.emails
add column if not exists gmail_message_id text;

alter table public.emails
add column if not exists gmail_thread_id text;

alter table public.emails
add column if not exists gmail_message_date timestamptz;

-- ============================================================
-- GMAIL INDEXES
-- ============================================================

create unique index if not exists idx_emails_gmail_message_id
on public.emails(gmail_message_id)
where gmail_message_id is not null;

create index if not exists idx_emails_gmail_thread_id
on public.emails(gmail_thread_id)
where gmail_thread_id is not null;

create index if not exists idx_emails_gmail_message_date
on public.emails(gmail_message_date)
where gmail_message_date is not null;

create index if not exists idx_emails_sender_email
on public.emails(sender_email);

create index if not exists idx_emails_recipient_email
on public.emails(recipient_email);
alter table public.emails
add column if not exists rfc_message_id text;

alter table public.emails
add column if not exists in_reply_to text;

alter table public.emails
add column if not exists email_references text;

create unique index if not exists idx_emails_rfc_message_id
on public.emails(rfc_message_id)
where rfc_message_id is not null;

create index if not exists idx_emails_in_reply_to
on public.emails(in_reply_to)
where in_reply_to is not null;

create index if not exists idx_emails_email_references
on public.emails(email_references)
where email_references is not null;

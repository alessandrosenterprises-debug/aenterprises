-- Add Sent status to email records.
alter table public.emails
drop constraint if exists emails_status_check;

alter table public.emails
add constraint emails_status_check
check (
  status in (
    'Unread',
    'Read',
    'Replied',
    'Sent',
    'Archived'
  )
);

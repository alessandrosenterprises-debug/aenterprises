begin;

-- Normalize notification columns used by both the customer portal and the
-- existing enterprise notification center.
alter table public.notifications
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists unread boolean not null default true,
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz,
  add column if not exists business text,
  add column if not exists notification_date text,
  add column if not exists amount text,
  add column if not exists subject text,
  add column if not exists action_url text,
  add column if not exists updated_at timestamptz not null default now();

update public.notifications
set unread = not is_read
where unread is distinct from not is_read;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('booking', 'message', 'issue', 'system'));

create index if not exists idx_customer_notifications_user_created
  on public.notifications(user_id, created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

create or replace function public.create_customer_activity_notification(
  p_customer_id uuid,
  p_type text,
  p_title text,
  p_sender text,
  p_preview text,
  p_message text,
  p_business text,
  p_subject text,
  p_action_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    user_id, type, title, sender, preview, message, business, subject,
    action_url, unread, is_read, created_at, updated_at
  )
  select
    profile.id,
    p_type,
    p_title,
    p_sender,
    p_preview,
    p_message,
    p_business,
    p_subject,
    p_action_url,
    true,
    false,
    now(),
    now()
  from public.customers customer
  join public.profiles profile
    on profile.auth_user_id = customer.auth_user_id
  where profile.active is true
    and (p_customer_id is null or customer.id = p_customer_id);
end;
$$;

create or replace function public.notify_customer_activity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row jsonb := to_jsonb(new);
  previous_row jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else '{}'::jsonb end;
  business_name text;
  customer_id uuid;
  item_status text;
  rider_name text;
  item_name text;
  item_title text;
  event_type text := 'system';
  target_url text;
  event_preview text;
begin
  if tg_table_name = 'bookings' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null then return new; end if;
    item_status := coalesce(current_row ->> 'status', 'Pending');
    if tg_op = 'UPDATE' and previous_row ->> 'status' is not distinct from current_row ->> 'status' then
      return new;
    end if;
    select name into business_name from public.businesses where id = (current_row ->> 'business_id')::uuid;
    event_type := 'booking';
    item_title := case when tg_op = 'INSERT' then 'Booking received' else 'Booking update' end;
    event_preview := case when tg_op = 'INSERT'
      then 'Your booking request is ' || lower(item_status) || '.'
      else 'Your booking status is now ' || lower(item_status) || '.' end;
    target_url := '/customer/bookings/' || (current_row ->> 'id');
    perform public.create_customer_activity_notification(customer_id, event_type, item_title,
      coalesce(business_name, 'Alessandro Enterprises'), event_preview, event_preview,
      business_name, 'Booking ' || item_status, target_url);
    return new;
  end if;

  if tg_table_name = 'orders' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null then return new; end if;
    item_status := coalesce(current_row ->> 'status', 'Pending');
    if tg_op = 'UPDATE'
      and previous_row ->> 'status' is not distinct from current_row ->> 'status'
      and previous_row ->> 'delivery_status' is not distinct from current_row ->> 'delivery_status'
      and previous_row ->> 'rider_employee_id' is not distinct from current_row ->> 'rider_employee_id' then
      return new;
    end if;
    select name into business_name from public.businesses where id = (current_row ->> 'business_id')::uuid;
    select full_name into rider_name from public.employees
      where id = nullif(current_row ->> 'rider_employee_id', '')::uuid;
    item_title := case
      when tg_op = 'INSERT' then 'Order received'
      when previous_row ->> 'rider_employee_id' is distinct from current_row ->> 'rider_employee_id' and rider_name is not null then 'Delivery rider assigned'
      when previous_row ->> 'delivery_status' is distinct from current_row ->> 'delivery_status' then 'Delivery progress update'
      else 'Order update' end;
    event_preview := case
      when tg_op = 'INSERT' then 'Your order has been received and is ' || lower(item_status) || '.'
      when previous_row ->> 'rider_employee_id' is distinct from current_row ->> 'rider_employee_id' and rider_name is not null then rider_name || ' has been assigned to deliver your order.'
      when previous_row ->> 'delivery_status' is distinct from current_row ->> 'delivery_status' then 'Your delivery is now ' || lower(coalesce(current_row ->> 'delivery_status', item_status)) || '.'
      else 'Your order status is now ' || lower(item_status) || '.' end;
    target_url := '/customer/orders/' || (current_row ->> 'id');
    perform public.create_customer_activity_notification(customer_id, 'system', item_title,
      coalesce(business_name, 'Alessandro Enterprises'), event_preview, event_preview,
      business_name, 'Order ' || item_status, target_url);
    return new;
  end if;

  if tg_table_name = 'technology_consultation_requests' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null then return new; end if;
    item_status := coalesce(current_row ->> 'status', 'Pending');
    if tg_op = 'UPDATE' and previous_row ->> 'status' is not distinct from current_row ->> 'status' then
      return new;
    end if;
    select name into business_name from public.businesses
      where id = nullif(current_row ->> 'business_id', '')::uuid;
    item_title := case when tg_op = 'INSERT' then 'Consultation request received' else 'Consultation update' end;
    event_preview := case when tg_op = 'INSERT'
      then 'Your consultation request is ' || lower(item_status) || '.'
      else 'Your consultation request is now ' || lower(item_status) || '.' end;
    perform public.create_customer_activity_notification(customer_id, 'system', item_title,
      coalesce(business_name, 'Alessandro Tech Solutions'), event_preview,
      event_preview, business_name, 'Consultation ' || item_status,
      '/customer/technology-consultation');
    return new;
  end if;

  if tg_table_name = 'customer_loan_applications' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null then return new; end if;
    item_status := coalesce(current_row ->> 'status', 'Pending');
    if tg_op = 'UPDATE' and previous_row ->> 'status' is not distinct from current_row ->> 'status' then
      return new;
    end if;
    item_title := case when tg_op = 'INSERT' then 'Loan application received' else 'Loan application update' end;
    event_preview := case when tg_op = 'INSERT'
      then 'Your loan application is ' || lower(item_status) || '.'
      else 'Your loan application is now ' || lower(item_status) || '.' end;
    perform public.create_customer_activity_notification(customer_id, 'system', item_title,
      'Alessandro Soft Loans', event_preview, event_preview,
      'Alessandro Soft Loans', 'Loan application ' || item_status,
      '/customer/businesses/soft-loans');
    return new;
  end if;

  if tg_table_name = 'messages' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null or lower(coalesce(current_row ->> 'source', '')) <> 'dashboard' then
      return new;
    end if;
    select name into business_name from public.businesses
      where id = nullif(current_row ->> 'business_id', '')::uuid;
    item_title := 'New message from ' || coalesce(business_name, 'Alessandro Enterprises');
    event_preview := coalesce(nullif(current_row ->> 'subject', ''), left(coalesce(current_row ->> 'body', ''), 120), 'You have a new message.');
    perform public.create_customer_activity_notification(customer_id, 'message', item_title,
      coalesce(business_name, 'Alessandro Enterprises'), event_preview,
      coalesce(current_row ->> 'body', event_preview), business_name,
      current_row ->> 'subject', '/customer/messages');
    return new;
  end if;

  if tg_table_name = 'emails' then
    customer_id := nullif(current_row ->> 'customer_id', '')::uuid;
    if customer_id is null or lower(coalesce(current_row ->> 'source', '')) <> 'outgoing' then
      return new;
    end if;
    select name into business_name from public.businesses
      where id = nullif(current_row ->> 'business_id', '')::uuid;
    item_title := 'New email from ' || coalesce(business_name, 'Alessandro Enterprises');
    event_preview := coalesce(nullif(current_row ->> 'subject', ''), left(coalesce(current_row ->> 'body', ''), 120), 'You have a new email.');
    perform public.create_customer_activity_notification(customer_id, 'message', item_title,
      coalesce(business_name, 'Alessandro Enterprises'), event_preview,
      coalesce(current_row ->> 'body', event_preview), business_name,
      current_row ->> 'subject', '/customer/emails');
    return new;
  end if;

  select name, slug into business_name, target_url
  from public.businesses where id = (current_row ->> 'business_id')::uuid;

  if tg_table_name = 'business_posts' then
    if coalesce((current_row ->> 'published')::boolean, false) is not true
      or (tg_op = 'UPDATE' and coalesce((previous_row ->> 'published')::boolean, false)) then
      return new;
    end if;
    item_name := coalesce(nullif(current_row ->> 'post_type', ''), 'update');
    item_title := case when lower(item_name) like '%post%' then 'New business post' else 'New business update' end;
    event_preview := coalesce(nullif(current_row ->> 'title', ''), 'There is a new update from ' || coalesce(business_name, 'a business') || '.');
    target_url := '/customer/businesses/' || target_url || '/updates';
  elsif tg_table_name = 'business_promotions' then
    if coalesce((current_row ->> 'published')::boolean, false) is not true
      or coalesce((current_row ->> 'active')::boolean, false) is not true
      or (tg_op = 'UPDATE' and coalesce((previous_row ->> 'published')::boolean, false)
        and coalesce((previous_row ->> 'active')::boolean, false)) then
      return new;
    end if;
    item_title := 'New promotion';
    event_preview := coalesce(nullif(current_row ->> 'title', ''), 'A new offer is available from ' || coalesce(business_name, 'a business') || '.');
    target_url := '/customer/businesses/' || target_url || '/promotions';
  elsif tg_table_name = 'business_gallery' then
    if coalesce((current_row ->> 'active')::boolean, false) is not true
      or (tg_op = 'UPDATE' and coalesce((previous_row ->> 'active')::boolean, false)) then
      return new;
    end if;
    item_title := 'New gallery update';
    event_preview := coalesce(nullif(current_row ->> 'title', ''), 'New work has been added to the ' || coalesce(business_name, 'business') || ' gallery.');
    target_url := '/customer/businesses/' || target_url || '/gallery';
  elsif tg_table_name = 'enterprise_catalog' then
    item_status := lower(coalesce(current_row ->> 'status', ''));
    if item_status <> 'active'
      or (tg_op = 'UPDATE' and lower(coalesce(previous_row ->> 'status', '')) = 'active') then
      return new;
    end if;
    item_name := lower(coalesce(current_row ->> 'item_type', 'item'));
    item_title := case when item_name = 'service' then 'New service available' else 'New product available' end;
    event_preview := coalesce(nullif(current_row ->> 'name', ''), 'A new ' || item_name || ' is available from ' || coalesce(business_name, 'a business') || '.');
    target_url := case when item_name = 'service' then '/customer/businesses/' || target_url || '/services' else '/customer/businesses/' || target_url || '/products' end;
  else
    return new;
  end if;

  perform public.create_customer_activity_notification(null, 'system', item_title,
    coalesce(business_name, 'Alessandro Enterprises'), event_preview, event_preview,
    business_name, item_title, target_url);
  return new;
end;
$$;

drop trigger if exists customer_booking_notifications on public.bookings;
create trigger customer_booking_notifications
after insert or update of status on public.bookings
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_order_notifications on public.orders;
create trigger customer_order_notifications
after insert or update of status on public.orders
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_consultation_notifications on public.technology_consultation_requests;
create trigger customer_consultation_notifications
after insert or update of status on public.technology_consultation_requests
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_loan_application_notifications on public.customer_loan_applications;
create trigger customer_loan_application_notifications
after insert or update of status on public.customer_loan_applications
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_message_reply_notifications on public.messages;
create trigger customer_message_reply_notifications
after insert on public.messages
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_email_reply_notifications on public.emails;
create trigger customer_email_reply_notifications
after insert on public.emails
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_business_post_notifications on public.business_posts;
create trigger customer_business_post_notifications
after insert or update of published on public.business_posts
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_business_promotion_notifications on public.business_promotions;
create trigger customer_business_promotion_notifications
after insert or update of published, active on public.business_promotions
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_business_gallery_notifications on public.business_gallery;
create trigger customer_business_gallery_notifications
after insert or update of active on public.business_gallery
for each row execute function public.notify_customer_activity_change();

drop trigger if exists customer_catalog_notifications on public.enterprise_catalog;
create trigger customer_catalog_notifications
after insert or update of status on public.enterprise_catalog
for each row execute function public.notify_customer_activity_change();

commit;

begin;

insert into public.permissions (module, action, name, description, permission_key)
values
  ('billing','view','View invoices and quotations','View customer invoices, quotations, balances and payment history.','billing.view'),
  ('billing','manage','Manage invoices and quotations','Create and issue customer invoices and quotations, record payments, and convert accepted quotations.','billing.manage')
on conflict (module, action) do update set name=excluded.name,description=excluded.description,permission_key=excluded.permission_key;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Enterprise Manager','Business Manager','Accounts Department')
  and p.permission_key in ('billing.view','billing.manage')
on conflict(role_id,permission_id) do nothing;

create table if not exists public.accounts_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete set null,
  document_type text not null check (document_type in ('Invoice','Quotation')),
  document_number text not null,
  status text not null default 'Draft' check (status in ('Draft','Issued','Sent','Accepted','Rejected','Partially Paid','Paid','Converted','Void')),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  source_type text not null default 'Manual' check (source_type in ('Manual','Order','Booking')),
  source_id uuid,
  issue_date date not null default current_date,
  due_date date,
  currency text not null default 'ZMW' check (currency='ZMW'),
  subtotal numeric(14,2) not null default 0 check (subtotal>=0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount>=0),
  tax_rate numeric(7,4) not null default 0 check (tax_rate>=0 and tax_rate<=100),
  tax_amount numeric(14,2) not null default 0 check (tax_amount>=0),
  total_amount numeric(14,2) not null default 0 check (total_amount>=0),
  amount_paid numeric(14,2) not null default 0 check (amount_paid>=0 and amount_paid<=total_amount),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id,document_number),
  check ((document_type='Quotation' and status not in ('Issued','Partially Paid','Paid')) or (document_type='Invoice' and status not in ('Sent','Accepted','Rejected','Converted'))),
  check (due_date is null or due_date>=issue_date)
);
create index if not exists accounts_documents_business_date_idx on public.accounts_documents(business_id,issue_date desc);
create index if not exists accounts_documents_status_due_idx on public.accounts_documents(document_type,status,due_date);
create index if not exists accounts_documents_source_idx on public.accounts_documents(source_type,source_id) where source_id is not null;

create table if not exists public.accounts_document_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.accounts_documents(id) on delete cascade,
  description text not null,
  quantity numeric(14,3) not null check (quantity>0),
  unit_price numeric(14,2) not null check (unit_price>=0),
  line_total numeric(14,2) not null check (line_total>=0),
  created_at timestamptz not null default now()
);
create index if not exists accounts_document_lines_document_idx on public.accounts_document_lines(document_id);

create table if not exists public.accounts_document_payments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.accounts_documents(id) on delete restrict,
  amount numeric(14,2) not null check (amount>0),
  paid_at date not null default current_date,
  payment_method text not null,
  reference text,
  notes text,
  received_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists accounts_document_payments_document_idx on public.accounts_document_payments(document_id,paid_at desc);

create or replace function public.create_accounts_document(
  p_business_id uuid,p_branch_id uuid,p_document_type text,p_customer_id uuid,p_customer_name text,
  p_customer_phone text,p_customer_email text,p_source_type text,p_source_id uuid,p_issue_date date,
  p_due_date date,p_discount_amount numeric,p_tax_rate numeric,p_notes text,p_lines jsonb
) returns uuid language plpgsql security definer set search_path=public
as $$
declare document_id_value uuid; number_value text; line jsonb; line_description text; line_quantity numeric; line_price numeric; subtotal_value numeric:=0; tax_value numeric; total_value numeric; source_customer uuid; source_branch uuid;
begin
  if auth.uid() is null or not public.has_permission('billing.manage') then raise exception 'Invoice and quotation management permission is required'; end if;
  if not public.can_access_business(p_business_id) then raise exception 'You cannot access this business'; end if;
  if p_branch_id is not null and not public.can_access_branch(p_business_id,p_branch_id) then raise exception 'You cannot access this branch'; end if;
  if p_document_type is null or p_document_type not in ('Invoice','Quotation') then raise exception 'Choose an invoice or quotation'; end if;
  if p_source_type is null or p_source_type not in ('Manual','Order','Booking') or (p_source_type='Manual' and p_source_id is not null) or (p_source_type<>'Manual' and p_source_id is null) then raise exception 'Choose a valid source transaction'; end if;
  if p_source_type='Order' then
    select customer_id,store_branch_id into source_customer,source_branch from public.orders where id=p_source_id and business_id=p_business_id and (p_branch_id is null or store_branch_id=p_branch_id);
    if not found then raise exception 'The selected order does not belong to this business and branch'; end if;
  elsif p_source_type='Booking' then
    select customer_id,branch_id into source_customer,source_branch from public.bookings where id=p_source_id and business_id=p_business_id and (p_branch_id is null or branch_id=p_branch_id);
    if not found then raise exception 'The selected booking does not belong to this business and branch'; end if;
  end if;
  if source_branch is not null and not public.can_access_branch(p_business_id,source_branch) then raise exception 'You cannot access the source transaction branch'; end if;
  if p_source_type<>'Manual' and p_customer_id is distinct from source_customer then raise exception 'The selected customer does not match the source transaction'; end if;
  if nullif(trim(coalesce(p_customer_name,'')),'') is null then raise exception 'Enter the customer name'; end if;
  if p_due_date is not null and p_due_date<p_issue_date then raise exception 'The due date cannot be before the issue date'; end if;
  if p_tax_rate is null or p_tax_rate<0 or p_tax_rate>100 or coalesce(p_discount_amount,0)<0 then raise exception 'Check the discount and tax values'; end if;
  if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 then raise exception 'Add at least one item'; end if;
  for line in select * from jsonb_array_elements(p_lines) loop
    line_description:=nullif(trim(line->>'description'),''); line_quantity:=(line->>'quantity')::numeric; line_price:=(line->>'unit_price')::numeric;
    if line_description is null or line_quantity is null or line_quantity<=0 or line_price is null or line_price<0 then raise exception 'Check each item description, quantity and price'; end if;
    subtotal_value:=subtotal_value+round(line_quantity*line_price,2);
  end loop;
  if p_discount_amount>subtotal_value then raise exception 'The discount cannot exceed the subtotal'; end if;
  subtotal_value:=round(subtotal_value,2);
  tax_value:=round((subtotal_value-coalesce(p_discount_amount,0))*coalesce(p_tax_rate,0)/100,2);
  total_value:=round(subtotal_value-coalesce(p_discount_amount,0)+tax_value,2);
  if p_document_type='Invoice' and total_value<=0 then raise exception 'Invoice total must be greater than zero'; end if;
  number_value:=case when p_document_type='Invoice' then 'INV-' else 'QUO-' end||to_char(coalesce(p_issue_date,current_date),'YYMMDD')||'-'||upper(left(replace(gen_random_uuid()::text,'-',''),6));
  insert into public.accounts_documents(business_id,branch_id,document_type,document_number,status,customer_id,customer_name,customer_phone,customer_email,source_type,source_id,issue_date,due_date,subtotal,discount_amount,tax_rate,tax_amount,total_amount,notes,created_by)
  values(p_business_id,coalesce(p_branch_id,source_branch),p_document_type,number_value,'Draft',p_customer_id,trim(p_customer_name),nullif(trim(p_customer_phone),''),nullif(trim(p_customer_email),''),p_source_type,p_source_id,coalesce(p_issue_date,current_date),p_due_date,subtotal_value,coalesce(p_discount_amount,0),coalesce(p_tax_rate,0),tax_value,total_value,nullif(trim(p_notes),''),auth.uid()) returning id into document_id_value;
  for line in select * from jsonb_array_elements(p_lines) loop
    line_description:=trim(line->>'description'); line_quantity:=(line->>'quantity')::numeric; line_price:=(line->>'unit_price')::numeric;
    insert into public.accounts_document_lines(document_id,description,quantity,unit_price,line_total) values(document_id_value,line_description,line_quantity,line_price,round(line_quantity*line_price,2));
  end loop;
  return document_id_value;
end;
$$;
revoke all on function public.create_accounts_document(uuid,uuid,text,uuid,text,text,text,text,uuid,date,date,numeric,numeric,text,jsonb) from public;
grant execute on function public.create_accounts_document(uuid,uuid,text,uuid,text,text,text,text,uuid,date,date,numeric,numeric,text,jsonb) to authenticated;

create or replace function public.set_accounts_document_status(p_document_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path=public
as $$
declare document_row record;
begin
  if auth.uid() is null or not public.has_permission('billing.manage') then raise exception 'Invoice and quotation management permission is required'; end if;
  select * into document_row from public.accounts_documents where id=p_document_id for update;
  if document_row.id is null or not public.can_access_business(document_row.business_id) or (document_row.branch_id is not null and not public.can_access_branch(document_row.business_id,document_row.branch_id)) then raise exception 'Document not found'; end if;
  if document_row.status in ('Void','Converted','Paid') then raise exception 'This document is locked'; end if;
  if document_row.document_type='Invoice' then
    if p_status not in ('Issued','Void') then raise exception 'Invalid invoice status change'; end if;
    if p_status='Issued' and document_row.status<>'Draft' then raise exception 'Only draft invoices can be issued'; end if;
    if p_status='Void' and document_row.status not in ('Draft','Issued') then raise exception 'This invoice cannot be voided'; end if;
    if p_status='Void' and document_row.amount_paid>0 then raise exception 'A paid invoice cannot be voided'; end if;
  else
    if p_status not in ('Sent','Accepted','Rejected','Void') then raise exception 'Invalid quotation status change'; end if;
    if p_status='Sent' and document_row.status<>'Draft' then raise exception 'Only draft quotations can be sent'; end if;
    if p_status='Void' and document_row.status not in ('Draft','Sent','Accepted','Rejected') then raise exception 'This quotation cannot be voided'; end if;
    if p_status='Accepted' and document_row.status not in ('Sent','Accepted') then raise exception 'Send the quotation before accepting it'; end if;
    if p_status='Rejected' and document_row.status not in ('Sent','Rejected') then raise exception 'Send the quotation before rejecting it'; end if;
  end if;
  update public.accounts_documents set status=p_status,updated_at=now() where id=p_document_id;
  return true;
end;
$$;
revoke all on function public.set_accounts_document_status(uuid,text) from public;
grant execute on function public.set_accounts_document_status(uuid,text) to authenticated;

create or replace function public.record_accounts_document_payment(p_document_id uuid,p_amount numeric,p_paid_at date,p_payment_method text,p_reference text,p_notes text)
returns numeric language plpgsql security definer set search_path=public
as $$
declare document_row record; new_paid numeric;
begin
  if auth.uid() is null or not public.has_permission('billing.manage') then raise exception 'Invoice and payment management permission is required'; end if;
  select * into document_row from public.accounts_documents where id=p_document_id for update;
  if document_row.id is null or document_row.document_type<>'Invoice' or document_row.status not in ('Issued','Partially Paid') then raise exception 'Only issued, unpaid invoices can receive payment'; end if;
  if not public.can_access_business(document_row.business_id) or (document_row.branch_id is not null and not public.can_access_branch(document_row.business_id,document_row.branch_id)) then raise exception 'You cannot access this invoice'; end if;
  if p_amount is null or p_amount<=0 or p_amount>document_row.total_amount-document_row.amount_paid then raise exception 'Payment must be positive and cannot exceed the outstanding balance'; end if;
  if nullif(trim(coalesce(p_payment_method,'')),'') is null then raise exception 'Choose a payment method'; end if;
  insert into public.accounts_document_payments(document_id,amount,paid_at,payment_method,reference,notes,received_by)
  values(p_document_id,p_amount,coalesce(p_paid_at,current_date),trim(p_payment_method),nullif(trim(p_reference),''),nullif(trim(p_notes),''),auth.uid());
  new_paid:=round(document_row.amount_paid+p_amount,2);
  update public.accounts_documents set amount_paid=new_paid,status=case when new_paid>=total_amount then 'Paid' else 'Partially Paid' end,updated_at=now() where id=p_document_id;
  return new_paid;
end;
$$;
revoke all on function public.record_accounts_document_payment(uuid,numeric,date,text,text,text) from public;
grant execute on function public.record_accounts_document_payment(uuid,numeric,date,text,text,text) to authenticated;

create or replace function public.convert_accounts_quote_to_invoice(p_document_id uuid,p_due_date date)
returns uuid language plpgsql security definer set search_path=public
as $$
declare quote_row record; invoice_id_value uuid; invoice_number_value text;
begin
  if auth.uid() is null or not public.has_permission('billing.manage') then raise exception 'Invoice and quotation management permission is required'; end if;
  select * into quote_row from public.accounts_documents where id=p_document_id for update;
  if quote_row.id is null or quote_row.document_type<>'Quotation' or quote_row.status<>'Accepted' then raise exception 'Only accepted quotations can be converted'; end if;
  if not public.can_access_business(quote_row.business_id) or (quote_row.branch_id is not null and not public.can_access_branch(quote_row.business_id,quote_row.branch_id)) then raise exception 'You cannot access this quotation'; end if;
  if p_due_date<current_date then raise exception 'The invoice due date cannot be in the past'; end if;
  invoice_number_value:='INV-'||to_char(current_date,'YYMMDD')||'-'||upper(left(replace(gen_random_uuid()::text,'-',''),6));
  insert into public.accounts_documents(business_id,branch_id,document_type,document_number,status,customer_id,customer_name,customer_phone,customer_email,source_type,source_id,issue_date,due_date,subtotal,discount_amount,tax_rate,tax_amount,total_amount,notes,created_by)
  values(quote_row.business_id,quote_row.branch_id,'Invoice',invoice_number_value,'Draft',quote_row.customer_id,quote_row.customer_name,quote_row.customer_phone,quote_row.customer_email,quote_row.source_type,quote_row.source_id,current_date,p_due_date,quote_row.subtotal,quote_row.discount_amount,quote_row.tax_rate,quote_row.tax_amount,quote_row.total_amount,'Converted from quotation '||quote_row.document_number,auth.uid()) returning id into invoice_id_value;
  insert into public.accounts_document_lines(document_id,description,quantity,unit_price,line_total)
  select invoice_id_value,description,quantity,unit_price,line_total from public.accounts_document_lines where document_id=quote_row.id;
  update public.accounts_documents set status='Converted',updated_at=now() where id=quote_row.id;
  return invoice_id_value;
end;
$$;
revoke all on function public.convert_accounts_quote_to_invoice(uuid,date) from public;
grant execute on function public.convert_accounts_quote_to_invoice(uuid,date) to authenticated;

alter table public.accounts_documents enable row level security;
alter table public.accounts_document_lines enable row level security;
alter table public.accounts_document_payments enable row level security;
revoke insert,update,delete on public.accounts_documents,public.accounts_document_lines,public.accounts_document_payments from anon,authenticated;
grant select on public.accounts_documents,public.accounts_document_lines,public.accounts_document_payments to authenticated;
drop policy if exists accounts_documents_read on public.accounts_documents;
create policy accounts_documents_read on public.accounts_documents for select to authenticated
using (public.has_permission('billing.view') and public.can_access_business(business_id) and (branch_id is null or public.can_access_branch(business_id,branch_id)));
drop policy if exists accounts_document_lines_read on public.accounts_document_lines;
create policy accounts_document_lines_read on public.accounts_document_lines for select to authenticated using (exists(select 1 from public.accounts_documents d where d.id=document_id));
drop policy if exists accounts_document_payments_read on public.accounts_document_payments;
create policy accounts_document_payments_read on public.accounts_document_payments for select to authenticated using (exists(select 1 from public.accounts_documents d where d.id=document_id));
drop policy if exists accounts_document_payments_insert on public.accounts_document_payments;
create policy accounts_document_payments_insert on public.accounts_document_payments for insert to authenticated with check (false);
drop policy if exists accounts_document_payments_mutate on public.accounts_document_payments;
create policy accounts_document_payments_mutate on public.accounts_document_payments for update to authenticated using (false) with check (false);
drop policy if exists accounts_document_payments_delete on public.accounts_document_payments;
create policy accounts_document_payments_delete on public.accounts_document_payments for delete to authenticated using (false);

notify pgrst,'reload schema';
commit;

begin;

-- Branch-level inventory controls. Existing catalog quantities are retained as
-- an opening balance in a central, unallocated location so migration never
-- invents a branch distribution or duplicates stock.

insert into public.permissions (module, action, name, description, permission_key)
values
  ('stock','view','View stock','View branch inventory and stock movement history.','stock.view'),
  ('stock','manage','Manage stock','Receive, transfer, issue and adjust branch stock.','stock.manage'),
  ('stock','purchase','Manage stock purchasing','Manage suppliers and purchase orders.','stock.purchase'),
  ('stock','count','Manage stock counts','Create and reconcile physical stock counts.','stock.count')
on conflict (module, action) do update set
  name=excluded.name, description=excluded.description, permission_key=excluded.permission_key;

insert into public.role_permissions(role_id, permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Enterprise Manager','Business Manager')
  and p.permission_key in ('stock.view','stock.manage','stock.purchase','stock.count')
on conflict (role_id,permission_id) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.name in ('Supervisor') and p.permission_key in ('stock.view')
on conflict (role_id,permission_id) do nothing;

create table if not exists public.stock_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete restrict,
  name text not null,
  location_type text not null default 'Branch' check (location_type in ('Branch','Central','Unallocated')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((location_type='Branch' and branch_id is not null) or (location_type<>'Branch' and branch_id is null))
);
create unique index if not exists stock_locations_branch_unique on public.stock_locations(branch_id) where branch_id is not null;
create unique index if not exists stock_locations_nonbranch_unique on public.stock_locations(business_id,location_type) where branch_id is null;
create index if not exists stock_locations_business_idx on public.stock_locations(business_id,active);

create table if not exists public.stock_item_settings (
  id uuid primary key default gen_random_uuid(),
  catalog_item_id uuid not null unique references public.enterprise_catalog(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete restrict,
  sku text,
  barcode text,
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  reorder_level numeric(14,3) not null default 0 check (reorder_level >= 0),
  warranty_months integer not null default 0 check (warranty_months >= 0),
  tracks_serial_numbers boolean not null default false,
  tracking_enabled boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists stock_item_settings_business_sku_unique on public.stock_item_settings(business_id,lower(sku)) where nullif(trim(sku),'') is not null;
create unique index if not exists stock_item_settings_business_barcode_unique on public.stock_item_settings(business_id,barcode) where nullif(trim(barcode),'') is not null;
create index if not exists stock_item_settings_business_idx on public.stock_item_settings(business_id,tracking_enabled);

create table if not exists public.stock_balances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  location_id uuid not null references public.stock_locations(id) on delete restrict,
  catalog_item_id uuid not null references public.enterprise_catalog(id) on delete restrict,
  quantity_on_hand numeric(14,3) not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved numeric(14,3) not null default 0 check (quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand),
  updated_at timestamptz not null default now(),
  unique(location_id,catalog_item_id)
);
create index if not exists stock_balances_item_idx on public.stock_balances(business_id,catalog_item_id);
create index if not exists stock_balances_location_idx on public.stock_balances(location_id,catalog_item_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  catalog_item_id uuid not null references public.enterprise_catalog(id) on delete restrict,
  movement_type text not null check (movement_type in ('Opening Balance','Receive','Transfer','Sale','Customer Return','Supplier Return','Adjustment Increase','Adjustment Decrease','Damaged','Loss')),
  quantity numeric(14,3) not null check (quantity > 0),
  from_location_id uuid references public.stock_locations(id) on delete restrict,
  to_location_id uuid references public.stock_locations(id) on delete restrict,
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  reference_number text,
  source_type text,
  source_id uuid,
  reason text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_location_id is not null or to_location_id is not null),
  check (from_location_id is null or to_location_id is null or from_location_id <> to_location_id)
);
create index if not exists stock_movements_business_date_idx on public.stock_movements(business_id,created_at desc);
create index if not exists stock_movements_item_date_idx on public.stock_movements(catalog_item_id,created_at desc);
create unique index if not exists stock_movements_order_issue_unique on public.stock_movements(source_type,source_id,catalog_item_id) where source_type='customer_order' and source_id is not null;

create table if not exists public.stock_suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  tax_number text,
  notes text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stock_suppliers_business_idx on public.stock_suppliers(business_id,active,name);

create table if not exists public.stock_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  supplier_id uuid not null references public.stock_suppliers(id) on delete restrict,
  destination_location_id uuid not null references public.stock_locations(id) on delete restrict,
  purchase_order_number text not null,
  status text not null default 'Draft' check (status in ('Draft','Ordered','Partially Received','Received','Cancelled')),
  ordered_at timestamptz,
  expected_at date,
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id,purchase_order_number)
);
create index if not exists stock_purchase_orders_business_date_idx on public.stock_purchase_orders(business_id,created_at desc);

create table if not exists public.stock_purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.stock_purchase_orders(id) on delete cascade,
  catalog_item_id uuid not null references public.enterprise_catalog(id) on delete restrict,
  quantity_ordered numeric(14,3) not null check (quantity_ordered > 0),
  quantity_received numeric(14,3) not null default 0 check (quantity_received >= 0 and quantity_received <= quantity_ordered),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  created_at timestamptz not null default now(),
  unique(purchase_order_id,catalog_item_id)
);

create table if not exists public.stock_counts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  location_id uuid not null references public.stock_locations(id) on delete restrict,
  count_number text not null,
  status text not null default 'Draft' check (status in ('Draft','In Progress','Submitted','Approved','Cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(business_id,count_number)
);
create table if not exists public.stock_count_lines (
  id uuid primary key default gen_random_uuid(),
  stock_count_id uuid not null references public.stock_counts(id) on delete cascade,
  catalog_item_id uuid not null references public.enterprise_catalog(id) on delete restrict,
  system_quantity numeric(14,3) not null default 0,
  counted_quantity numeric(14,3),
  variance numeric(14,3) generated always as (coalesce(counted_quantity,system_quantity)-system_quantity) stored,
  notes text,
  unique(stock_count_id,catalog_item_id)
);

-- Resolve a stock location using the effective manager/operator account and
-- keep branch operators from seeing or changing another branch's inventory.
create or replace function public.stock_can_access_location(p_business_id uuid,p_branch_id uuid)
returns boolean language sql stable security definer set search_path=public
as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.id=p.role_id
    where p.id=public.get_effective_profile_id() and p.active=true
      and coalesce(r.status,'Active')='Active'
      and (
        r.name='Super Administrator'
        or r.name='Enterprise Manager'
        or (p.business_id=p_business_id and (
          (p.branch_id is null and (p_branch_id is null or exists(select 1 from public.branches b where b.id=p_branch_id and b.business_id=p_business_id)))
          or p.branch_id is not distinct from p_branch_id
        ))
      )
  );
$$;
revoke all on function public.stock_can_access_location(uuid,uuid) from public;
grant execute on function public.stock_can_access_location(uuid,uuid) to authenticated;

-- One location per physical branch and a safe central bucket for historical
-- quantities that were previously stored only at the business level.
insert into public.stock_locations(business_id,branch_id,name,location_type,active)
select b.business_id,b.id,b.name,'Branch',coalesce(b.active,true)
from public.branches b
where b.business_id is not null
on conflict (branch_id) where branch_id is not null do update set name=excluded.name,active=excluded.active,updated_at=now();

insert into public.stock_locations(business_id,branch_id,name,location_type,active)
select b.id,null,'Unallocated opening stock','Unallocated',true from public.businesses b
on conflict (business_id,location_type) where branch_id is null do nothing;

create or replace function public.sync_stock_branch_location()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if new.business_id is null then return new; end if;
  insert into public.stock_locations(business_id,branch_id,name,location_type,active)
  values(new.business_id,new.id,new.name,'Branch',coalesce(new.active,true))
  on conflict(branch_id) where branch_id is not null do update set business_id=excluded.business_id,name=excluded.name,active=excluded.active,updated_at=now();
  return new;
end;
$$;
drop trigger if exists branches_stock_location_sync on public.branches;
create trigger branches_stock_location_sync after insert or update of business_id,name,active on public.branches
for each row execute function public.sync_stock_branch_location();

insert into public.stock_item_settings(catalog_item_id,business_id,sku,unit_cost,reorder_level,tracking_enabled)
select c.id,c.business_id,null,0,0,false
from public.enterprise_catalog c
where lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail')
on conflict (catalog_item_id) do nothing;

insert into public.stock_balances(business_id,location_id,catalog_item_id,quantity_on_hand)
select c.business_id,l.id,c.id,greatest(coalesce(c.quantity,0),0)
from public.enterprise_catalog c
join public.stock_locations l on l.business_id=c.business_id and l.location_type='Unallocated'
join public.stock_item_settings s on s.catalog_item_id=c.id
where greatest(coalesce(c.quantity,0),0)>0
on conflict (location_id,catalog_item_id) do nothing;

insert into public.stock_movements(business_id,catalog_item_id,movement_type,quantity,to_location_id,reference_number,reason,notes)
select b.business_id,b.catalog_item_id,'Opening Balance',b.quantity_on_hand,b.location_id,'MIGRATION-052','Legacy business-level catalog quantity','Opening quantity imported to Unallocated opening stock; distribute to the correct branch after a physical verification.'
from public.stock_balances b join public.stock_locations l on l.id=b.location_id
where l.location_type='Unallocated' and b.quantity_on_hand>0
  and not exists(select 1 from public.stock_movements m where m.catalog_item_id=b.catalog_item_id and m.to_location_id=b.location_id and m.reference_number='MIGRATION-052');

create or replace function public.post_stock_movement(
  p_business_id uuid,p_catalog_item_id uuid,p_movement_type text,p_quantity numeric,
  p_from_location_id uuid default null,p_to_location_id uuid default null,
  p_unit_cost numeric default 0,p_reference_number text default null,p_reason text default null,p_notes text default null,
  p_source_type text default null,p_source_id uuid default null
)
returns uuid language plpgsql security definer set search_path=public
as $$
declare
  movement_id uuid; actor_id uuid; item_business_id uuid; from_location record; to_location record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_movement_type='Sale' then
    if not (public.has_permission('stock.manage') or public.has_permission('orders.manage') or public.has_permission('deliveries.manage')) then raise exception 'Order or stock management permission is required'; end if;
  elsif p_movement_type in ('Adjustment Increase','Adjustment Decrease') then
    if not (public.has_permission('stock.manage') or public.has_permission('stock.count')) then raise exception 'Stock management permission is required'; end if;
  elsif not (public.has_permission('stock.manage') or public.has_permission('stock.purchase')) then raise exception 'Stock management permission is required'; end if;
  if p_quantity is null or p_quantity<=0 or p_quantity>100000000 then raise exception 'Enter a valid positive stock quantity'; end if;
  if coalesce(p_unit_cost,0)<0 then raise exception 'Unit cost cannot be negative'; end if;
  if p_movement_type not in ('Receive','Transfer','Sale','Customer Return','Supplier Return','Adjustment Increase','Adjustment Decrease','Damaged','Loss') then raise exception 'Unsupported stock movement type'; end if;
  select business_id into item_business_id from public.enterprise_catalog where id=p_catalog_item_id and lower(trim(coalesce(item_type,''))) in ('product','goods','item','retail');
  if item_business_id is null or item_business_id<>p_business_id then raise exception 'Choose a product from the selected business'; end if;
  if p_movement_type in ('Transfer','Sale','Supplier Return','Adjustment Decrease','Damaged','Loss') and p_from_location_id is null then raise exception 'Select the stock source location'; end if;
  if p_movement_type in ('Receive','Customer Return','Adjustment Increase') and p_to_location_id is null then raise exception 'Select the stock destination location'; end if;
  if p_movement_type='Transfer' and (p_to_location_id is null or p_to_location_id=p_from_location_id) then raise exception 'Select a different destination location'; end if;
  if p_movement_type in ('Adjustment Increase','Adjustment Decrease','Damaged','Loss','Supplier Return') and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'Enter a reason for this stock movement'; end if;
  if p_from_location_id is not null then
    select * into from_location from public.stock_locations where id=p_from_location_id and business_id=p_business_id and active;
    if from_location.id is null or not public.stock_can_access_location(p_business_id,from_location.branch_id) then raise exception 'You cannot access the source stock location'; end if;
    insert into public.stock_balances(business_id,location_id,catalog_item_id,quantity_on_hand) values(p_business_id,p_from_location_id,p_catalog_item_id,0) on conflict(location_id,catalog_item_id) do nothing;
    update public.stock_balances set quantity_on_hand=quantity_on_hand-p_quantity,updated_at=now()
      where location_id=p_from_location_id and catalog_item_id=p_catalog_item_id and quantity_on_hand-quantity_reserved>=p_quantity;
    if not found then raise exception 'Not enough available stock at the selected source location'; end if;
  end if;
  if p_to_location_id is not null then
    select * into to_location from public.stock_locations where id=p_to_location_id and business_id=p_business_id and active;
    if to_location.id is null or not public.stock_can_access_location(p_business_id,to_location.branch_id) then raise exception 'You cannot access the destination stock location'; end if;
    insert into public.stock_balances(business_id,location_id,catalog_item_id,quantity_on_hand) values(p_business_id,p_to_location_id,p_catalog_item_id,p_quantity)
      on conflict(location_id,catalog_item_id) do update set quantity_on_hand=public.stock_balances.quantity_on_hand+excluded.quantity_on_hand,updated_at=now();
  end if;
  select id into actor_id from public.profiles where auth_user_id=auth.uid() and active=true limit 1;
  insert into public.stock_movements(business_id,catalog_item_id,movement_type,quantity,from_location_id,to_location_id,unit_cost,reference_number,reason,notes,created_by,source_type,source_id)
  values(p_business_id,p_catalog_item_id,p_movement_type,p_quantity,p_from_location_id,p_to_location_id,greatest(coalesce(p_unit_cost,0),0),nullif(trim(p_reference_number),''),nullif(trim(p_reason),''),nullif(trim(p_notes),''),auth.uid(),p_source_type,p_source_id)
  returning id into movement_id;
  -- Keep the public/catalog quantity equal to enterprise stock across locations.
  update public.enterprise_catalog set quantity=(select coalesce(sum(quantity_on_hand),0) from public.stock_balances where catalog_item_id=p_catalog_item_id),updated_at=now()
    where id=p_catalog_item_id;
  return movement_id;
end;
$$;
revoke all on function public.post_stock_movement(uuid,uuid,text,numeric,uuid,uuid,numeric,text,text,text,text,uuid) from public;
grant execute on function public.post_stock_movement(uuid,uuid,text,numeric,uuid,uuid,numeric,text,text,text,text,uuid) to authenticated;

-- Seed newly created retail products into the unallocated opening-stock
-- bucket. Tracking remains off until a manager distributes the counted stock.
create or replace function public.initialize_stock_catalog_item()
returns trigger language plpgsql security definer set search_path=public
as $$
declare unallocated_location uuid;
begin
  if lower(trim(coalesce(new.item_type,''))) not in ('product','goods','item','retail') then return new; end if;
  insert into public.stock_item_settings(catalog_item_id,business_id,sku,tracking_enabled)
  values(new.id,new.business_id,nullif(trim(coalesce(new.attributes->>'sku','')),''),false)
  on conflict(catalog_item_id) do nothing;
  if tg_op='INSERT' then
    select id into unallocated_location from public.stock_locations where business_id=new.business_id and location_type='Unallocated' limit 1;
    if unallocated_location is not null and coalesce(new.quantity,0)>0 then
      insert into public.stock_balances(business_id,location_id,catalog_item_id,quantity_on_hand)
      values(new.business_id,unallocated_location,new.id,greatest(new.quantity,0))
      on conflict(location_id,catalog_item_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists stock_catalog_item_initialize on public.enterprise_catalog;
create trigger stock_catalog_item_initialize after insert or update of business_id,item_type on public.enterprise_catalog
for each row execute function public.initialize_stock_catalog_item();

-- Completed catalog orders deduct stock from the preparing branch. The call is
-- idempotent and all lines are validated before any stock is changed.
create or replace function public.post_completed_order_stock(p_order_id uuid)
returns integer language plpgsql security definer set search_path=public
as $$
declare order_row record; line_row record; source_location uuid; stock_qty numeric; product_count integer; tracked_count integer; posted_count integer:=0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not (public.has_permission('orders.manage') or public.has_permission('deliveries.manage') or public.has_permission('stock.manage')) then raise exception 'Order completion permission is required'; end if;
  select id,business_id,store_branch_id into order_row from public.orders where id=p_order_id for update;
  if order_row.id is null then raise exception 'Order was not found'; end if;
  if exists(select 1 from public.stock_movements where source_type='customer_order' and source_id=p_order_id) then return 0; end if;
  select count(*) into product_count
  from public.order_items oi join public.enterprise_catalog c on c.id=oi.catalog_item_id
  where oi.order_id=p_order_id and lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail');
  select count(*) into tracked_count
  from public.order_items oi join public.enterprise_catalog c on c.id=oi.catalog_item_id
  join public.stock_item_settings s on s.catalog_item_id=c.id and s.tracking_enabled=true
  where oi.order_id=p_order_id and lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail');
  if product_count=0 or tracked_count=0 then return 0; end if;
  -- Catalogue items can be enabled for branch tracking gradually. Only items
  -- whose stock control is enabled are checked and deducted below.
  if not public.stock_can_access_location(order_row.business_id,order_row.store_branch_id) then raise exception 'You cannot complete orders for this branch'; end if;
  if order_row.store_branch_id is null then raise exception 'Assign a stock branch to this order before completing it'; end if;
  select id into source_location from public.stock_locations where branch_id=order_row.store_branch_id and business_id=order_row.business_id and active;
  if source_location is null then raise exception 'The order branch does not have a stock location yet'; end if;
  for line_row in
    select oi.catalog_item_id,sum(oi.quantity)::numeric as quantity,c.name,s.unit_cost
    from public.order_items oi join public.enterprise_catalog c on c.id=oi.catalog_item_id
    join public.stock_item_settings s on s.catalog_item_id=c.id and s.tracking_enabled=true
    where oi.order_id=p_order_id and lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail')
    group by oi.catalog_item_id,c.name,s.unit_cost
  loop
    select coalesce(quantity_on_hand,0)-coalesce(quantity_reserved,0) into stock_qty from public.stock_balances where location_id=source_location and catalog_item_id=line_row.catalog_item_id for update;
    if coalesce(stock_qty,0)<line_row.quantity then raise exception 'Insufficient branch stock for % (available %, required %)',line_row.name,coalesce(stock_qty,0),line_row.quantity; end if;
  end loop;
  for line_row in
    select oi.catalog_item_id,sum(oi.quantity)::numeric as quantity,c.name,s.unit_cost
    from public.order_items oi join public.enterprise_catalog c on c.id=oi.catalog_item_id
    join public.stock_item_settings s on s.catalog_item_id=c.id and s.tracking_enabled=true
    where oi.order_id=p_order_id and lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail')
    group by oi.catalog_item_id,c.name,s.unit_cost
  loop
    perform public.post_stock_movement(order_row.business_id,line_row.catalog_item_id,'Sale',line_row.quantity,source_location,null,line_row.unit_cost,'ORDER-'||left(replace(p_order_id::text,'-',''),12),'Completed customer order',null,'customer_order',p_order_id);
    posted_count:=posted_count+1;
  end loop;
  return posted_count;
end;
$$;
revoke all on function public.post_completed_order_stock(uuid) from public;
grant execute on function public.post_completed_order_stock(uuid) to authenticated;

create or replace function public.create_stock_purchase_order(
  p_business_id uuid,p_supplier_id uuid,p_destination_location_id uuid,p_expected_at date,p_notes text,p_lines jsonb
)
returns uuid language plpgsql security definer set search_path=public
as $$
declare order_id_value uuid; purchase_number text; line jsonb; item_id uuid; qty numeric; cost numeric; subtotal_value numeric:=0;
begin
  if auth.uid() is null or not public.has_permission('stock.purchase') then raise exception 'Stock purchasing permission is required'; end if;
  if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 then raise exception 'Add at least one product to the purchase order'; end if;
  if not public.can_access_business(p_business_id) then raise exception 'You cannot access this business'; end if;
  if not exists(select 1 from public.stock_suppliers where id=p_supplier_id and business_id=p_business_id and active) then raise exception 'Choose an active supplier'; end if;
  if not exists(select 1 from public.stock_locations l where l.id=p_destination_location_id and l.business_id=p_business_id and l.active and public.stock_can_access_location(p_business_id,l.branch_id)) then raise exception 'Choose a stock location you can access'; end if;
  for line in select * from jsonb_array_elements(p_lines) loop
    item_id:=(line->>'catalog_item_id')::uuid; qty:=(line->>'quantity_ordered')::numeric; cost:=(line->>'unit_cost')::numeric;
    if qty<=0 or cost<0 or not exists(select 1 from public.enterprise_catalog c where c.id=item_id and c.business_id=p_business_id and lower(trim(coalesce(c.item_type,''))) in ('product','goods','item','retail')) then raise exception 'Check the product quantity and unit cost'; end if;
    subtotal_value:=subtotal_value+(qty*cost);
  end loop;
  purchase_number:='PO-'||to_char(current_date,'YYYYMMDD')||'-'||upper(left(replace(gen_random_uuid()::text,'-',''),6));
  insert into public.stock_purchase_orders(business_id,supplier_id,destination_location_id,purchase_order_number,status,ordered_at,expected_at,subtotal,notes,created_by)
  values(p_business_id,p_supplier_id,p_destination_location_id,purchase_number,'Ordered',now(),p_expected_at,subtotal_value,nullif(trim(p_notes),''),auth.uid()) returning id into order_id_value;
  for line in select * from jsonb_array_elements(p_lines) loop
    insert into public.stock_purchase_order_lines(purchase_order_id,catalog_item_id,quantity_ordered,unit_cost)
    values(order_id_value,(line->>'catalog_item_id')::uuid,(line->>'quantity_ordered')::numeric,(line->>'unit_cost')::numeric);
  end loop;
  return order_id_value;
end;
$$;
revoke all on function public.create_stock_purchase_order(uuid,uuid,uuid,date,text,jsonb) from public;
grant execute on function public.create_stock_purchase_order(uuid,uuid,uuid,date,text,jsonb) to authenticated;

create or replace function public.receive_stock_purchase_order(p_purchase_order_id uuid,p_receipts jsonb)
returns text language plpgsql security definer set search_path=public
as $$
declare po record; line jsonb; po_line record; receive_qty numeric; new_status text; receipt_number text;
begin
  if auth.uid() is null or not public.has_permission('stock.purchase') then raise exception 'Stock purchasing permission is required'; end if;
  select * into po from public.stock_purchase_orders where id=p_purchase_order_id for update;
  if po.id is null then raise exception 'Purchase order not found'; end if;
  if po.status not in ('Ordered','Partially Received') then raise exception 'Only open purchase orders can receive stock'; end if;
  if jsonb_typeof(p_receipts)<>'array' or jsonb_array_length(p_receipts)=0 then raise exception 'Enter quantities received'; end if;
  receipt_number:=po.purchase_order_number;
  for line in select * from jsonb_array_elements(p_receipts) loop
    select * into po_line from public.stock_purchase_order_lines where id=(line->>'line_id')::uuid and purchase_order_id=po.id for update;
    if po_line.id is null then raise exception 'A purchase order line could not be found'; end if;
    receive_qty:=coalesce((line->>'quantity')::numeric,0);
    if receive_qty<=0 then raise exception 'Received quantities must be greater than zero'; end if;
    if po_line.quantity_received+receive_qty>po_line.quantity_ordered then raise exception 'Cannot receive more than the quantity ordered'; end if;
    perform public.post_stock_movement(po.business_id,po_line.catalog_item_id,'Receive',receive_qty,null,po.destination_location_id,po_line.unit_cost,receipt_number,'Purchase order receipt',null,'purchase_order',po.id);
    update public.stock_purchase_order_lines set quantity_received=quantity_received+receive_qty where id=po_line.id;
  end loop;
  if exists(select 1 from public.stock_purchase_order_lines where purchase_order_id=po.id and quantity_received<quantity_ordered) then new_status:='Partially Received'; else new_status:='Received'; end if;
  update public.stock_purchase_orders set status=new_status,updated_at=now() where id=po.id;
  return new_status;
end;
$$;
revoke all on function public.receive_stock_purchase_order(uuid,jsonb) from public;
grant execute on function public.receive_stock_purchase_order(uuid,jsonb) to authenticated;

create or replace function public.start_stock_count(p_location_id uuid)
returns uuid language plpgsql security definer set search_path=public
as $$
declare location_row record; count_id_value uuid; count_number_value text;
begin
  if auth.uid() is null or not public.has_permission('stock.count') then raise exception 'Stock count permission is required'; end if;
  select * into location_row from public.stock_locations where id=p_location_id and active for share;
  if location_row.id is null or not public.stock_can_access_location(location_row.business_id,location_row.branch_id) then raise exception 'Stock location is unavailable'; end if;
  count_number_value:='COUNT-'||to_char(current_date,'YYYYMMDD')||'-'||upper(left(replace(gen_random_uuid()::text,'-',''),6));
  insert into public.stock_counts(business_id,location_id,count_number,status,created_by)
  values(location_row.business_id,p_location_id,count_number_value,'In Progress',auth.uid()) returning id into count_id_value;
  insert into public.stock_count_lines(stock_count_id,catalog_item_id,system_quantity)
  select count_id_value,s.catalog_item_id,coalesce(b.quantity_on_hand,0)
  from public.stock_item_settings s left join public.stock_balances b on b.catalog_item_id=s.catalog_item_id and b.location_id=p_location_id
  where s.business_id=location_row.business_id;
  return count_id_value;
end;
$$;
revoke all on function public.start_stock_count(uuid) from public;
grant execute on function public.start_stock_count(uuid) to authenticated;

create or replace function public.save_stock_count_lines(p_stock_count_id uuid,p_lines jsonb)
returns integer language plpgsql security definer set search_path=public
as $$
declare count_row record; line jsonb; line_id uuid; counted numeric; saved integer:=0;
begin
  if auth.uid() is null or not public.has_permission('stock.count') then raise exception 'Stock count permission is required'; end if;
  select * into count_row from public.stock_counts where id=p_stock_count_id for update;
  if count_row.id is null or count_row.status<>'In Progress' or not public.stock_can_access_location(count_row.business_id,(select branch_id from public.stock_locations where id=count_row.location_id)) then raise exception 'This stock count is not editable'; end if;
  if jsonb_typeof(p_lines)<>'array' then raise exception 'Stock count entries are invalid'; end if;
  for line in select * from jsonb_array_elements(p_lines) loop
    line_id:=(line->>'line_id')::uuid; counted:=(line->>'counted_quantity')::numeric;
    if counted<0 then raise exception 'Counted stock cannot be negative'; end if;
    update public.stock_count_lines set counted_quantity=counted,notes=nullif(trim(line->>'notes'),'') where id=line_id and stock_count_id=count_row.id;
    if not found then raise exception 'A product on the stock count could not be found'; end if;
    saved:=saved+1;
  end loop;
  return saved;
end;
$$;
revoke all on function public.save_stock_count_lines(uuid,jsonb) from public;
grant execute on function public.save_stock_count_lines(uuid,jsonb) to authenticated;

create or replace function public.submit_stock_count(p_stock_count_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare count_row record;
begin
  if auth.uid() is null or not public.has_permission('stock.count') then raise exception 'Stock count permission is required'; end if;
  select * into count_row from public.stock_counts where id=p_stock_count_id for update;
  if count_row.id is null or count_row.status<>'In Progress' then raise exception 'This stock count cannot be submitted'; end if;
  if exists(select 1 from public.stock_count_lines where stock_count_id=count_row.id and counted_quantity is null) then raise exception 'Enter a counted quantity for every listed product before submitting'; end if;
  update public.stock_counts set status='Submitted',submitted_at=now(),updated_at=now() where id=count_row.id;
  return true;
end;
$$;
revoke all on function public.submit_stock_count(uuid) from public;
grant execute on function public.submit_stock_count(uuid) to authenticated;

create or replace function public.approve_stock_count(p_stock_count_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare count_row record; line_row record; location_branch uuid; variance_value numeric;
begin
  if auth.uid() is null or not public.has_permission('stock.manage') then raise exception 'A stock manager must approve the count'; end if;
  select * into count_row from public.stock_counts where id=p_stock_count_id for update;
  if count_row.id is null or count_row.status<>'Submitted' then raise exception 'Only submitted stock counts can be approved'; end if;
  select branch_id into location_branch from public.stock_locations where id=count_row.location_id;
  if not public.stock_can_access_location(count_row.business_id,location_branch) then raise exception 'You cannot approve a count for this location'; end if;
  if exists(select 1 from public.stock_count_lines where stock_count_id=count_row.id and counted_quantity is null) then raise exception 'The stock count has missing quantities'; end if;
  if exists(
    select 1
    from public.stock_count_lines cl
    left join public.stock_balances b on b.location_id=count_row.location_id and b.catalog_item_id=cl.catalog_item_id
    where cl.stock_count_id=count_row.id and coalesce(b.quantity_on_hand,0)<>cl.system_quantity
  ) then raise exception 'Stock changed while this count was open. Cancel it and start a fresh count before approval.'; end if;
  for line_row in select l.*,s.unit_cost from public.stock_count_lines l join public.stock_item_settings s on s.catalog_item_id=l.catalog_item_id where l.stock_count_id=count_row.id loop
    variance_value:=line_row.counted_quantity-line_row.system_quantity;
    if variance_value>0 then
      perform public.post_stock_movement(count_row.business_id,line_row.catalog_item_id,'Adjustment Increase',variance_value,null,count_row.location_id,line_row.unit_cost,count_row.count_number,'Approved physical stock count',line_row.notes,'stock_count',count_row.id);
    elsif variance_value<0 then
      perform public.post_stock_movement(count_row.business_id,line_row.catalog_item_id,'Adjustment Decrease',abs(variance_value),count_row.location_id,null,line_row.unit_cost,count_row.count_number,'Approved physical stock count',line_row.notes,'stock_count',count_row.id);
    end if;
  end loop;
  update public.stock_counts set status='Approved',approved_by=auth.uid(),approved_at=now(),updated_at=now() where id=count_row.id;
  return true;
end;
$$;
revoke all on function public.approve_stock_count(uuid) from public;
grant execute on function public.approve_stock_count(uuid) to authenticated;

create or replace function public.cancel_stock_count(p_stock_count_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare count_row record; location_branch uuid;
begin
  if auth.uid() is null or not (public.has_permission('stock.count') or public.has_permission('stock.manage')) then raise exception 'Stock count permission is required'; end if;
  select * into count_row from public.stock_counts where id=p_stock_count_id for update;
  if count_row.id is null or count_row.status not in ('In Progress','Submitted') then raise exception 'This stock count cannot be cancelled'; end if;
  if count_row.status='Submitted' and not public.has_permission('stock.manage') then raise exception 'A stock manager must cancel a submitted count'; end if;
  select branch_id into location_branch from public.stock_locations where id=count_row.location_id;
  if not public.stock_can_access_location(count_row.business_id,location_branch) then raise exception 'You cannot cancel a count for this location'; end if;
  update public.stock_counts set status='Cancelled',updated_at=now() where id=count_row.id;
  return true;
end;
$$;
revoke all on function public.cancel_stock_count(uuid) from public;
grant execute on function public.cancel_stock_count(uuid) to authenticated;

alter table public.stock_locations enable row level security;
alter table public.stock_item_settings enable row level security;
alter table public.stock_balances enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_suppliers enable row level security;
alter table public.stock_purchase_orders enable row level security;
alter table public.stock_purchase_order_lines enable row level security;
alter table public.stock_counts enable row level security;
alter table public.stock_count_lines enable row level security;

drop policy if exists stock_catalog_inventory_read on public.enterprise_catalog;
create policy stock_catalog_inventory_read on public.enterprise_catalog for select to authenticated
using ((public.has_permission('stock.view') or public.has_permission('stock.manage') or public.has_permission('stock.purchase') or public.has_permission('stock.count')) and public.can_access_business(business_id) and lower(trim(coalesce(item_type,''))) in ('product','goods','item','retail'));

drop policy if exists stock_locations_read on public.stock_locations;
create policy stock_locations_read on public.stock_locations for select to authenticated using ((public.has_permission('stock.view') or public.has_permission('stock.manage') or public.has_permission('stock.purchase') or public.has_permission('stock.count')) and public.stock_can_access_location(business_id,branch_id));
drop policy if exists stock_locations_manage on public.stock_locations;
create policy stock_locations_manage on public.stock_locations for all to authenticated using (public.has_permission('stock.manage') and public.stock_can_access_location(business_id,branch_id)) with check (public.has_permission('stock.manage') and public.stock_can_access_location(business_id,branch_id));

drop policy if exists stock_item_settings_read on public.stock_item_settings;
create policy stock_item_settings_read on public.stock_item_settings for select to authenticated using ((public.has_permission('stock.view') or public.has_permission('stock.manage') or public.has_permission('stock.purchase') or public.has_permission('stock.count')) and public.can_access_business(business_id));
drop policy if exists stock_item_settings_manage on public.stock_item_settings;
create policy stock_item_settings_manage on public.stock_item_settings for all to authenticated using (public.has_permission('stock.manage') and public.can_access_business(business_id)) with check (public.has_permission('stock.manage') and public.can_access_business(business_id));

drop policy if exists stock_balances_read on public.stock_balances;
create policy stock_balances_read on public.stock_balances for select to authenticated using ((public.has_permission('stock.view') or public.has_permission('stock.manage') or public.has_permission('stock.purchase') or public.has_permission('stock.count')) and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=location_id)));
drop policy if exists stock_balances_manage on public.stock_balances;
create policy stock_balances_manage on public.stock_balances for all to authenticated using (public.has_permission('stock.manage') and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=location_id))) with check (public.has_permission('stock.manage') and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=location_id)));

drop policy if exists stock_movements_read on public.stock_movements;
create policy stock_movements_read on public.stock_movements for select to authenticated using ((public.has_permission('stock.view') or public.has_permission('stock.manage') or public.has_permission('stock.purchase') or public.has_permission('stock.count')) and public.can_access_business(business_id) and ((from_location_id is not null and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=from_location_id))) or (to_location_id is not null and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=to_location_id)))));
drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert on public.stock_movements for insert to authenticated with check (false);
drop policy if exists stock_movements_update on public.stock_movements;
create policy stock_movements_update on public.stock_movements for update to authenticated using (false) with check (false);
drop policy if exists stock_movements_delete on public.stock_movements;
create policy stock_movements_delete on public.stock_movements for delete to authenticated using (false);

drop policy if exists stock_suppliers_access on public.stock_suppliers;
create policy stock_suppliers_access on public.stock_suppliers for all to authenticated using (public.has_permission('stock.purchase') and public.can_access_business(business_id)) with check (public.has_permission('stock.purchase') and public.can_access_business(business_id));
drop policy if exists stock_purchase_orders_access on public.stock_purchase_orders;
create policy stock_purchase_orders_access on public.stock_purchase_orders for all to authenticated using (public.has_permission('stock.purchase') and public.can_access_business(business_id) and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=destination_location_id))) with check (public.has_permission('stock.purchase') and public.can_access_business(business_id) and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=destination_location_id)));
drop policy if exists stock_purchase_lines_access on public.stock_purchase_order_lines;
create policy stock_purchase_lines_access on public.stock_purchase_order_lines for all to authenticated using (exists(select 1 from public.stock_purchase_orders p where p.id=purchase_order_id)) with check (exists(select 1 from public.stock_purchase_orders p where p.id=purchase_order_id));

drop policy if exists stock_counts_access on public.stock_counts;
create policy stock_counts_access on public.stock_counts for all to authenticated using ((public.has_permission('stock.count') or public.has_permission('stock.manage')) and public.can_access_business(business_id) and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=location_id))) with check ((public.has_permission('stock.count') or public.has_permission('stock.manage')) and public.can_access_business(business_id) and public.stock_can_access_location(business_id,(select branch_id from public.stock_locations where id=location_id)));
drop policy if exists stock_count_lines_access on public.stock_count_lines;
create policy stock_count_lines_access on public.stock_count_lines for all to authenticated using (exists(select 1 from public.stock_counts c where c.id=stock_count_id)) with check (exists(select 1 from public.stock_counts c where c.id=stock_count_id));

notify pgrst,'reload schema';
commit;

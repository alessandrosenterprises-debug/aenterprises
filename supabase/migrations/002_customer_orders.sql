-- ============================================================
-- CUSTOMER ORDERS
-- Alessandro Enterprises
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete restrict,

  customer_id uuid not null
    references public.customers(id)
    on delete restrict,

  status text not null default 'Pending'
    check (
      status in (
        'Pending',
        'Confirmed',
        'Processing',
        'Ready',
        'Completed',
        'Cancelled'
      )
    ),

  payment_status text not null default 'Pending'
    check (
      payment_status in (
        'Pending',
        'Partial',
        'Paid',
        'Refunded'
      )
    ),

  fulfillment_method text not null default 'Pickup'
    check (
      fulfillment_method in (
        'Pickup',
        'Delivery'
      )
    ),

  delivery_address text,

  notes text,

  subtotal numeric(12,2) not null default 0
    check (subtotal >= 0),

  total_amount numeric(12,2) not null default 0
    check (total_amount >= 0),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================================
-- ORDER ITEMS
-- ============================================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  catalog_item_id uuid not null
    references public.enterprise_catalog(id)
    on delete restrict,

  quantity integer not null default 1
    check (quantity > 0),

  unit_price numeric(12,2) not null default 0
    check (unit_price >= 0),

  total_price numeric(12,2) not null default 0
    check (total_price >= 0),

  created_at timestamptz not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_orders_business_id
  on public.orders(business_id);

create index if not exists idx_orders_customer_id
  on public.orders(customer_id);

create index if not exists idx_orders_status
  on public.orders(status);

create index if not exists idx_orders_created_at
  on public.orders(created_at desc);

create index if not exists idx_order_items_order_id
  on public.order_items(order_id);

create index if not exists idx_order_items_catalog_item_id
  on public.order_items(catalog_item_id);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at
on public.orders;

create trigger orders_updated_at
before update on public.orders
for each row
execute function public.set_orders_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.orders enable row level security;

alter table public.order_items enable row level security;


-- ============================================================
-- CUSTOMER POLICIES
-- ============================================================

create policy "Customers can view their own orders"
on public.orders
for select
to authenticated
using (
  customer_id in (
    select id
    from public.customers
    where auth_user_id = auth.uid()
  )
);


create policy "Customers can create their own orders"
on public.orders
for insert
to authenticated
with check (
  customer_id in (
    select id
    from public.customers
    where auth_user_id = auth.uid()
  )
);


create policy "Customers can view their own order items"
on public.order_items
for select
to authenticated
using (
  order_id in (
    select o.id
    from public.orders o
    join public.customers c
      on c.id = o.customer_id
    where c.auth_user_id = auth.uid()
  )
);


create policy "Customers can create items for their own orders"
on public.order_items
for insert
to authenticated
with check (
  order_id in (
    select o.id
    from public.orders o
    join public.customers c
      on c.id = o.customer_id
    where c.auth_user_id = auth.uid()
  )
);
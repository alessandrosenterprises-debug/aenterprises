-- Keep a live reference to the branch where an order is prepared so both
-- dispatchers and customers can see the store as the route origin.
alter table public.branches
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.orders
  add column if not exists store_branch_id uuid references public.branches(id) on delete set null;

with default_branches as (
  select distinct on (b.business_id) b.business_id, b.id
  from public.branches b
  where coalesce(b.active, true) = true
  order by b.business_id, b.name
)
update public.orders o
set store_branch_id = default_branches.id
from default_branches
where o.store_branch_id is null
  and o.business_id = default_branches.business_id;

alter table public.branches
  drop constraint if exists branches_location_coordinates_check;
alter table public.branches
  add constraint branches_location_coordinates_check
  check (
    (latitude is null and longitude is null)
    or (
      latitude is not null and longitude is not null
      and latitude between -90 and 90
      and longitude between -180 and 180
    )
  );

-- Make the new coordinates available to PostgREST immediately after migration.
notify pgrst, 'reload schema';

-- Configurable payment modes for cashier transaction records. Keep a snapshot
-- on each movement so later mode edits never rewrite historic till balances.
create table if not exists public.cash_transaction_modes (
  id uuid primary key default gen_random_uuid(),
  mode_key text not null unique,
  name text not null unique,
  affects_cash_balance boolean not null default false,
  active boolean not null default true,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cash_transaction_modes enable row level security;

drop policy if exists "Cash staff can read transaction modes" on public.cash_transaction_modes;
create policy "Cash staff can read transaction modes"
  on public.cash_transaction_modes for select to authenticated
  using (
    public.has_permission('reports.view')
    or public.has_permission('cash.reconcile')
    or public.has_permission('cash.review')
    or public.has_permission('cash.manage')
  );
drop policy if exists "Cash managers can manage transaction modes" on public.cash_transaction_modes;
create policy "Cash managers can manage transaction modes"
  on public.cash_transaction_modes for all to authenticated
  using (public.has_permission('cash.manage'))
  with check (public.has_permission('cash.manage'));

insert into public.cash_transaction_modes (mode_key, name, affects_cash_balance)
values
  ('cash', 'Cash', true),
  ('airtel_money', 'Airtel Money', false),
  ('mtn_mobile_money', 'MTN Mobile Money', false),
  ('bank_transfer', 'Bank transfer', false),
  ('card', 'Card', false),
  ('cheque', 'Cheque', false),
  ('digital_wallet', 'Digital wallet', false),
  ('other', 'Other', false)
on conflict (mode_key) do update set
  name = excluded.name,
  affects_cash_balance = excluded.affects_cash_balance;

alter table public.cash_register_entries
  add column if not exists transaction_mode_id uuid references public.cash_transaction_modes(id) on delete restrict,
  add column if not exists counts_toward_till boolean not null default true;

update public.cash_register_entries entry
set transaction_mode_id = mode.id
from public.cash_transaction_modes mode
where mode.mode_key = 'cash' and entry.transaction_mode_id is null;

alter table public.cash_register_entries
  alter column transaction_mode_id set not null;
create index if not exists cash_register_entries_mode_time_idx
  on public.cash_register_entries(transaction_mode_id, received_at desc);

notify pgrst, 'reload schema';

-- End-of-shift till counts are performed and owned by the manager on duty.
alter table public.cash_daily_reconciliations
  add column if not exists reconciled_by_profile_id uuid references public.profiles(id) on delete set null;

drop policy if exists "Cash handlers can submit own reconciliation" on public.cash_daily_reconciliations;
drop policy if exists "Cash handlers can update own reconciliation" on public.cash_daily_reconciliations;
drop policy if exists "Cash handlers or shift managers can submit reconciliation" on public.cash_daily_reconciliations;
drop policy if exists "Cash handlers or shift managers can update reconciliation" on public.cash_daily_reconciliations;

create policy "Shift managers can submit cashier cash-up"
  on public.cash_daily_reconciliations for insert to authenticated
  with check (
    (public.has_permission('cash.review') or public.has_permission('cash.manage'))
    and reconciled_by_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

create policy "Shift managers can update cashier cash-up"
  on public.cash_daily_reconciliations for update to authenticated
  using (public.has_permission('cash.review') or public.has_permission('cash.manage'))
  with check (
    (public.has_permission('cash.review') or public.has_permission('cash.manage'))
    and reconciled_by_profile_id = (select id from public.profiles where auth_user_id = auth.uid() limit 1)
  );

notify pgrst, 'reload schema';

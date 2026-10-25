create table if not exists public.app_error_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_auth_user_id uuid,
  source text not null check (source in ('staff', 'customer')),
  route text not null,
  message text not null,
  digest text,
  user_agent text,
  status text not null default 'Open' check (status in ('Open', 'Resolved')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_error_reports_created_at_idx
  on public.app_error_reports(created_at desc);
create index if not exists app_error_reports_status_created_at_idx
  on public.app_error_reports(status, created_at desc);
create index if not exists app_error_reports_reporter_created_at_idx
  on public.app_error_reports(reporter_auth_user_id, created_at desc);

alter table public.app_error_reports enable row level security;

drop policy if exists "Administrators can view app error reports" on public.app_error_reports;
create policy "Administrators can view app error reports"
  on public.app_error_reports for select to authenticated
  using (public.is_configuration_admin() or public.has_permission('access.view_audit'));

drop policy if exists "Administrators can resolve app error reports" on public.app_error_reports;
create policy "Administrators can resolve app error reports"
  on public.app_error_reports for update to authenticated
  using (public.is_configuration_admin() or public.has_permission('access.view_audit'))
  with check (public.is_configuration_admin() or public.has_permission('access.view_audit'));

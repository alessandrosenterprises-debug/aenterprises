create table if not exists public.enterprise_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid not null references public.profiles(id) on delete restrict,
  department_id uuid not null references public.departments(id) on delete restrict,
  concerned_person text,
  report_type text not null check (report_type in ('General', 'Incident', 'Customer concern', 'Staff matter', 'Finance', 'Operations', 'Safety', 'Suggestion')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  title text not null,
  details text not null,
  status text not null default 'Submitted' check (status in ('Submitted', 'In review', 'Returned', 'Resolved')),
  reviewed_by_profile_id uuid references public.profiles(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists enterprise_reports_department_status_idx
  on public.enterprise_reports(department_id, status, created_at desc);
create index if not exists enterprise_reports_reporter_idx
  on public.enterprise_reports(reporter_profile_id, created_at desc);
alter table public.enterprise_reports enable row level security;

grant select on public.departments to authenticated;
drop policy if exists "Staff can view departments for report routing" on public.departments;
create policy "Staff can view departments for report routing"
  on public.departments for select to authenticated
  using (public.has_permission('reports.submit') or public.has_permission('reports.review'));

insert into public.permissions (module, action, name, description, permission_key)
values
  ('reports', 'submit', 'Submit department reports', 'Submit reports, incidents, concerns and suggestions to the relevant department.', 'reports.submit'),
  ('reports', 'review', 'Review department reports', 'Review, route, return and resolve department reports.', 'reports.review')
on conflict (module, action) do update set
  name = excluded.name,
  description = excluded.description,
  permission_key = excluded.permission_key;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_key = 'reports.submit'
where r.name <> 'Customer'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.permission_key = 'reports.review'
where r.name in ('Super Administrator', 'Enterprise Manager', 'Business Manager', 'Supervisor', 'Accounts Department')
on conflict (role_id, permission_id) do nothing;

drop policy if exists "Staff can submit own department reports" on public.enterprise_reports;
create policy "Staff can submit own department reports"
  on public.enterprise_reports for insert to authenticated
  with check (
    public.has_permission('reports.submit')
    and reporter_profile_id = (select id from public.profiles where auth_user_id = auth.uid() and active = true limit 1)
  );
drop policy if exists "Reporters and reviewers can read reports" on public.enterprise_reports;
create policy "Reporters and reviewers can read reports"
  on public.enterprise_reports for select to authenticated
  using (
    reporter_profile_id = (select id from public.profiles where auth_user_id = auth.uid() and active = true limit 1)
    or public.has_permission('reports.review')
  );

create or replace function public.review_enterprise_report(
  p_report_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer_id uuid;
begin
  if auth.uid() is null or not public.has_permission('reports.review') then
    raise exception 'Department report review permission is required';
  end if;
  if p_status not in ('In review', 'Returned', 'Resolved') then
    raise exception 'Choose a valid report status';
  end if;
  if p_status in ('Returned', 'Resolved') and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception 'Add a review note before returning or resolving this report';
  end if;
  select id into reviewer_id from public.profiles where auth_user_id = auth.uid() and active = true limit 1;
  if reviewer_id is null then raise exception 'Active reviewer profile not found'; end if;

  update public.enterprise_reports
  set status = p_status,
      reviewed_by_profile_id = reviewer_id,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_at = now(),
      updated_at = now()
  where id = p_report_id and status in ('Submitted', 'In review', 'Returned');
  if not found then raise exception 'This report is no longer available for review'; end if;
end;
$$;
revoke all on function public.review_enterprise_report(uuid, text, text) from public;
grant execute on function public.review_enterprise_report(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';

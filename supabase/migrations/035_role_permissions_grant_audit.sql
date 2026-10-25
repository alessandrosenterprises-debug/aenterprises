-- Repair role_permissions tables created before grant attribution was added.
-- CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
alter table public.role_permissions
  add column if not exists granted_by uuid
  references public.profiles(id) on delete set null;

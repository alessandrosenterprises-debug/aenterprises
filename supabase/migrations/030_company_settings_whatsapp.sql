-- Keep WhatsApp contact information alongside the other enterprise-wide
-- contact fields. The settings screen and shared configuration service use it.
alter table public.company_settings
  add column if not exists whatsapp text;

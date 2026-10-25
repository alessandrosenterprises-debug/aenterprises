-- Enable low-latency staff alerts for new operational work. The dashboard also
-- polls as a fallback when Realtime is unavailable on a weak connection.
do $$
declare
  target_table text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach target_table in array array[
      'orders',
      'bookings',
      'customer_loan_applications',
      'technology_consultation_requests'
    ] loop
      if to_regclass(format('public.%I', target_table)) is not null
        and not exists (
          select 1
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename = target_table
        ) then
        execute format('alter publication supabase_realtime add table public.%I', target_table);
      end if;
    end loop;
  end if;
end $$;

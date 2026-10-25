-- Migration 039 briefly added a profiles SELECT policy that queried cash
-- permissions and the cash handler roster. Those checks touch profiles again,
-- causing PostgreSQL to detect recursive RLS evaluation (42P17) for profile,
-- notification, and dashboard queries. The existing own-profile and
-- configuration-admin policies already cover direct profile access; cash
-- handler identities are exposed through the security-definer roster RPC.
drop policy if exists "Cash reviewers can read cash handler identities" on public.profiles;

notify pgrst, 'reload schema';

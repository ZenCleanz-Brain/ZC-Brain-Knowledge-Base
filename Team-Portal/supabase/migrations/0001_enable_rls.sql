-- ============================================================================
-- 0001_enable_rls.sql  —  Defense-in-depth: enable Row Level Security (RLS)
-- ============================================================================
--
-- WHY THIS IS SAFE TO APPLY:
--   This app does NOT use Supabase Auth. It uses NextAuth, and ALL database
--   access happens server-side via the Supabase SECRET key (SUPABASE_SECRET_KEY,
--   used only in lib/supabase/server.ts). A secret key BYPASSES RLS entirely, so
--   enabling RLS does NOT break any legitimate server-side query.
--
--   What RLS DOES buy us: if a Supabase URL + a low-privilege (anon/publishable)
--   key are ever exposed to the browser, RLS-without-policies denies all access
--   by default. With no permissive policies present, the only way in is the
--   server's secret key. This closes the latent hole created by the previous bug
--   (a secret key shipped under NEXT_PUBLIC_SUPABASE_ANON_KEY into the browser).
--
-- IMPORTANT — NO PERMISSIVE POLICIES ON PURPOSE:
--   We intentionally do NOT create any `anon` / `authenticated` policies such as
--   `USING (true) WITH CHECK (true)`. Such a policy would re-open public access
--   and defeat the point. All access must flow through the server's secret key.
--   (See the DROP POLICY below — the old setup script added exactly such a
--    permissive policy on pending_edits; we remove it here.)
--
-- HOW TO APPLY (NOT done automatically; user/lead must run deliberately):
--   Option A: Supabase SQL editor — paste the contents of ENABLE-RLS.sql (root).
--   Option B: Supabase CLI — `supabase link --project-ref vconqnpmybosduyhtbmu`
--             then `supabase db push`.
-- ============================================================================

-- 1) Enable RLS on EVERY table in the public schema (current and pre-existing).
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', r.tablename);
  end loop;
end $$;

-- 2) Explicit calls for clarity / documentation (idempotent with the loop above).
alter table public.pending_edits enable row level security;
-- saved_answers exists in this app too; enable explicitly as well.
-- (Wrapped so the migration still succeeds if the table is not present yet.)
do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'saved_answers'
  ) then
    execute 'alter table public.saved_answers enable row level security;';
  end if;
end $$;

-- 3) Remove the legacy permissive policy that the old setup script created.
--    `"Allow all operations for now" USING (true) WITH CHECK (true)` would let
--    any role do anything and defeats this hardening. Drop it if present.
drop policy if exists "Allow all operations for now" on public.pending_edits;

-- Note: we deliberately add NO new policies. With RLS enabled and zero policies,
-- Postgres denies all access to non-owner roles by default. The server's secret
-- key bypasses RLS, so legitimate app traffic is unaffected.

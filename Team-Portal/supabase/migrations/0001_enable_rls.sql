-- ============================================================================
-- 0001_enable_rls.sql  —  Enable Row Level Security (RLS) for KB Portal tables.
-- ============================================================================
--
-- SCOPE WARNING (IMPORTANT):
--   This Supabase project (vconqnpmybosduyhtbmu) is SHARED by multiple apps:
--     - KB Portal (this app):      pending_edits, saved_answers
--     - IFL / Image Feedback Loop:  ifl_facilities, ifl_images, ifl_projects,
--                                   ifl_zones, ifl_comments, ifl_sessions, ifl_votes
--     - Dashboard / misc:           dashboard_feedback, product_costs
--
--   An earlier version of this file blanket-enabled RLS on EVERY public table via
--   a pg_tables sweep. That BROKE the IFL app, which reads/writes
--   ifl_facilities/ifl_images/ifl_projects/ifl_zones from the browser via the anon
--   key with RLS OFF. Never do that here. The IFL tables need their own app-aware
--   remediation. This migration only secures the KB Portal's own tables.
--
-- WHY SAFE: the KB Portal does ALL DB access server-side via the SECRET key
--   (SUPABASE_SECRET_KEY, lib/supabase/server.ts), which bypasses RLS. RLS with no
--   permissive policy denies anon/authenticated while the server keeps working.
-- ============================================================================

alter table public.pending_edits enable row level security;
alter table public.saved_answers enable row level security;

-- Remove the legacy permissive policy that allowed any role full access.
drop policy if exists "Allow all operations for now" on public.pending_edits;

-- NOTE: No new policies are created on purpose. All legitimate KB Portal access
-- flows through the server's secret key, which bypasses RLS.

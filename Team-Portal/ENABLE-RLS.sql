-- ============================================================================
-- Enable Row Level Security (RLS) for the KB Portal tables ONLY.
-- ============================================================================
--
-- SCOPE WARNING (IMPORTANT — read before running):
--   This Supabase project (vconqnpmybosduyhtbmu) is SHARED by multiple apps:
--     - KB Portal (this app):      pending_edits, saved_answers
--     - IFL / Image Feedback Loop:  ifl_facilities, ifl_images, ifl_projects,
--                                   ifl_zones, ifl_comments, ifl_sessions, ifl_votes
--     - Dashboard / misc:           dashboard_feedback, product_costs
--
--   Do NOT blanket-enable RLS on every public table in this project. The IFL app
--   reads/writes ifl_facilities/ifl_images/ifl_projects/ifl_zones from the BROWSER
--   via the anon key with RLS OFF; enabling RLS on those (with no matching policy)
--   BREAKS IFL. Those tables need their own app-aware remediation. This script
--   only touches the KB Portal's own tables.
--
-- WHY THIS IS SAFE:
--   The KB Portal does ALL database access server-side via the SECRET key
--   (SUPABASE_SECRET_KEY, lib/supabase/server.ts), which bypasses RLS. Enabling
--   RLS with no permissive policy denies anon/authenticated while the server keeps
--   working. We also drop the legacy permissive "Allow all operations for now"
--   policy on pending_edits.
-- ============================================================================

alter table public.pending_edits enable row level security;
alter table public.saved_answers enable row level security;

drop policy if exists "Allow all operations for now" on public.pending_edits;

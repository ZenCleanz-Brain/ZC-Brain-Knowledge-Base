-- Run this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Create the pending_edits table
CREATE TABLE IF NOT EXISTS pending_edits (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  original_sha TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_edits_status ON pending_edits(status);
CREATE INDEX IF NOT EXISTS idx_pending_edits_file_path ON pending_edits(file_path);
CREATE INDEX IF NOT EXISTS idx_pending_edits_submitted_at ON pending_edits(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE pending_edits ENABLE ROW LEVEL SECURITY;

-- SECURITY-FIX: do NOT add a permissive "allow all" policy.
-- All database access happens server-side via the Supabase SECRET key
-- (SUPABASE_SECRET_KEY, server-only), which bypasses RLS. With RLS enabled and
-- NO policies, every other role is denied by default. A previous version of this
-- file created `CREATE POLICY "Allow all operations for now" ... USING (true)`,
-- which re-opened public access — that policy is intentionally removed here and
-- dropped by supabase/migrations/0001_enable_rls.sql.
DROP POLICY IF EXISTS "Allow all operations for now" ON pending_edits;

-- Verify the table was created
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'pending_edits'
ORDER BY ordinal_position;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema for pending_edits table:
// CREATE TABLE pending_edits (
//   id TEXT PRIMARY KEY,
//   file_path TEXT NOT NULL,
//   file_name TEXT NOT NULL,
//   original_content TEXT NOT NULL,
//   new_content TEXT NOT NULL,
//   original_sha TEXT NOT NULL,
//   submitted_by TEXT NOT NULL,
//   submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   status TEXT DEFAULT 'pending',
//   reviewed_by TEXT,
//   reviewed_at TIMESTAMP WITH TIME ZONE,
//   review_note TEXT
// );

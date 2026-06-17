// SERVER-ONLY Supabase client.
//
// SECURITY: This module must NEVER be imported from a client component or any
// code that ends up in the browser bundle. It reads a Supabase SECRET key
// (sb_secret_...) which bypasses Row Level Security entirely. If this key ever
// reaches the browser, anyone can read/write every table in the database.
//
// The `import 'server-only'` guard below makes the build FAIL if this file is
// ever pulled into a client bundle (the package throws at module init in a
// browser/client context). `server-only` ships transitively with Next.js, so
// no extra install is required.
import 'server-only';

import { createClient } from '@supabase/supabase-js';

// Server-side env vars (NO `NEXT_PUBLIC_` prefix, so they are never inlined
// into client JS). The URL is not secret, so we accept either the server var
// or the existing public URL var as a fallback.
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// SECURITY-FIX: previously this read NEXT_PUBLIC_SUPABASE_ANON_KEY, which
// inlined a SECRET key into the browser bundle. It now reads a server-only var.
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl) {
  console.error('[supabase/server] Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseSecretKey) {
  console.error('[supabase/server] Missing SUPABASE_SECRET_KEY (server-only secret key)');
}

// The secret key bypasses RLS; never persist or expose a session.
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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

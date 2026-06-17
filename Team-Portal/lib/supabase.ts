// SECURITY-FIX: This file previously created a Supabase client from
// `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, which (a) was misnamed because it
// actually held a SECRET key, and (b) the `NEXT_PUBLIC_` prefix caused Next.js to
// inline that secret into the browser bundle. A secret key bypasses RLS, so this
// shipped full database access to every visitor.
//
// The real client now lives in `lib/supabase/server.ts`, reads the secret from a
// server-only `SUPABASE_SECRET_KEY` var, and is guarded with `import 'server-only'`.
//
// This shim re-exports that server-only client so existing server-side importers
// (e.g. `lib/store.ts`, used only by API route handlers) keep working unchanged.
// The `server-only` guard makes the build fail if anything client-side imports it.
import 'server-only';

export { supabase } from './supabase/server';

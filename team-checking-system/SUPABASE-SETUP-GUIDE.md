# 🔧 Supabase Connection Issue - Fix Guide

## ⚠️ Problem Identified

Your Supabase connection is failing because the API key in your `.env` file is incomplete:

```
Current key: sb_secret_njgUlMWKxRg1uJb1k4G5NA_YXoyT-Wb
                                    ↑
                              Only 41 characters!
```

A valid Supabase **anon** key should:
- Start with `eyJ` (it's a JWT token)
- Be 200-300 characters long
- Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...` (much longer)

## 🎯 How to Fix

### Step 1: Get Your Correct Supabase Keys

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **vconqnpmybosduyhtbmu**
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** under Project Settings
5. You'll see two keys:
   - **anon public** key (this is what you need!)
   - **service_role** key (keep this secret, don't use it in NEXT_PUBLIC variables)

### Step 2: Update Your .env File

Open: `Team Checking System\.env`

Replace this line:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_secret_njgUlMWKxRg1uJb1k4G5NA_YXoyT-Wb
```

With:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (paste your full anon public key here)
```

**Important**:
- Use the **anon public** key (starts with `eyJ`)
- NOT the service_role key (starts with `eyJhbGciOi` but marked as "secret")
- The key should be VERY LONG (200+ characters)

### Step 3: Verify Your Database Table Exists

In Supabase dashboard:

1. Go to **Table Editor** (left sidebar)
2. Check if `pending_edits` table exists
3. If NOT, go to **SQL Editor** and run this:

```sql
-- Create pending_edits table
CREATE TABLE IF NOT EXISTS pending_edits (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  original_sha TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_note TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_edits_status ON pending_edits(status);
CREATE INDEX IF NOT EXISTS idx_pending_edits_file_path ON pending_edits(file_path);
CREATE INDEX IF NOT EXISTS idx_pending_edits_submitted_at ON pending_edits(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE pending_edits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're handling auth in Next.js)
CREATE POLICY "Allow all operations" ON pending_edits
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test It

1. Log in as an **editor** (not admin)
2. Edit a document
3. Click "Save and Commit"
4. It should create a pending edit (not commit directly)
5. Go to "Pending Reviews" - you should see your edit!

## 🔍 Understanding the Workflow

### When You're Logged in as ADMIN:
```
Edit Document → Save → Commits DIRECTLY to GitHub ✅
(No pending review needed)
```

### When You're Logged in as EDITOR:
```
Edit Document → Save → Creates Pending Edit in Supabase ⏳
                     → Admin reviews and approves
                     → Then commits to GitHub ✅
```

## 🐛 Troubleshooting

### Still seeing "Invalid API key"?

1. **Check the key length**: Should be 200+ characters
2. **Check it starts with `eyJ`**: If it starts with anything else, it's wrong
3. **No quotes**: The .env value should NOT have quotes around it
4. **Restart required**: Must restart `npm run dev` after changing .env

### Can't find the anon key in Supabase?

Make sure you're looking at **API settings**, not **Database settings**:
- Dashboard → Your Project → ⚙️ Settings → **API** → **Project API keys**

### "getaddrinfo ENOTFOUND" error?

This means the Supabase URL is also invalid. Check:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vconqnpmybosduyhtbmu.supabase.co
```

Should match your project reference ID from Supabase dashboard.

## ✅ Success Indicators

When everything is working:

1. **No errors in console** about Supabase or API keys
2. **Editors can create pending edits** that show up in "Pending Reviews"
3. **Admins can approve/reject** those edits
4. **History shows all activity** (approved, rejected, pending)

---

**Need Help?** Check the server logs in your terminal - they'll show specific error messages if something is still wrong!

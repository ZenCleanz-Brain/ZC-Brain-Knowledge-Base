# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created

## 2. Create the `pending_edits` Table

Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE pending_edits (
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

-- Add index for faster queries
CREATE INDEX idx_pending_edits_status ON pending_edits(status);
CREATE INDEX idx_pending_edits_file_path ON pending_edits(file_path);
```

## 3. Get Your API Keys

1. Go to Project Settings > API
2. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public** key

## 4. Add to `.env` File

Add these environment variables to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 5. Restart the Development Server

```bash
npm run dev
```

Now your pending edits will be stored in Supabase and persist across server restarts!

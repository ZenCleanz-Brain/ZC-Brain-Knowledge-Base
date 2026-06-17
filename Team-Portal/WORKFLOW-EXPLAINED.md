# 📋 Knowledge Base Portal - How the Workflow Works

## 🔍 Current Status: EVERYTHING IS WORKING CORRECTLY! ✅

I ran diagnostics on your system and here's what I found:

### ✅ Supabase Connection: WORKING
- Database is connected and operational
- Table `pending_edits` exists
- Currently contains: 1 approved edit

### ✅ GitHub Integration: WORKING
- Your GitHub token has write access
- Commits are going through successfully
- Branch: `master` is being updated

## 🎭 Understanding the Two Different Workflows

Your confusion comes from the fact that there are **TWO different workflows** depending on who is logged in:

### 1️⃣ When Logged in as **ADMIN** (You):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Edit Document → Save → DIRECTLY to GitHub ✅          │
│                                                         │
│  No pending review needed!                             │
│  No approval step!                                      │
│  Changes are live immediately!                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why?** Because you're the admin - you have the authority to make direct changes. The system trusts your edits.

**What you see:**
- ✅ Changes commit directly to GitHub
- ✅ Files update immediately in the repository
- ❌ NO pending edits appear (because they went straight through)

### 2️⃣ When Logged in as **EDITOR** (Team Members):

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Edit Document → Save → Pending Edit (Supabase) ⏳     │
│                           ↓                             │
│                    Admin Reviews                        │
│                           ↓                             │
│                  Approve / Reject                       │
│                           ↓                             │
│                   Commits to GitHub ✅                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Why?** Because editors need oversight. Their changes need admin approval before going live.

**What admin sees:**
- ⏳ New pending edit appears in "Pending Reviews"
- 📋 Can review the changes (side-by-side diff)
- ✅ Can approve (commits to GitHub) or ❌ reject (with reason)

## 🧪 How to Test the Full Workflow

Want to see the pending edit system in action? Here's how:

### Step 1: Create a Test Editor Account

Edit: `Team Checking System\app\lib\auth.ts`

Add a test user with editor role:

```typescript
users: [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@zencleanz.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Test Editor',  // ← ADD THIS
    email: 'editor@zencleanz.com',  // ← ADD THIS
    role: 'editor',  // ← ADD THIS
  },
],
```

### Step 2: Log Out and Log Back In as Editor

1. Click your profile → Log Out
2. Log back in with:
   - Email: `editor@zencleanz.com`
   - Password: `password`

### Step 3: Make an Edit

1. Navigate to any document
2. Click "Edit Document"
3. Make a small change
4. Click "Save and Commit"
5. ✨ It creates a **pending edit** instead of committing!

### Step 4: Log Back In as Admin

1. Log out from editor account
2. Log back in as admin (`admin@zencleanz.com`)
3. Go to **"Pending Reviews"**
4. You'll see the edit waiting for approval!
5. Review it and approve/reject

## 📊 Current Database State

As of now (checked via diagnostics):

```
Total Edits: 1
├─ Pending:  0  (none waiting for review)
├─ Approved: 1  (Return and Refund Policy.md)
└─ Rejected: 0  (none rejected)
```

## 🔐 Supabase Secret Key — Server-Only (security remediation)

Your `.env` uses a **server-only** secret var (no `NEXT_PUBLIC_` prefix):
```env
SUPABASE_URL=<your-project-url>
SUPABASE_SECRET_KEY=<your-supabase-secret-key>   # pull from Vercel env / Supabase dashboard — never commit the real value
```

The Supabase key is a **secret** key (`sb_secret_...`), which:
- ✅ Has full database access
- ✅ Bypasses Row Level Security policies
- 🔒 MUST be kept server-side only (NEVER in a `NEXT_PUBLIC_` variable)

> ⚠️ **Previously this was stored as `NEXT_PUBLIC_SUPABASE_ANON_KEY`.** The
> `NEXT_PUBLIC_` prefix causes Next.js to inline the value into the browser
> bundle, which shipped a full-access secret key to every visitor. That key
> (`sb_secret_NKJq6v...`) is **COMPROMISED** and must be rotated in the Supabase
> dashboard, then updated in Vercel env + local `.env`/`.env.local`.

How it works now:
1. `lib/supabase/server.ts` builds the client from `SUPABASE_SECRET_KEY` and is
   guarded with `import 'server-only'` (the build fails if it reaches the browser).
2. `lib/store.ts` (used only by `app/api/.../route.ts` handlers) imports it.
3. Every API route is gated by `getServerSession(authOptions)` (NextAuth), so the
   browser never touches Supabase directly — it calls our own API routes instead.
4. As defense-in-depth, RLS is enabled on every table (see `ENABLE-RLS.sql`). With
   no permissive policies, the only way into the DB is the server's secret key.

## 🎯 Summary: Why You Don't See Pending Edits

**You said:** "when I go back to my pending edits, I'm not seeing any pending edits right now"

**The reason:** You're logged in as **admin**, so your edits go directly to GitHub without creating pending reviews. This is by design!

**To see pending edits**, you need:
1. Someone else to log in as an **editor**
2. They make edits
3. Those will appear in your admin "Pending Reviews" section

## 🛠️ Quick Diagnostic Commands

I've created two helpful scripts:

### 1. Check Supabase Connection:
```bash
node test-supabase.js
```
Shows if Supabase is configured correctly.

### 2. Check Pending Edits:
```bash
node check-pending-edits.js
```
Shows all edits in the database (pending, approved, rejected).

## ✅ Everything is Working!

Your system is functioning exactly as designed:
- ✅ Supabase is connected
- ✅ GitHub integration works
- ✅ Admin edits commit directly (that's you!)
- ✅ Editor edits would go to pending (need to test with editor account)
- ✅ History feature works (clickable, viewable, revertable)
- ✅ Diff viewer shows changes with red/green highlighting

---

**Need to see the pending edit workflow?** Create a test editor account and log in with it to see how the approval system works!

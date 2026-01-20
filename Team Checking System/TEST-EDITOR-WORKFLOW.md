# 🧪 Testing the Editor Workflow

## ✅ Editor Account Created!

A new editor user has been added to your system:

```
Username: team
Password: editor
Role:     editor
```

## 🎯 How to Test the Pending Edit Workflow

### Step 1: Access the Application

Open your browser and go to:
```
http://localhost:3002
```

(Note: The server is running on port 3002 because 3000 and 3001 were already in use)

### Step 2: Log Out (if currently logged in as admin)

1. Click your profile icon in the top right
2. Click "Log Out"

### Step 3: Log In as Editor

On the login page:
- **Username:** `team`
- **Password:** `editor`
- Click "Sign In"

### Step 4: Make an Edit

1. Click "Browse Knowledge Base" from the dashboard
2. Navigate to any document (e.g., a product file or blog)
3. Click "Edit Document" button
4. Make a small change (add a word, change a sentence)
5. Click "Save and Commit"

### Step 5: What You Should See

After clicking "Save and Commit":
- ✅ A success message: "Changes saved for review!"
- ⚠️ The edit is **NOT committed to GitHub** yet
- 📋 Instead, it's saved to Supabase as a **pending edit**

### Step 6: Log Back In as Admin

1. Log out from the editor account
2. Log back in as admin:
   - **Username:** `admin`
   - **Password:** `admin`

### Step 7: Review the Pending Edit

1. From the dashboard, click **"Pending Reviews"** (or "Review Edits" quick action)
2. You'll see the edit from the "team" user waiting for review!
3. Click on it to see the side-by-side diff with red/green highlighting
4. You can:
   - ✅ **Approve** - This will commit the changes to GitHub
   - ❌ **Reject** - This will reject the edit (with optional reason)

### Step 8: Check History

After approving or rejecting:
1. Go back to the dashboard
2. Look at "Recent Activity"
3. Click on the edit to see its full history
4. If approved, you can even **revert** it back to the original!

## 📊 Visual Workflow

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  👤 Login as "team" (editor)                           │
│        ↓                                                │
│  📝 Edit a document                                     │
│        ↓                                                │
│  💾 Save and Commit                                     │
│        ↓                                                │
│  ⏳ Creates Pending Edit (Supabase)                    │
│                                                         │
│  ---------------------------------------------------   │
│                                                         │
│  👤 Login as "admin"                                    │
│        ↓                                                │
│  📋 Go to "Pending Reviews"                            │
│        ↓                                                │
│  👀 Review the changes (side-by-side diff)             │
│        ↓                                                │
│  ✅ Approve OR ❌ Reject                                │
│        ↓                                                │
│  🚀 If approved → Commits to GitHub!                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔍 Checking What's in the Database

At any time, you can run:

```bash
node check-pending-edits.js
```

This will show you:
- How many pending edits exist
- How many have been approved
- How many have been rejected
- Details of each edit

## 🆚 Comparing Admin vs Editor Behavior

### When Logged in as Admin:
- Edits commit **directly** to GitHub
- No pending review created
- Changes are live immediately
- No approval needed

### When Logged in as Editor (team):
- Edits create **pending review**
- Goes to Supabase database
- Waits for admin approval
- Only commits to GitHub after approval

## 🎉 What You're Testing

1. ✅ Editor can create pending edits
2. ✅ Admin can see pending edits in "Pending Reviews"
3. ✅ Side-by-side diff viewer shows changes with red/green highlighting
4. ✅ Admin can approve or reject edits
5. ✅ Approved edits commit to GitHub
6. ✅ History shows all activity
7. ✅ Approved edits can be reverted

---

**Enjoy testing!** This demonstrates the full editorial workflow that allows your team to submit changes for review before they go live.

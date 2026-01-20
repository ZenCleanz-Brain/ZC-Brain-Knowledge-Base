# Keeping Cursor IDE Synced with GitHub

This guide explains how to keep your local files in Cursor IDE synchronized with the GitHub repository.

## Method 1: Auto-Sync with Git (Recommended)

### Initial Setup (One-Time)

1. **Open Terminal in Cursor** (Ctrl + `)

2. **Navigate to your markdown files folder**:
   ```bash
   cd "c:\Users\User\OneDrive - ZenCleanz\ZENCLEANZ - MASTER FOLDER\ZC Brain\ZCBRAIN KNOWLEDGE BASE\Punlished Markdown Files"
   ```

3. **Check if this is already a git repository**:
   ```bash
   git status
   ```

   If you see an error like "not a git repository", run:
   ```bash
   git init
   git remote add origin https://github.com/ZenCleanz-Brain/ZC-Brain-Knowledge-Base.git
   git fetch origin master
   git reset --hard origin/master
   ```

### Daily Workflow

#### **Before You Start Editing** (Pull Latest Changes)
```bash
cd "c:\Users\User\OneDrive - ZenCleanz\ZENCLEANZ - MASTER FOLDER\ZC Brain\ZCBRAIN KNOWLEDGE BASE\Punlished Markdown Files"
git pull origin master
```

This downloads any changes made through the web portal.

#### **After Editing in Cursor** (Push Your Changes)
```bash
cd "c:\Users\User\OneDrive - ZenCleanz\ZENCLEANZ - MASTER FOLDER\ZC Brain\ZCBRAIN KNOWLEDGE BASE\Punlished Markdown Files"
git add .
git commit -m "Update content from Cursor IDE"
git push origin master
```

## Method 2: Using VS Code Source Control Panel

Cursor inherits VS Code's git integration:

1. Click the **Source Control** icon in the left sidebar (looks like a branch)
2. Click **"Initialize Repository"** if needed
3. **Before editing**: Click the ⟲ (sync) button to pull latest changes
4. **After editing**:
   - Review your changes
   - Enter a commit message
   - Click ✓ (checkmark) to commit
   - Click ⟲ (sync) to push

## Method 3: Automated Sync (Advanced)

Create a simple script that runs before/after you work:

### Windows PowerShell Script

Create `sync-repo.ps1`:
```powershell
# Navigate to repo
Set-Location "c:\Users\User\OneDrive - ZenCleanz\ZENCLEANZ - MASTER FOLDER\ZC Brain\ZCBRAIN KNOWLEDGE BASE\Punlished Markdown Files"

# Pull latest changes
Write-Host "Pulling latest changes..." -ForegroundColor Green
git pull origin master

# If there are uncommitted changes, commit and push them
$status = git status --porcelain
if ($status) {
    Write-Host "Found local changes, committing..." -ForegroundColor Yellow
    git add .
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "Auto-sync: $timestamp"
    git push origin master
    Write-Host "Changes pushed!" -ForegroundColor Green
} else {
    Write-Host "No local changes to commit." -ForegroundColor Cyan
}
```

Run it with:
```powershell
.\sync-repo.ps1
```

## How This Works with the Portal

### When Changes Are Made in the Portal:
1. Editor/Admin edits a file in the web portal
2. Changes go to **Pending Reviews** (stored in Supabase)
3. Admin approves → commits to GitHub
4. **You run `git pull`** → changes appear in Cursor

### When You Edit in Cursor:
1. You edit files directly in Cursor IDE
2. **You run `git push`** → changes go to GitHub
3. Portal automatically fetches latest from GitHub
4. Everyone sees your changes immediately

## Best Practices

1. **Always pull before editing** to avoid conflicts
2. **Commit small, focused changes** with clear messages
3. **Sync frequently** (at least start/end of day)
4. **Use the portal for review workflow** (edit → pending → approve)
5. **Use Cursor for bulk edits** across multiple files

## Handling Merge Conflicts

If you get a merge conflict:

```bash
# See which files have conflicts
git status

# Option 1: Keep your version
git checkout --ours path/to/conflicted/file.md

# Option 2: Keep their version (from portal)
git checkout --theirs path/to/conflicted/file.md

# Option 3: Manually resolve in Cursor
# Open the file, edit the conflict markers, then:
git add path/to/conflicted/file.md
git commit -m "Resolved merge conflict"
```

## Quick Reference Commands

```bash
# Check status
git status

# Pull latest changes
git pull origin master

# Commit and push your changes
git add .
git commit -m "Your commit message"
git push origin master

# See recent commits
git log --oneline -10

# Undo local changes (before commit)
git restore path/to/file.md

# Create a backup branch before risky changes
git checkout -b backup-$(date +%Y%m%d)
```

## Setting Up Git Credentials (One-Time)

To avoid entering password every time:

```bash
# Use your GitHub username
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Store credentials (Windows)
git config --global credential.helper wincred
```

When prompted for password, use a **Personal Access Token** (not your GitHub password):
1. Go to https://github.com/settings/tokens
2. Generate new token with `repo` scope
3. Use this token as your password

## Troubleshooting

### "Permission denied"
- Make sure you're using a token with `repo` scope as password
- Run `git config --global credential.helper wincred` to cache it

### "Repository not found"
- Check the remote URL: `git remote -v`
- Should show: `https://github.com/ZenCleanz-Brain/ZC-Brain-Knowledge-Base.git`

### "Your local changes would be overwritten"
```bash
# Stash your changes temporarily
git stash

# Pull latest
git pull origin master

# Re-apply your changes
git stash pop
```

### "Diverged branches"
```bash
# Force pull (careful - overwrites local changes!)
git fetch origin master
git reset --hard origin/master
```

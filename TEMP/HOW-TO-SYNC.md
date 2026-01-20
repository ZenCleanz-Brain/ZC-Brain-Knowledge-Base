# 🔄 How to Keep Cursor IDE Synced with GitHub

Your local files and the GitHub repository are now connected! Here's how to keep them in sync.

## 📁 Sync Scripts (Just Created!)

I've created three simple scripts in this folder:

### 1. **pull-latest.bat** - Before You Start Editing
- **When to use**: Before you start working in Cursor
- **What it does**: Downloads any changes made through the web portal
- **How to use**: Just double-click this file!

### 2. **push-changes.bat** - After You Finish Editing
- **When to use**: After you've edited files in Cursor
- **What it does**: Uploads your changes to GitHub
- **How to use**: Double-click, enter a commit message (or press Enter for auto-message)

### 3. **full-sync.bat** - Complete Two-Way Sync
- **When to use**: Start or end of your work session
- **What it does**: Pulls latest, then pushes your changes
- **How to use**: Double-click and follow prompts

## 🎯 Recommended Daily Workflow

### Morning (Before Editing):
1. Double-click **`pull-latest.bat`**
2. Start editing in Cursor IDE

### Evening (After Editing):
1. Double-click **`push-changes.bat`**
2. Enter a message describing what you changed
3. Done! Your changes are on GitHub

### Quick Version:
Just double-click **`full-sync.bat`** - it does everything!

## 💡 Using Cursor's Built-in Git Panel

Cursor IDE (like VS Code) has a built-in git interface:

1. **Click the Source Control icon** in the left sidebar (looks like a branch: 🌿)
2. **Before editing**: Click the ⟲ (sync/pull) button at the top
3. **After editing**:
   - You'll see your changed files listed
   - Enter a commit message at the top
   - Click the ✓ (checkmark) to commit
   - Click ⟲ (sync) to push

## 🔍 Checking What Changed

### In File Explorer:
- Modified files show a yellow dot in Cursor's file tree

### In Terminal:
```bash
git status
```

### View Recent Changes:
```bash
git log --oneline -10
```

## ⚠️ Troubleshooting

### "Merge Conflict" Error
This happens when both you and the portal edited the same file:

**Solution**:
1. Open the conflicted file in Cursor
2. Look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Choose which version to keep (or merge both)
4. Delete the conflict markers
5. Save the file
6. Run `push-changes.bat` again

### "Permission Denied"
Your git credentials might need updating:

**Solution**:
```bash
git config credential.helper wincred
```
Next time you push, enter:
- Username: `ZenCleanz-Brain`
- Password: Use your GitHub Personal Access Token (not your password!)

### "Repository Ahead/Behind"
Your local repo and GitHub are out of sync:

**Solution**:
Just run `full-sync.bat` - it handles this automatically!

## 🔐 Security Note

Your GitHub credentials are cached securely by Windows Credential Manager. If you ever need to update them:

1. Press Windows key + R
2. Type: `control /name Microsoft.CredentialManager`
3. Find and edit the GitHub credential

## 📊 How This Works with the Portal

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Edit in Cursor ───> Git Push ───> GitHub      │
│        ↑                              │         │
│        │                              ↓         │
│        │                         Portal Reads   │
│        │                              │         │
│   Git Pull <─── GitHub <─── Portal Approves    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**When you edit in Cursor**:
1. Edit files → Save
2. Run `push-changes.bat`
3. Changes appear in GitHub immediately
4. Portal shows your latest version

**When edits are approved in portal**:
1. Someone edits via web portal
2. Admin approves → commits to GitHub
3. Run `pull-latest.bat`
4. Changes appear in Cursor

## ✅ Best Practices

1. **Pull before editing** - Always sync down first to avoid conflicts
2. **Commit often** - Don't wait days to push changes
3. **Write clear messages** - "Updated pricing" not "changes"
4. **Check status** - Before closing, make sure all changes are pushed
5. **Use the portal for reviews** - Let editors submit, admins approve

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| Pull latest changes | Double-click `pull-latest.bat` |
| Push your changes | Double-click `push-changes.bat` |
| Full two-way sync | Double-click `full-sync.bat` |
| Check what changed | `git status` in terminal |
| View recent commits | `git log --oneline -10` |
| Undo unsaved changes | `git restore filename.md` |

---

**Need help?** The scripts will show clear error messages if something goes wrong!

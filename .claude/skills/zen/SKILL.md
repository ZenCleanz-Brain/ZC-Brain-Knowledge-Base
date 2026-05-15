---
name: zen
description: Switch all CLIs (GitHub, Vercel, Supabase) to ZenCleanz accounts
user-invocable: true
disable-model-invocation: true
allowed-tools: Bash
argument-hint: [check|switch]
---

# /zen — ZenCleanz Account Switcher

Switch or verify all CLI accounts for the ZenCleanz project.

## Expected Accounts

- **GitHub CLI**: `ZenCleanz-Brain`
- **Vercel**: Username `zencleanz-brain`
- **Supabase**: Project `vconqnpmybosduyhtbmu`
- **Git Remote**: `ZenCleanz-Brain/ZC-Brain-Knowledge-Base`

## CLI Paths (Windows)

- gh: `"C:\Program Files\GitHub CLI\gh.exe"`
- vercel: `npx vercel`
- supabase: `"C:\Users\User\scoop\shims\supabase.exe"`

## Steps

Run these checks sequentially. Report results in a table.

### 1. GitHub

```
"C:\Program Files\GitHub CLI\gh.exe" auth status
```

- If logged in as `ZenCleanz-Brain` → OK
- If wrong account or not logged in → run `"C:\Program Files\GitHub CLI\gh.exe" auth login`

### 2. Vercel

The Vercel token is stored in `.claude/local-secrets.md` (gitignored). Read it
into a variable first, then pass it via `--token`. Never paste the token inline
in commands or files committed to the repo.

PowerShell:

```powershell
$VERCEL_TOKEN = (Get-Content .claude/local-secrets.md |
  Select-String '^VERCEL_TOKEN=' |
  ForEach-Object { ($_ -split '=', 2)[1].Trim() })
npx vercel whoami --token $VERCEL_TOKEN
```

- If `zencleanz-brain` → OK
- If error or wrong account → token may have expired; ask user for a new token from https://vercel.com/account/tokens, then update `.claude/local-secrets.md`
- Always pass `--token $VERCEL_TOKEN` (loaded from `.claude/local-secrets.md`) for all vercel commands (browser login doesn't work in this environment)
- If `.claude/local-secrets.md` is missing, copy `.claude/local-secrets.example.md` to `.claude/local-secrets.md` and fill in the token

### 3. Supabase

```
"C:\Users\User\scoop\shims\supabase.exe" projects list
```

- If project `vconqnpmybosduyhtbmu` is listed → OK
- If not listed or not logged in → run `"C:\Users\User\scoop\shims\supabase.exe" login` then `"C:\Users\User\scoop\shims\supabase.exe" link --project-ref vconqnpmybosduyhtbmu`

### 4. Git Remote

```
git remote -v
```

- If origin is `ZenCleanz-Brain/ZC-Brain-Knowledge-Base` → OK
- If wrong → run `git remote set-url origin https://ZenCleanz-Brain@github.com/ZenCleanz-Brain/ZC-Brain-Knowledge-Base.git`

## Output

Show a summary table:

| Service | Status | Account |
| ------- | ------ | ------- |
| GitHub  | ✅/⚠️  | ...     |
| Vercel  | ✅/⚠️  | ...     |
| Supabase| ✅/⚠️  | ...     |
| Git     | ✅/⚠️  | ...     |

If any account needs switching, run the fix commands automatically (ask user before login commands that need browser interaction).

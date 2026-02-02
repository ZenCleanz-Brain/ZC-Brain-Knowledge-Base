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

```
npx vercel whoami --token XhJoaKXKs5hnPpIa8MFyYhLE
```

- If `zencleanz-brain` → OK
- If error or wrong account → token may have expired; ask user for a new token from https://vercel.com/account/tokens
- Always use `--token XhJoaKXKs5hnPpIa8MFyYhLE` flag for all vercel commands (browser login doesn't work in this environment)

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

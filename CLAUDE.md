# ZC Brain Knowledge Base

## Project Overview
Knowledge base repository for ZenCleanz, integrated with ElevenLabs (voice AI), n8n (automation), and Vercel (deployment).

## Required Accounts

| Service | Expected Account | CLI Check Command |
|---------|-----------------|-------------------|
| **GitHub** | Account: `ZenCleanz-Brain` | `"C:\Program Files\GitHub CLI\gh.exe" auth status` |
| **Vercel** | Username: `zencleanz-brain` | `npx vercel whoami --token XhJoaKXKs5hnPpIa8MFyYhLE` |
| **Supabase** | Project: `vconqnpmybosduyhtbmu` | `"C:\Users\User\scoop\shims\supabase.exe" projects list` |
| **Git Remote** | `ZenCleanz-Brain/ZC-Brain-Knowledge-Base` | `git remote -v` |

### Verification
- A **SessionStart hook** (`check-accounts.ps1`) runs checks once per day automatically.
- Use `/zen` to manually switch all CLIs to ZenCleanz accounts.
- Do NOT push, deploy, or run DB operations until accounts are confirmed.

## Git Workflow
- Main branch: `master`
- Remote: `ZenCleanz-Brain/ZC-Brain-Knowledge-Base`

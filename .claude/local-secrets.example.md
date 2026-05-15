# Local Secrets — Template

Copy this file to `.claude/local-secrets.md` (which is gitignored) and fill in
the real values. Nothing in this `.example.md` should ever be a real secret.

## Vercel

```
VERCEL_TOKEN=<paste-your-vercel-token-here>
```

Generate at https://vercel.com/account/tokens. The `/zen` skill and other
helpers read this token to authenticate the Vercel CLI in environments where
browser login is not available.

## Reading the token from scripts

PowerShell:

```powershell
$VERCEL_TOKEN = (Get-Content .claude/local-secrets.md |
  Select-String '^VERCEL_TOKEN=' |
  ForEach-Object { ($_ -split '=', 2)[1].Trim() })
```

Bash:

```bash
VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' .claude/local-secrets.md | cut -d= -f2-)
```

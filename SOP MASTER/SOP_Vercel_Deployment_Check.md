# SOP: Vercel Deployment Check & Auto-Fix

## Auto-Check Workflow (After Every GitHub Push)

```
GitHub Push → Vercel Auto-Deploy → CHECK STATUS → Fix if Error → Redeploy
                                       ↑
                               ALWAYS DO THIS!
```

---

## Quick Check Commands

### 1. Check Deployment Status
```bash
vercel list
```
Look for status: **Ready** = Good, **Error** = Fix needed

### 2. If Error - View Logs
```bash
vercel inspect <deployment-url> --logs
```

### 3. Fix & Redeploy
```bash
cd Team-Portal && vercel --prod
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| Root Directory not found | Set Root Directory to `Team-Portal` in Vercel Settings |
| Build failed | Check logs, fix code, push again |
| Missing env vars | `vercel env pull` or add in Vercel Dashboard |
| Git author access | Redeploy from Vercel Dashboard instead of CLI |

---

## Project Configuration

| Setting | Value |
|---------|-------|
| **Vercel Project** | `knowledge-base` |
| **Team** | `zencleanz-brains-projects` |
| **Root Directory** | `Team-Portal` |
| **Dashboard** | https://vercel.com/zencleanz-brains-projects/knowledge-base |
| **Deployments** | https://vercel.com/zencleanz-brains-projects/knowledge-base/deployments |

---

## CLI Commands Reference

```bash
vercel list                    # See all deployments
vercel logs                    # View latest logs
vercel inspect <url> --logs    # Full build logs
vercel --prod                  # Force production deploy
vercel env pull                # Pull environment variables
vercel whoami                  # Check logged-in account
```

---

## Dashboard Quick Links

- **Settings**: https://vercel.com/zencleanz-brains-projects/knowledge-base/settings
- **Deployments**: https://vercel.com/zencleanz-brains-projects/knowledge-base/deployments
- **Redeploy**: Click "..." on any deployment → Redeploy

---

## Full CLI Reference

See: `SKILLS/Vercel CLI SKILL.md`

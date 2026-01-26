---
name: vercel-cli
description: Deploy and manage Vercel projects. Use for deployments, checking deployment status, viewing logs, managing environment variables, and troubleshooting build issues.
allowed-tools: Bash(vercel *)
---

# Vercel CLI Reference

## Quick Start

```bash
vercel                    # Deploy preview
vercel --prod             # Deploy to production
vercel logs               # View deployment logs
vercel inspect <url>      # Check deployment status
```

## Core Workflow: Check Deployment Status

After pushing to GitHub, always verify deployment:

```bash
# 1. List recent deployments
vercel list

# 2. Check specific deployment status
vercel inspect <deployment-url>

# 3. View build logs if issues
vercel inspect <deployment-url> --logs

# 4. View real-time logs
vercel logs <deployment-url>
```

## Deployment Commands

```bash
# Basic deployment (preview)
vercel

# Production deployment
vercel --prod

# Deploy specific directory
vercel ./my-app

# Deploy from different working directory
vercel --cwd /path/to/project

# Force new deployment (skip cache)
vercel --force

# Deploy without waiting
vercel --no-wait

# Deploy with environment variables
vercel --env DATABASE_URL=value --env API_KEY=secret

# Deploy with build environment variables
vercel --build-env NODE_ENV=production
```

## Project Management

```bash
# List all projects
vercel project list

# Inspect project settings
vercel project inspect <project-name>

# Link local directory to project
vercel link

# Link to specific project
vercel link --project <project-name>
```

## Environment Variables

```bash
# List all environment variables
vercel env ls

# Add environment variable (interactive)
vercel env add MY_SECRET

# Add to specific environment
vercel env add DATABASE_URL production

# Pull env vars to local .env file
vercel env pull

# Pull to specific file
vercel env pull .env.local

# Remove environment variable
vercel env rm MY_SECRET
```

## Logs & Debugging

```bash
# View real-time logs for latest deployment
vercel logs

# View logs for specific deployment
vercel logs https://my-app-xyz.vercel.app

# Inspect deployment details
vercel inspect https://my-app-xyz.vercel.app

# Inspect with full build logs
vercel inspect https://my-app-xyz.vercel.app --logs
```

## Domain Management

```bash
# List all domains
vercel domains ls

# Add a domain
vercel domains add example.com

# Remove a domain
vercel domains rm example.com

# Inspect domain configuration
vercel domains inspect example.com
```

## Aliases

```bash
# Create alias for deployment
vercel alias set https://my-app-xyz.vercel.app custom-domain.com

# List aliases
vercel alias ls

# Remove alias
vercel alias rm custom-domain.com
```

## Rollback & Promote

```bash
# Promote preview to production
vercel promote <deployment-url>

# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback <deployment-url>
```

## Common Troubleshooting

### Deployment Failed - Root Directory Not Found
```bash
# Check project settings
vercel project inspect <project-name>

# Fix: Deploy from correct directory
cd <correct-folder> && vercel --prod

# Or update in Vercel Dashboard:
# Project Settings → Git → Root Directory
```

### Build Errors
```bash
# View full build logs
vercel inspect <deployment-url> --logs

# Check environment variables
vercel env ls
```

### Force Redeploy
```bash
# Skip cache and redeploy
vercel --force --prod
```

## Global Options

```bash
--cwd <DIR>           # Set working directory
--debug               # Enable debug mode
--token <TOKEN>       # Use specific auth token
--scope <team>        # Set team scope
--yes                 # Skip confirmation prompts
```

## Useful Patterns

### Deploy and Wait for Result
```bash
vercel --prod && vercel inspect $(vercel ls --json | jq -r '.[0].url')
```

### Check Latest Deployment Status
```bash
vercel list | head -5
```

### Quick Health Check After Push
```bash
vercel list && vercel logs
```

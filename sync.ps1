# Quick Git Sync Script for ZenCleanz Knowledge Base
# Run this before and after working in Cursor IDE

$repoPath = "PUBLISHED FOLDERS MASTER"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  ZenCleanz KB - Git Sync" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path $repoPath)) {
    Write-Host "ERROR: Cannot find '$repoPath' folder" -ForegroundColor Red
    Write-Host "Are you in the correct directory?" -ForegroundColor Yellow
    exit 1
}

Set-Location $repoPath

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "`nInitializing Git repository..." -ForegroundColor Yellow
    git init
    git remote add origin https://github.com/ZenCleanz-Brain/ZC-Brain-Knowledge-Base.git
    git fetch origin master
    git branch -M master
    git reset --hard origin/master
    Write-Host "Git initialized successfully!" -ForegroundColor Green
}

# Pull latest changes
Write-Host "`nPulling latest changes from GitHub..." -ForegroundColor Green
$pullResult = git pull origin master 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Pull had issues. Check the output above." -ForegroundColor Yellow
} else {
    Write-Host "✓ Pull successful!" -ForegroundColor Green
}

# Check for local changes
$status = git status --porcelain
if ($status) {
    Write-Host "`nFound local changes:" -ForegroundColor Yellow
    git status --short

    $commit = Read-Host "`nDo you want to commit and push these changes? (y/n)"

    if ($commit -eq 'y' -or $commit -eq 'Y') {
        $message = Read-Host "Enter commit message (or press Enter for auto-message)"

        if ([string]::IsNullOrWhiteSpace($message)) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            $message = "Update from Cursor IDE - $timestamp"
        }

        git add .
        git commit -m $message

        Write-Host "`nPushing to GitHub..." -ForegroundColor Green
        git push origin master

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Changes pushed successfully!" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Push failed. Check the output above." -ForegroundColor Red
        }
    } else {
        Write-Host "Changes not committed." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✓ No local changes to commit." -ForegroundColor Cyan
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  Sync Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Set-Location ..

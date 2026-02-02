# =============================================================================
# ZC Brain - Account Verification Hook
# Checks GitHub, Supabase, and Vercel CLI connections once per day.
# Output goes to Claude's context via SessionStart hook stdout.
# =============================================================================

$ErrorActionPreference = "SilentlyContinue"

# --- Configuration ---
$expectedGitHub = "ZenCleanz-Brain"
$expectedVercel = "zencleanz-brains-projects"
$expectedSupabaseProject = "vconqnpmybosduyhtbmu"

# --- Cache: skip if checked within last 24 hours ---
$cacheDir = Join-Path $env:USERPROFILE ".claude"
$cacheFile = Join-Path $cacheDir "last-account-check-zcbrain"

if (Test-Path $cacheFile) {
    try {
        $lastCheck = Get-Content $cacheFile -Raw
        $elapsed = (Get-Date) - [datetime]$lastCheck.Trim()
        if ($elapsed.TotalHours -lt 24) {
            # Checked recently, skip silently
            exit 0
        }
    } catch {
        # Cache file corrupted, proceed with check
    }
}

# --- Run checks ---
$results = @()
$hasMismatch = $false

# 1. GitHub Check
try {
    $ghOutput = & gh auth status 2>&1 | Out-String
    if ($ghOutput -match "Logged in to github\.com account (\S+)") {
        $ghAccount = $Matches[1]
        if ($ghAccount -eq $expectedGitHub) {
            $results += "- GitHub: OK ($ghAccount)"
        } else {
            $results += "- GitHub: WRONG ACCOUNT! Logged in as `"$ghAccount`", expected `"$expectedGitHub`""
            $results += "  Fix: Run ``gh auth switch --user $expectedGitHub`` or ``gh auth login``"
            $hasMismatch = $true
        }
    } elseif ($ghOutput -match "Logged in to github\.com as (\S+)") {
        $ghAccount = $Matches[1]
        if ($ghAccount -eq $expectedGitHub) {
            $results += "- GitHub: OK ($ghAccount)"
        } else {
            $results += "- GitHub: WRONG ACCOUNT! Logged in as `"$ghAccount`", expected `"$expectedGitHub`""
            $results += "  Fix: Run ``gh auth switch --user $expectedGitHub`` or ``gh auth login``"
            $hasMismatch = $true
        }
    } else {
        $results += "- GitHub: NOT LOGGED IN"
        $results += "  Fix: Run ``gh auth login``"
        $hasMismatch = $true
    }
} catch {
    $results += "- GitHub: CHECK FAILED (gh CLI error)"
}

# 2. Vercel Check
try {
    $vercelOutput = & vercel whoami 2>&1 | Out-String
    $vercelUser = $vercelOutput.Trim()
    if ($vercelUser -like "*$expectedVercel*") {
        $results += "- Vercel: OK ($vercelUser)"
    } elseif ($vercelUser -match "Not authenticated" -or $vercelUser -match "Error") {
        $results += "- Vercel: NOT LOGGED IN"
        $results += "  Fix: Run ``vercel login``"
        $hasMismatch = $true
    } else {
        $results += "- Vercel: WRONG ACCOUNT! Logged in as `"$vercelUser`", expected `"$expectedVercel`""
        $results += "  Fix: Run ``vercel switch`` or ``vercel login``"
        $hasMismatch = $true
    }
} catch {
    $results += "- Vercel: CHECK FAILED (vercel CLI error)"
}

# 3. Supabase Check
try {
    $supabaseOutput = & supabase projects list 2>&1 | Out-String
    if ($supabaseOutput -match $expectedSupabaseProject) {
        $results += "- Supabase: OK (project $expectedSupabaseProject accessible)"
    } elseif ($supabaseOutput -match "not logged in" -or $supabaseOutput -match "Access token") {
        $results += "- Supabase: NOT LOGGED IN"
        $results += "  Fix: Run ``supabase login``"
        $hasMismatch = $true
    } else {
        $results += "- Supabase: WRONG ACCOUNT! Project $expectedSupabaseProject not found in project list"
        $results += "  Fix: Run ``supabase login`` with the ZenCleanz account"
        $hasMismatch = $true
    }
} catch {
    $results += "- Supabase: CHECK FAILED (supabase CLI error)"
}

# --- Output results to Claude's context ---
if ($hasMismatch) {
    Write-Output "ACCOUNT CHECK - MISMATCH DETECTED:"
    Write-Output ""
    $results | ForEach-Object { Write-Output $_ }
    Write-Output ""
    Write-Output "Please warn the user about the mismatched accounts and offer to switch them."
} else {
    Write-Output "ACCOUNT CHECK - ALL OK: GitHub ($expectedGitHub), Vercel ($expectedVercel), Supabase ($expectedSupabaseProject)"
}

# --- Update cache timestamp ---
if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
}
(Get-Date).ToString("o") | Set-Content $cacheFile

exit 0

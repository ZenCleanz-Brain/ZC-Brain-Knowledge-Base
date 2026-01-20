@echo off
cls
echo.
echo ========================================
echo   ZenCleanz KB - Full Sync
echo ========================================
echo.
echo This will:
echo   1. Pull latest changes from GitHub
echo   2. Commit and push your local changes
echo.
pause

echo.
echo [Step 1/2] Pulling latest changes...
echo ----------------------------------------
git pull origin master
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Pull failed! Please resolve conflicts.
    echo.
    pause
    exit /b 1
)

echo ✓ Pull successful!
echo.

echo [Step 2/2] Checking for local changes...
echo ----------------------------------------
git status --short

git diff-index --quiet HEAD
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ No local changes to push.
    echo.
) else (
    echo.
    set /p message="Enter commit message (or press Enter for auto): "

    if "!message!"=="" (
        set message=Update from Cursor IDE - %date% %time:~0,5%
    )

    echo.
    echo Committing and pushing...
    git add .
    git commit -m "!message!"
    git push origin master

    if %ERRORLEVEL% EQU 0 (
        echo ✓ Changes pushed successfully!
    ) else (
        echo ✗ Push failed!
    )
)

echo.
echo ========================================
echo   Sync Complete!
echo ========================================
echo.
pause

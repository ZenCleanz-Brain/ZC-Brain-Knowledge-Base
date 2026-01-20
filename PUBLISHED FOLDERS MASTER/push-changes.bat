@echo off
cls
echo.
echo ========================================
echo   Pushing Your Changes to GitHub
echo ========================================
echo.

echo Current status:
git status --short
echo.

set /p message="Enter commit message (or press Enter for auto-message): "

if "%message%"=="" (
    set message=Update from Cursor IDE - %date% %time:~0,5%
)

echo.
echo Committing with message: %message%
git add .
git commit -m "%message%"

echo.
echo Pushing to GitHub...
git push origin master

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✓ Changes pushed successfully!
) else (
    echo ✗ Push failed. Check errors above.
)
echo.
echo ========================================
echo.
pause

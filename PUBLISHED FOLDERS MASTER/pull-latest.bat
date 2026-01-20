@echo off
cls
echo.
echo ========================================
echo   Pulling Latest Changes from GitHub
echo ========================================
echo.

git pull origin master

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✓ Sync successful!
) else (
    echo ✗ Sync failed. Check errors above.
)
echo.
echo ========================================
echo.
pause

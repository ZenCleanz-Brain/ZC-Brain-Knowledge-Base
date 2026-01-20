@echo off
echo =====================================
echo   ZenCleanz KB - Quick Sync
echo =====================================
echo.

cd "PUBLISHED FOLDERS MASTER"

echo Pulling latest changes...
git pull origin master

echo.
echo =====================================
echo   Sync Complete!
echo =====================================
echo.
echo Press any key to close...
pause >nul

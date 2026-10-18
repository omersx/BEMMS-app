@echo off
title BEMMS - Biomedical Equipment Management & Maintenance System
color 0B
cd /d "%~dp0"

echo ===================================================================
echo     BEMMS - Biomedical Equipment Management & Maintenance System
echo ===================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found on your system.
    echo Please install Node.js (v18 or higher) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Automatically open default browser after a brief startup delay
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

echo [OK] Launching development server...
echo [OK] Your browser will open http://localhost:3000 automatically.
echo.
echo (Press Ctrl + C at any time to stop the server)
echo ===================================================================
echo.

npm run dev

pause

@echo off
echo AI Communication Assistant - Complete Setup
echo ==========================================

echo.
echo This script will set up and start both backend and frontend servers.
echo.

REM Setup Backend
echo [1/3] Setting up Backend...
cd backend
call start.bat
if errorlevel 1 (
    echo Backend setup failed!
    pause
    exit /b 1
)

REM Start Backend in background
echo [2/3] Starting Backend Server...
start "AI Assistant Backend" cmd /c "cd backend && call venv\Scripts\activate && python run.py"

REM Wait a moment for backend to start
timeout /t 5 /nobreak > nul

REM Setup and Start Frontend
echo [3/3] Starting Frontend Server...
cd ..\frontend
start "AI Assistant Frontend" cmd /c "call start.bat"

echo.
echo ==========================================
echo Setup Complete!
echo.
echo Backend Server: http://localhost:8000
echo Frontend App: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Both servers are starting in separate windows.
echo Close this window when done.
echo ==========================================
pause

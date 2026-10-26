@echo off
title Azure Bug Assistant - Full Stack Launcher
cd /d "%~dp0"

echo ========================================================
echo  Starting Azure Bug Assistant (Backend & Frontend)
echo ========================================================
echo.
echo Starting Node.js Express Backend on http://localhost:8000 ...
start "Azure Bug Assistant - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "Azure Bug Assistant - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Waiting 3 seconds for services to initialize...
ping 127.0.0.1 -n 4 >nul

echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  Both services launched successfully!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000/api/health
echo ========================================================

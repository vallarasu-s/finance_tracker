@echo off
title Finance Tracker - Frontend (Vite React)
echo ==================================================
echo Starting Finance Tracker Frontend on http://localhost:3000...
echo ==================================================
cd /d "%~dp0frontend"
call npm run dev
pause

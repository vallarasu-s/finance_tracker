@echo off
title Finance Tracker - Launcher
echo ==================================================
echo Launching Finance Tracker Frontend & Backend...
echo ==================================================
cd /d "%~dp0"
start "Finance Tracker - Backend" cmd /c "start-backend.bat"
start "Finance Tracker - Frontend" cmd /c "start-frontend.bat"
echo Both servers have been launched in separate windows!

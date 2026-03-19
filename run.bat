@echo off
echo Starting Catasto...

:: Start Backend
start "Catasto Backend" /D "backend-catasto" cmd /k "npm start"

:: Start Frontend
start "Catasto Frontend" /D "frontend-catasto" cmd /k "npm run dev"

echo Backend and Frontend have been started in separate windows.

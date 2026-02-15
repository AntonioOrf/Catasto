@echo off
echo ==========================================
echo  CATASTO 1427 - DOCKER IMAGE PUBLISHER
echo ==========================================
echo.

:: 1. Login
echo [1/4] Logging in to Docker Hub...
docker login
if %errorlevel% neq 0 exit /b %errorlevel%

:: 2. Build & Push Backend
echo.
echo [2/4] Building and Pushing Backend...
docker build -t ipavon/catasto1427-backend:latest ./backend-catasto
docker push ipavon/catasto1427-backend:latest

:: 3. Build & Push Frontend
echo.
echo [3/4] Building and Pushing Frontend...
docker build -t ipavon/catasto1427-frontend:latest ./frontend-catasto
docker push ipavon/catasto1427-frontend:latest

echo.
echo ==========================================
echo  SUCCESS! Images published to Docker Hub.
echo ==========================================
pause

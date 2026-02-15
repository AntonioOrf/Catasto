@echo off
echo ==========================================
echo  CATASTO 1427 - DOCKER IMAGE PUBLISHER
echo ==========================================
echo.

:: 1. Login
echo [1/4] Logging in to Docker Hub...
docker login
if %errorlevel% neq 0 (
    echo [ERROR] Docker Login Failed!
    pause
    exit /b %errorlevel%
)

:: 2. Build & Push Backend
echo.
echo [2/4] Building Backend (NO CACHE)...
docker build --no-cache -t ipavon/catasto1427-backend:latest ./backend-catasto
if %errorlevel% neq 0 (
    echo [ERROR] Backend Build Failed!
    pause
    exit /b %errorlevel%
)

echo [2/4] Pushing Backend...
docker push ipavon/catasto1427-backend:latest
if %errorlevel% neq 0 (
    echo [ERROR] Backend Push Failed!
    pause
    exit /b %errorlevel%
)

:: 3. Build & Push Frontend
echo.
echo [3/4] Building Frontend (NO CACHE)...
docker build --no-cache -t ipavon/catasto1427-frontend:latest ./frontend-catasto
if %errorlevel% neq 0 (
    echo [ERROR] Frontend Build Failed!
    pause
    exit /b %errorlevel%
)

echo [3/4] Pushing Frontend...
docker push ipavon/catasto1427-frontend:latest
if %errorlevel% neq 0 (
    echo [ERROR] Frontend Push Failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo  SUCCESS! ALL IMAGES UPDATED AND PUSHED.
echo ==========================================
pause

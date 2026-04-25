@echo off
echo ==========================================
echo    Catasto Fiorentino - Docker Builder
echo ==========================================
echo.

echo [+] Building Backend Image...
docker build -t catasto-backend -f backend-catasto/Dockerfile .

echo.
echo [+] Building Frontend Image...
docker build -t catasto-frontend -f frontend-catasto/Dockerfile .

echo.
echo ==========================================
echo    Build Completed Successfully!
echo ==========================================
pause

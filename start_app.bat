@echo off
echo ==============================================
echo        Starting SnapIT Campus System
echo ==============================================
echo Launching Backend FastAPI Server...
start "SnapIT Backend" cmd /k "cd backend && python run.py"
timeout /t 2 /nobreak >nul
echo Launching Frontend Expo Server...
start "SnapIT Frontend" cmd /k "cd frontend && npx expo start"
echo.
echo Both servers are starting up! Scan the QR code in Expo Go to open the app.
pause

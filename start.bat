@echo off
echo ========================================
echo FlowFinance - Starting Application
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js: OK
echo.

echo Checking PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: PostgreSQL not found in PATH
    echo Make sure PostgreSQL is running
    echo.
)

echo Starting Backend Server...
cd backend
start "FlowFinance Backend" cmd /k "npm start"
cd ..

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
cd frontend
start "FlowFinance Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo Application Started!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul

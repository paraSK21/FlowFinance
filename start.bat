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
echo This may take 10-15 seconds for database sync...
:wait_backend
timeout /t 2 /nobreak >nul
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo Still waiting for backend...
    goto wait_backend
)
echo Backend is ready!
echo.

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

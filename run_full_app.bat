@echo off
echo ===================================================
echo    Starting Albion Market Full Stack Application
echo ===================================================
echo.

:: Start Backend
echo Starting Backend Server...
cd backend
start "Albion Backend" cmd /k "venv\Scripts\python -m uvicorn main:app --reload"
cd ..

:: Wait for backend
timeout /t 3 /nobreak > NUL

:: Start Frontend
echo Starting Frontend Development Server...
cd frontend
start "Albion Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo    Both servers are starting!
echo    Backend: http://localhost:8000
echo    Frontend: http://localhost:3000
echo ===================================================
timeout /t 5 /nobreak > NUL
start http://localhost:3000

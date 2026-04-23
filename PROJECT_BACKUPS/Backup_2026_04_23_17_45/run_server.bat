@echo off
echo ==============================================
echo    Starting Albion Market Analyzer Backend
echo ==============================================
echo.

cd backend

:: Start the python server in a new window
echo Starting Uvicorn API Server...
start "Albion Market Backend" cmd /k "python -m uvicorn main:app --reload"

:: Wait for a few seconds to let the server initialize
echo Waiting for server to start...
timeout /t 3 /nobreak > NUL

:: Open the browser to the Swagger UI page
echo Opening Browser to Swagger UI Tests...
start http://127.0.0.1:8000/docs

echo Done! The server is running in the new window.

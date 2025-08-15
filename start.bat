@echo off
REM This script starts a simple Python web server and opens the application in the default browser.

echo Starting the local server...
echo Please keep this window open while you are using the application.
echo.

REM Start the Python server in the background. Requires Python to be installed.
start "Student System Server" python -m http.server

REM Wait a couple of seconds for the server to initialize.
timeout /t 2 /nobreak > nul

REM Open the application's main page in the default web browser.
start http://localhost:8000

echo.
echo Server is running. You can now use the application in your browser.
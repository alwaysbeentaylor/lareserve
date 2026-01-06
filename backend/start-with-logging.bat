@echo off
cd /d "%~dp0"
echo Starting backend with logging to debug.log...
echo Logs will be saved to: %~dp0debug.log
echo.
npm run dev > debug.log 2>&1

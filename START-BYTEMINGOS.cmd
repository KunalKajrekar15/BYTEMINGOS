@echo off
setlocal
cd /d "%~dp0"
title Bytemingos - keep this window open
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules\express\package.json (
  echo Installing project dependencies...
  call npm ci
  if errorlevel 1 goto failed
)
echo Building Bytemingos...
call npm run build
if errorlevel 1 goto failed
echo.
echo Once the running message appears, open http://127.0.0.1:3000
echo Keep this window open. Press Ctrl+C to stop the application.
call npm start
echo.
echo The server has stopped. Any startup error is shown above.
pause
exit /b
:failed
echo The setup did not finish. Read the error above and try again.
pause
exit /b 1

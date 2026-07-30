@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found on PATH. Install Node LTS, then double-click this again.
  pause
  exit /b 1
)

echo Starting FundView preview on http://localhost:5500/OurERP_1.html
echo Keep this window open. Edits auto-reload in the browser after save.
echo.

REM If 5500 is already taken, reuse it by opening the page only.
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5500/OurERP_1.html' -TimeoutSec 1; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel%==0 (
  echo Port 5500 already serving. Opening preview...
  start "" "http://localhost:5500/OurERP_1.html"
  exit /b 0
)

start "" "http://localhost:5500/OurERP_1.html"
node "%~dp0_preview_server.js" 5500
pause

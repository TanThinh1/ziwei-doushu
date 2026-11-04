@echo off
chcp 65001 >nul
title Tu Vi Dau So - Dong cua so nay de tat ung dung
cd /d "%~dp0"
set NEXT_TELEMETRY_DISABLED=1
where npm >nul 2>nul || set "PATH=%ProgramFiles%\nodejs;%PATH%"
where npm >nul 2>nul || goto :nonode
if not exist logs mkdir logs
if exist "node_modules\next\package.json" goto :run
echo Lan dau chay: dang cai thu vien (can Internet, mat vai phut)...
call npm ci --no-audit --no-fund > logs\cai-dat.log 2>&1
if errorlevel 1 goto :installfail
:run
echo.
echo Ung dung dang chay tai: http://localhost:3456
echo Dong cua so nay de tat ung dung.
echo.
start "" /min cmd /c "timeout /t 8 /nobreak >nul & start msedge http://localhost:3456"
call npx next dev -H localhost -p 3456 > logs\may-chu.log 2>&1
exit /b 0
:nonode
echo Khong tim thay Node.js. Hay cai Node.js LTS tu nodejs.org roi chay lai.
pause
exit /b 1
:installfail
echo Cai dat loi. Xem chi tiet trong logs\cai-dat.log
pause
exit /b 1

@echo off
chcp 65001 >nul
title Tu Vi Dau So - Kiem tra
cd /d "%~dp0"
set NEXT_TELEMETRY_DISABLED=1
where npm >nul 2>nul || set "PATH=%ProgramFiles%\nodejs;%PATH%"
if not exist logs mkdir logs
echo Dang kiem tra, vui long doi...
echo === TYPECHECK === > logs\kiem-tra.log
call npm run typecheck >> logs\kiem-tra.log 2>&1
echo TYPECHECK_EXIT=%errorlevel% >> logs\kiem-tra.log
echo === TEST === >> logs\kiem-tra.log
call npm test >> logs\kiem-tra.log 2>&1
echo TEST_EXIT=%errorlevel% >> logs\kiem-tra.log
echo XONG >> logs\kiem-tra.log
echo Xong. Ket qua trong logs\kiem-tra.log
timeout /t 5 >nul

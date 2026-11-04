@echo off
chcp 65001 >nul
title Tu Vi Dau So - Luu len GitHub
cd /d "%~dp0"
set "PATH=%ProgramFiles%\GitHub CLI;%ProgramFiles%\Git\cmd;%ProgramFiles%\nodejs;%PATH%"
if not exist logs mkdir logs
set "LOG=logs\github.log"
echo === %date% %time% === > %LOG%

where gh >nul 2>nul || goto :nogh
gh auth status >nul 2>nul
if errorlevel 1 (
  echo Can dang nhap GitHub. Lam theo huong dan ngay ben duoi.
  gh auth login --hostname github.com --git-protocol https --web
)
gh auth status >nul 2>nul || goto :noauth
gh auth setup-git >> %LOG% 2>&1

for /f "delims=" %%u in ('gh api user --jq .login') do set "GHUSER=%%u"
if "%GHUSER%"=="" goto :noauth
echo Tai khoan: %GHUSER% >> %LOG%

git check-ignore -q .env.local || goto :notignored

git switch viet-hoa >> %LOG% 2>&1 || git switch -c viet-hoa >> %LOG% 2>&1
git add -A >> %LOG% 2>&1
git diff --cached --name-only | findstr /i /c:".env.local" >nul && goto :notignored
git -c user.name="%GHUSER%" -c user.email="%GHUSER%@users.noreply.github.com" commit -F scripts\commit-viet-hoa.txt >> %LOG% 2>&1

git remote get-url fork >nul 2>nul
if errorlevel 1 (
  gh repo fork --remote --remote-name fork >> %LOG% 2>&1
  if errorlevel 1 goto :fail
  timeout /t 5 /nobreak >nul
)
git push -u fork viet-hoa >> %LOG% 2>&1
if errorlevel 1 goto :fail

echo PUSH_OK https://github.com/%GHUSER%/ziwei-doushu/tree/viet-hoa >> %LOG%
echo.
echo Da luu len: https://github.com/%GHUSER%/ziwei-doushu/tree/viet-hoa
pause
exit /b 0

:nogh
echo LOI: khong tim thay GitHub CLI >> %LOG%
echo Khong tim thay GitHub CLI.
pause
exit /b 1
:noauth
echo LOI: chua dang nhap GitHub >> %LOG%
echo Chua dang nhap GitHub.
pause
exit /b 1
:notignored
echo LOI: .env.local khong duoc bo qua, da dung lai >> %LOG%
echo Da dung lai de tranh dua API key len GitHub.
pause
exit /b 1
:fail
echo LOI: xem logs\github.log >> %LOG%
echo Khong luu duoc. Xem logs\github.log
pause
exit /b 1

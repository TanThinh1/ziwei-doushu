@echo off
chcp 65001 >nul
title Tu Vi Dau So - Dan Gemini API key
cd /d "%~dp0"
echo Dan API key Gemini vao day roi bam Enter.
echo Key chi luu trong file .env.local tren may nay va khong duoc dua len GitHub.
echo.
set "GEMINI_KEY="
set /p "GEMINI_KEY=API key: "
if "%GEMINI_KEY%"=="" goto :empty
> ".env.local" echo GEMINI_API_KEY=%GEMINI_KEY%
set "GEMINI_KEY="
echo.
echo Da luu key. Neu ung dung dang chay, hay dong cua so den roi mo lai Chay-Tu-Vi.bat.
pause
exit /b 0
:empty
echo Chua nhap key, khong co gi thay doi.
pause
exit /b 1

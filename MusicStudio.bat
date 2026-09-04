@echo off
title Music Studio
cd /d "%~dp0"

echo ===================================================
echo             Starting Music Studio...
echo ===================================================

:: Check for embedded runtime first
if exist "runtime\python.exe" (
    start "" "runtime\pythonw.exe" desktop_app.py
    exit /b 0
)

:: Check for python in PATH
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python -c "import fastapi, uvicorn, mutagen, yt_dlp, PIL" >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo Installing dependencies (fastapi, uvicorn, mutagen, yt-dlp, pillow, pywebview)...
        python -m pip install -r requirements.txt
    )
    start "" python desktop_app.py
    exit /b 0
)

:: Check for py launcher
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start "" py -3 desktop_app.py
    exit /b 0
)

echo.
echo [ERROR] Python 3 was not found on this computer.
echo Please install Python from https://www.python.org/downloads/
echo (Make sure to check "Add Python to PATH" during installation)
echo.
pause

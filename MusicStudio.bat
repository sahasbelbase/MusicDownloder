@echo off
setlocal enabledelayedexpansion
title Music Studio
cd /d "%~dp0"

echo ===================================================
echo               Music Studio Launcher
echo ===================================================
echo.

:: 1. Detect Python executable
set "PY_CMD="

if exist "runtime\python.exe" (
    set "PY_CMD=runtime\python.exe"
    goto :python_found
)

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PY_CMD=python"
    goto :python_found
)

where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PY_CMD=py -3"
    goto :python_found
)

for %%V in (314 313 312 311 310 39 38) do (
    if exist "C:\Python%%V\python.exe" (
        set "PY_CMD=C:\Python%%V\python.exe"
        goto :python_found
    )
    if exist "%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe" (
        set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python%%V\python.exe"
        goto :python_found
    )
)

echo [ERROR] Python 3 was not detected on this system.
echo Please install Python 3.8+ from https://www.python.org/downloads/
echo Make sure to check "Add Python to PATH" during installation.
echo.
pause
exit /b 1

:python_found
echo [INFO] Using Python: %PY_CMD%
echo.

:: 2. Pre-flight dependency check
echo [INFO] Checking required dependencies...
%PY_CMD% -c "import fastapi, uvicorn, mutagen, yt_dlp, webview, PIL, imageio_ffmpeg" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Missing dependencies detected. Installing required packages...
    echo (fastapi, uvicorn, yt-dlp, mutagen, pywebview, pillow, imageio-ffmpeg)
    echo.
    %PY_CMD% -m pip install --upgrade pip
    %PY_CMD% -m pip install -r requirements.txt
    if !ERRORLEVEL! neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies. Please check your internet connection.
        echo You can try running manually:
        echo   %PY_CMD% -m pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [INFO] All dependencies installed successfully!
    echo.
) else (
    echo [OK] All core dependencies are installed.
    echo.
)

:: 3. Launch Music Studio
echo ===================================================
echo   Launching Music Studio Desktop Application...
echo ===================================================
echo.

%PY_CMD% desktop_app.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ===================================================
    echo [ERROR] Music Studio exited with code %ERRORLEVEL%.
    echo Check log file: %%LOCALAPPDATA%%\MusicStudio\Logs\desktop_app.log
    echo ===================================================
    echo.
    pause
    exit /b %ERRORLEVEL%
)

endlocal

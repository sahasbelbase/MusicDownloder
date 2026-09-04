@echo off
title Build Music Studio Windows Standalone EXE
cd /d "%~dp0"

echo ===================================================
echo     Compiling Music Studio for Windows (.exe)
echo ===================================================

echo [1/3] Checking Python & PyInstaller...
python -m pip install --upgrade pip
python -m pip install pyinstaller -r requirements.txt

echo [2/3] Compiling standalone executable...
python -m PyInstaller --clean -y windows_app.spec

if exist "dist\MusicStudio.exe" (
    echo.
    echo ===================================================
    echo  [SUCCESS] MusicStudio.exe compiled successfully!
    echo  Location: dist\MusicStudio.exe
    echo ===================================================
) else (
    echo.
    echo [ERROR] Build failed. Please check the output above.
)
pause

# -*- mode: python ; coding: utf-8 -*-
import os
import sys
import shutil

block_cipher = None
BASE_DIR = os.path.abspath(SPECPATH)

# Windows FFmpeg check
binaries = []
ffmpeg_win = shutil.which("ffmpeg")
if ffmpeg_win:
    binaries.append((ffmpeg_win, '.'))

datas = [
    (os.path.join(BASE_DIR, 'static'), 'static'),
]

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespans',
    'uvicorn.lifespans.on',
    'uvicorn.lifespans.off',
    'fastapi',
    'pydantic',
    'mutagen',
    'mutagen.mp3',
    'mutagen.id3',
    'yt_dlp',
    'yt_dlp.extractor',
    'requests',
    'certifi',
    'webview',
    'app',
    'download_playlist',
    'discovery',
    'fix_metadata',
]

a = Analysis(
    ['desktop_app.py'],
    pathex=[BASE_DIR],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='MusicStudio',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(BASE_DIR, 'static', 'favicon.ico') if os.path.exists(os.path.join(BASE_DIR, 'static', 'favicon.ico')) else None,
)

#!/usr/bin/env bash
set -e

echo "🎵 =========================================="
echo "   Building Music Studio Desktop (.dmg)     "
echo "=========================================="

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

# Clean prior builds
rm -rf build dist/dmg_staging dist/MusicStudio-Installer.dmg

echo "📦 Step 1/3: Compiling standalone app bundle with PyInstaller..."
python3 -m PyInstaller --clean -y music_studio.spec

if [ ! -d "dist/Music Studio.app" ]; then
    echo "❌ Error: dist/Music Studio.app was not created!"
    exit 1
fi

echo "🔑 Step 1b: Applying macOS ad-hoc code signature and clearing quarantine..."
xattr -cr "dist/Music Studio.app"
codesign --force --deep --sign - "dist/Music Studio.app"

echo "✨ Step 2/3: Preparing DMG installer staging..."
mkdir -p dist/dmg_staging
cp -R "dist/Music Studio.app" "dist/dmg_staging/"
ln -s /Applications "dist/dmg_staging/Applications"

echo "💿 Step 3/3: Creating compressed macOS Disk Image (.dmg)..."
hdiutil create \
    -volname "Music Studio" \
    -srcfolder "dist/dmg_staging" \
    -ov \
    -format UDZO \
    "dist/MusicStudio-Installer.dmg"

# Clean staging
rm -rf dist/dmg_staging

echo ""
echo "=========================================="
echo "🎉 SUCCESS: macOS DMG created successfully!"
echo "📍 Location: $APP_DIR/dist/MusicStudio-Installer.dmg"
ls -lh "dist/MusicStudio-Installer.dmg"
echo "=========================================="

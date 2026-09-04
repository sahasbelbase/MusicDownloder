# 🎵 Music Studio — Releases & Sharing Guide

All installable and portable packages are available in this folder for easy sharing with friends and colleagues.

---

## 📱 Android Installation (.apk)

**File to Share:**
👉 [`MusicStudio.apk`](releases/MusicStudio.apk) (4.0 MB)  
*(Universal APK • Android 7.0+ / API 24–36 • ARM64 / ARMv7 / x86_64)*

### Key Capabilities:
- **🎧 Full Local Music Player**: High-fidelity audio playback with live seek bar, queue, volume boost, and background playback.
- **⚡ Automatic Offline Detection**: When your device has no internet or is in Airplane Mode, the app automatically switches to **Library Only Mode**—hiding the downloader/discovery tabs and keeping your downloaded music library active without disruption.
- **🔥 Top 100 "Most Played" Smart Playlist**: Automatically tracks songs played for 15+ seconds or to completion, maintaining your personal Top 100 chart.
- **📥 Direct Downloader**: Paste any Spotify or YouTube Music playlist link while on Wi-Fi/cellular to download directly to your device.

### How to Install on Android Phone:
1. Download or transfer **`MusicStudio.apk`** to your phone (via USB, Google Drive, WhatsApp, Telegram, or browser download).
2. Open the file from your phone's **Files** or **Downloads** app.
3. If Android displays *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings** on the prompt.
   - Toggle **Allow from this source** to ON.
   - Tap Back and press **Install**.
4. Open **Music Studio** and enjoy high-quality music!

---

## 🍎 iPhone & iOS Installation (.zip)

**File to Share:**
👉 [`MusicStudio-iOS.zip`](releases/MusicStudio-iOS.zip) (216 KB)  
*(Native Xcode Project • iOS 14.0+ • iPhone & iPad)*

### Key Capabilities:
- **🎧 Background Audio**: Includes `UIBackgroundModes: audio` to keep music playing when the screen is locked or while switching apps.
- **🌐 Offline Detection**: Restricts UI to local library when offline, preventing loading errors.
- **📡 LAN Connectivity**: Configured with `NSLocalNetworkUsageDescription` and ATS cleartext settings to stream and sync from your desktop server over local Wi-Fi.

### How to Install on iPhone:
#### Option 1: Xcode (Recommended for Developers & Mac Users)
1. Extract `MusicStudio-iOS.zip` (or open the `ios/` folder in the repository).
2. Double-click `ios/App/App.xcodeproj` to open it in **Xcode**.
3. Connect your iPhone via USB.
4. Select your iPhone in Xcode's device dropdown.
5. In **Signing & Capabilities**, check **Automatically manage signing** and select your Apple ID.
6. Press **⌘R (Run)** to install Music Studio directly on your iPhone.

#### Option 2: Sideloading (AltStore / Sideloadly / Scarlet)
1. Archive the target in Xcode as an `.ipa` or use Sideloadly.
2. Sign with your Apple ID and sideload without needing a paid developer account.

---

## 🍏 macOS Installation (.dmg)

**File to Share:**
👉 [`MusicStudio-macOS.dmg`](file:///Users/sahas/Documents/Projects/spotifydownloder/releases/MusicStudio-macOS.dmg) (69 MB)  
*(Architecture: Apple Silicon M1/M2/M3/M4/M5 • Minimum macOS: Big Sur 11.0+ • Version 3.3.0)*

### How to Install on Mac:
1. Double-click **`MusicStudio-macOS.dmg`** to mount the disk image.
2. Drag **`Music Studio.app`** into the **`Applications`** folder shortcut.
3. If macOS says **`"Music Studio" cannot be opened`** (Apple Gatekeeper blocks unsigned internet downloads by default):
   - **Option 1 (Easiest)**: Double-click **`🚀 Open Music Studio.command`** directly inside the DMG window. It removes the quarantine restriction and launches the app automatically!
   - **Option 2 (Terminal 1-Liner)**: Open Terminal and run:
     ```bash
     xattr -cr "/Applications/Music Studio.app"
     ```
     Then launch Music Studio from Applications or Spotlight.
   - **Option 3 (System Settings)**: Open **System Settings** -> **Privacy & Security** -> scroll down to **Security** -> click **"Open Anyway"**.

---

## 🪟 Windows Installation (.exe)

**Files to Share:**
👉 [`MusicStudio-Windows-x64.zip`](file:///Users/sahas/Documents/Projects/spotifydownloder/releases/MusicStudio-Windows-x64.zip) (Portable Complete Package)  
👉 [`MusicStudio.exe`](file:///Users/sahas/Documents/Projects/spotifydownloder/releases/MusicStudio.exe) (Standalone Windows GUI Launcher)

### How to Run on Windows:
1. Extract `MusicStudio-Windows-x64.zip`.
2. Double-click **`MusicStudio.exe`** (or **`MusicStudio.bat`**).
3. The app starts and opens the player window with full support for:
   - 320kbps audio playback & streaming
   - Automatic universal ID3v2.3 metadata & HD album covers
   - Custom playlist creation & Spotify/YouTube Music import
   - Offline library access

### Optional: Compile a 1-file standalone EXE directly on Windows
- Double-click `build_windows.bat` inside the folder. It will use PyInstaller to produce a single `MusicStudio.exe` in `dist/`.

# SpotiDownloader Studio - Complete Guide

## 📁 System Architecture & Paths
- **Project Directory**: `/Users/sahas/Documents/Projects/spotifydownloder`
- **Songs Directory**: `/Users/sahas/Documents/Projects/spotifydownloder/Songs`
- **Active Playlist**: `https://music.youtube.com/playlist?list=PLX8g6vXOji2rDj1mP9D8rwjBDffhy_bvc` (1,608 Tracks)

---

## 🎨 1. Launching the Web UI Studio (Approach 2)
To launch your new visual Web Dashboard with real-time progress, live song stream, and built-in music player:

```bash
python3 app.py
```
Open **`http://localhost:5000`** in your browser!

### ✨ Web UI Features:
- **Hero URL Input**: Paste any Spotify or YouTube Music playlist / track link.
- **Live Stream Cards**: Animated cards showing each song as it downloads in real-time.
- **Interactive Music Library**: Browse all downloaded songs with high-res album covers, live search, and in-browser audio player.
- **1-Click Studio Metadata Fix**: Automatically updates album names, release years, genres, and 1000×1000 HD artwork via Apple Music.
- **Open in Finder Button**: 1-click button to open your `/Songs` folder on Mac.

---

## ⚡ 2. Command-Line (CLI) Usage

### Run the Background Downloader:
```bash
python3 download_playlist.py --threads 4
```

### Run the Metadata & HD Art Enricher:
```bash
python3 fix_metadata.py
```
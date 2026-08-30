# MusicDownloader 🎵

A high-speed, rate-limit resistant music downloader and metadata tagging suite. Supports downloading full playlists, albums, and individual tracks from **Spotify**, **YouTube**, and **YouTube Music** with **320 kbps MP3 conversion**, clean song-title naming, and **1000×1000 Ultra-HD embedded cover artwork**.

Includes both a **modern Web UI Studio** with real-time SSE progress streaming and an advanced **CLI Engine**.

---

## ✨ Features

- **🚀 Zero Rate Limits & High Speed**: Bypasses API throttling and bot blocks using direct stream extractors with multi-threaded downloads (2–6 concurrent workers).
- **🎧 True 320 kbps MP3 Audio**: Transcodes high-bitrate source audio directly via FFmpeg.
- **🏷️ Clean Song Titles**: Automatically detects and removes unwanted video suffixes such as `(Official Video)`, `[Official Lyric Video]`, `[4K]`, `Remastered`, etc., saving pure song names (`Title.mp3`).
- **🎨 Full ID3v2.3 Metadata & Studio Artwork**: Embeds clean Song Title, Artist, Album Name, Year, Genre, and 1000×1000 HD Cover Art directly into the MP3 tags for seamless Apple Music, iTunes, Spotify Local Files, and Car audio compatibility.
- **⚡ Smart Resume**: Automatically detects and skips songs that have already been downloaded in `<0.01s`.
- **🔄 Latest Songs First**: Processes playlists in reverse order so your most recently added favorite tracks download first.
- **💻 Modern Web UI Studio**: Interactive glassmorphism dashboard with live download feed, real-time metrics, music library browser, and in-browser audio player.

---

## 📋 Prerequisites

1. **Python 3.8+**
2. **FFmpeg** (Required for audio conversion and metadata embedding)
   - **macOS** (via Homebrew):
     ```bash
     brew install ffmpeg
     ```
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install ffmpeg
     ```
   - **Windows**:
     Download from [gyan.dev/ffmpeg](https://www.gyan.dev/ffmpeg/builds/) or install via `winget install Gyan.FFmpeg`.

---

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sahasbelbase/MusicDownloder.git
   cd MusicDownloder
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   # Or install directly:
   pip install yt-dlp mutagen fastapi uvicorn requests
   ```

---

## 🚀 Quick Start

### 1. Launch the Web UI Studio (Recommended)

Start the local web application:
```bash
python3 app.py
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

- **Hero URL Input**: Paste any Spotify or YouTube Music link.
- **Live Stream**: Watch songs download with live album art and progress bars.
- **Music Library**: Browse, search, and play your downloaded songs directly in the browser.
- **Enrich Studio Metadata**: 1-click button to fetch official studio albums, release years, and HD art from Apple Music.

---

### 2. Command-Line (CLI) Downloader

#### Download a Playlist (Default: 3 threads, latest songs first):
```bash
python3 download_playlist.py "https://music.youtube.com/playlist?list=YOUR_PLAYLIST_ID"
```

#### Download with 4 Parallel Streams:
```bash
python3 download_playlist.py "YOUR_PLAYLIST_URL" --threads 4
```

#### Download a Spotify Playlist or Track:
```bash
python3 download_playlist.py "https://open.spotify.com/playlist/YOUR_PLAYLIST_ID"
```

#### Download only the Top 20 Newest Songs:
```bash
python3 download_playlist.py --limit 20
```

---

### 3. Metadata & HD Cover Art Enricher

To scan existing downloaded songs and enrich them with official Apple Music studio album names, release years, genres, and 1000×1000 HD cover artwork:

```bash
python3 fix_metadata.py
```

---

## ⚙️ CLI Options

| Flag | Short | Default | Description |
| :--- | :--- | :--- | :--- |
| `url` | - | *Default URL* | Spotify / YouTube Music playlist, album, or track URL |
| `--output` | `-o` | `./Songs` | Destination folder for downloaded MP3s |
| `--threads` | `-t` | `3` | Number of concurrent download workers |
| `--quality` | `-q` | `320k` | Audio bitrate (320k, 256k, 192k) |
| `--sort` | `-s` | `latest` | Sort order: `latest` (newest additions first) or `oldest` |
| `--naming` | `-n` | `title` | File naming format: `title` (Song.mp3) or `artist-title` |
| `--limit` | `-l` | `None` | Max number of tracks to download |

---

## 📂 Project Structure

```
MusicDownloder/
├── app.py                 # FastAPI backend server with real-time SSE streaming
├── download_playlist.py   # Core download and stream extraction engine
├── fix_metadata.py        # Apple Music studio metadata and HD artwork tagger
├── requirements.txt       # Python package dependencies
├── architecture.md        # Technical architecture and pipeline documentation
├── static/                # Web UI frontend assets
│   ├── index.html         # Modern HTML5 dashboard
│   ├── style.css          # Dark glassmorphic styling
│   └── app.js             # SSE real-time client & audio player engine
└── Songs/                 # Output directory for downloaded MP3s
```

---

## 📄 License

This project is licensed under the MIT License.

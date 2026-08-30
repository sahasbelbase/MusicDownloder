# Technical Architecture & Pipeline Specification

This document details the system design, data flow, concurrency model, and audio processing pipeline of **MusicDownloader**.

---

## 1. System Overview & Technology Stack

```mermaid
graph TD
    Client[Web UI Dashboard / CLI Interface] --> Router[FastAPI REST & SSE Router]
    Router --> Extractor[Metadata Extractor Engine]
    Extractor -->|Spotify URL| SpotifyScraper[Spotify Embed & Catalog Scraper]
    Extractor -->|YouTube Music URL| YTExtractor[yt-dlp Stream Resolving Engine]
    
    SpotifyScraper --> SearchPipeline[YouTube Studio Audio Query Resolver]
    YTExtractor --> SearchPipeline
    
    SearchPipeline --> ThreadPool[ThreadPoolExecutor Concurrency Manager]
    ThreadPool --> Worker1[Worker Thread 1]
    ThreadPool --> Worker2[Worker Thread 2]
    ThreadPool --> WorkerN[Worker Thread N]
    
    Worker1 --> FFmpeg[FFmpeg Transcoder: 320kbps MP3]
    Worker2 --> FFmpeg
    WorkerN --> FFmpeg
    
    FFmpeg --> Tagger[Mutagen ID3v2.3 Metadata & APIC Artwork Tagger]
    Tagger --> Destination[(Local /Songs Directory)]
    Tagger --> SSEEmitter[Server-Sent Events Real-Time Broadcast]
    SSEEmitter --> Client
```

### Core Technologies

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Backend & API** | FastAPI + Uvicorn | Async web framework providing REST endpoints and Server-Sent Events (SSE) |
| **Stream Extraction** | `yt-dlp` | Direct audio extraction engine bypassing bot detection and CORS restrictions |
| **Audio Processing** | FFmpeg | High-fidelity audio stream extraction and transcoding to 320 kbps constant/variable bitrate MP3 |
| **Metadata Tagging** | `mutagen` | ID3v2.3 tag writing (`TIT2`, `TPE1`, `TALB`, `TDRC`, `TCON`, `APIC` frame embedding) |
| **Catalog Enrichment**| Apple Music / iTunes Search API | Public API lookup for official studio albums, release dates, genres, and 1000×1000 artwork |
| **Frontend UI** | HTML5 / Vanilla CSS3 / JS | Dark glassmorphism interface with zero heavy frontend bundle dependencies |

---

## 2. Download & Transcoding Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Web Dashboard / CLI
    participant Engine as Download Controller
    participant Ext as Stream & Catalog Extractor
    participant Worker as Download Thread Worker
    participant FF as FFmpeg Engine
    participant ID3 as Mutagen Tagger
    participant Disk as Local Storage (Songs/)

    User->>UI: Submit Playlist / Track URL
    UI->>Engine: Initialize Download Task (threads=3..6, 320k)
    Engine->>Ext: Fetch Playlist Tracklist & Metadata
    Ext-->>Engine: Return Normalized Tracks List
    
    loop For Each Track in Playlist (Concurrent Threads)
        Engine->>Worker: Dispatch Track (Query, Artist, Title, Art)
        Worker->>Disk: Check if File Already Exists (Smart Resume)
        alt File Exists & Size > 200KB
            Worker-->>Engine: Skip Track (0ms Instant Resume)
        else File Does Not Exist
            Worker->>Worker: Stream Highest Audio Format (Opus 251 / AAC 140)
            Worker->>FF: Transcode to MP3 320kbps (-ab 320k)
            FF-->>Worker: Produce Temporary .mp3 File
            Worker->>ID3: Embed Title, Artist, Album, Year, APIC Artwork
            ID3-->>Worker: Finalize ID3v2.3 Tags
            Worker->>Disk: Atomic Move to Destination File
            Worker-->>Engine: Broadcast Track Completed (SSE / Log)
        end
    end
    Engine-->>UI: Download Finished Summary
```

---

## 3. Key Architectural Components

### A. Title Cleaning & Normalization Engine
Raw YouTube titles frequently contain video noise and redundant metadata. The normalizer processes raw strings through a multi-pass pipeline:
1. **Noise Stripping**: Removes `(Official Video)`, `(Official Audio)`, `[Official Lyric Video]`, `[4K]`, `Remastered`, etc.
2. **Artist Extraction**: Separates `Artist - Title` into structured fields, stripping channel names if uploaded by record labels (e.g. `Vevo`, `Topic`, `Atlantic Records`, `Fueled By Ramen`).
3. **Featuring Artist Migration**: Extracts `ft.`, `feat.`, `featuring` from the song title, cleans the title to pure song name, and moves the guest artist into the primary `TPE1` Artist ID3 tag.

### B. Smart Resume Engine
To ensure efficiency across massive playlists (1,000+ tracks):
- Before dispatching a stream request, the worker checks `os.path.isfile(target_filepath)`.
- Verifies that file size exceeds `200 KB` (confirming an intact audio file).
- If matched, the track is marked as `skipped` in `<0.01ms`, saving bandwidth and CPU cycles.

### C. Concurrency Model
- Implements `concurrent.futures.ThreadPoolExecutor` with configurable worker pools (default: 3–4 workers).
- Download workers execute network I/O and FFmpeg subprocesses concurrently.
- Thread-safe state synchronization is governed via `threading.Lock` primitives.

---

## 4. Metadata Enrichment Flow (`fix_metadata.py`)

```mermaid
flowchart LR
    A[Scanned MP3 File] --> B[Read Current Title & Artist]
    B --> C[Query Apple Music / iTunes Catalog API]
    C -->|Match Found| D[Extract Official Studio Album Name]
    C -->|Match Found| E[Extract Exact Release Year]
    C -->|Match Found| F[Extract Primary Genre]
    C -->|Match Found| G[Download 1000x1000 HD Cover Art]
    D & E & F & G --> H[Write ID3v2.3 Frames to MP3]
    H --> I[Saved Enriched Audio File]
```

1. Reads clean song title and artist from the local file tags.
2. Queries the iTunes Search API (`https://itunes.apple.com/search?media=music&entity=song`).
3. Updates `TALB` (Official Album), `TDRC` (Release Year), `TCON` (Genre), and `APIC` (1000×1000 HD Front Cover Image).
4. Non-destructive: Updates ID3 header frames without altering the audio stream.

#!/usr/bin/env python3
"""
Spotify & YouTube Music Downloader - Web Application Backend
Powered by FastAPI, Uvicorn, yt-dlp, FFmpeg, and Mutagen
"""

import os
import re
import sys
import time
import json
import asyncio
import shutil
import urllib.request
import urllib.parse
import subprocess
from threading import Thread, Lock
from typing import Optional, List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import mutagen
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, TCON, APIC, ID3NoHeaderError
from mutagen.mp3 import MP3

# Import extractor and download logic from download_playlist
from download_playlist import (
    SpotifyExtractor,
    YouTubeExtractor,
    clean_track_artist_and_title,
    download_single_track,
    find_ffmpeg,
    check_dependencies,
    DEFAULT_PLAYLIST_URL,
    DEFAULT_OUTPUT_FOLDER,
)
from fix_metadata import process_file as enrich_single_file

app = FastAPI(title="SpotiDownloader Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SONGS_DIR = DEFAULT_OUTPUT_FOLDER
os.makedirs(SONGS_DIR, exist_ok=True)
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Global Application State
class AppState:
    def __init__(self):
        self.lock = Lock()
        self.is_downloading = False
        self.is_enriching = False
        self.should_stop = False
        
        # Download metrics
        self.current_url = ""
        self.playlist_title = ""
        self.total_tracks = 0
        self.downloaded_count = 0
        self.skipped_count = 0
        self.failed_count = 0
        self.active_tracks: List[str] = []
        self.recent_completed: List[Dict] = []
        self.start_time = 0.0
        self.status_message = "Ready"
        
        # Event listeners for SSE
        self.listeners: List[asyncio.Queue] = []

    def reset_download_state(self, url: str):
        with self.lock:
            self.is_downloading = True
            self.should_stop = False
            self.current_url = url
            self.playlist_title = "Fetching metadata..."
            self.total_tracks = 0
            self.downloaded_count = 0
            self.skipped_count = 0
            self.failed_count = 0
            self.active_tracks = []
            self.recent_completed = []
            self.start_time = time.time()
            self.status_message = "Analyzing playlist..."

    def notify(self, event_type: str, data: dict):
        payload = json.dumps({"type": event_type, "data": data})
        for q in list(self.listeners):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

state = AppState()

class DownloadRequest(BaseModel):
    url: str
    threads: int = 3
    quality: str = "320k"
    sort: str = "latest"
    naming: str = "title"

class EnrichRequest(BaseModel):
    threads: int = 8
    upgrade_artwork: bool = True

def run_download_worker(req: DownloadRequest):
    ffmpeg_bin = find_ffmpeg()
    state.reset_download_state(req.url)
    state.notify("status", {"message": "Fetching playlist tracks...", "running": True})

    try:
        if SpotifyExtractor.is_spotify_url(req.url):
            collection_title, tracks = SpotifyExtractor.extract_tracks(req.url)
        else:
            collection_title, tracks = YouTubeExtractor.extract_tracks(req.url)

        if not tracks:
            with state.lock:
                state.is_downloading = False
                state.status_message = "No tracks found in playlist."
            state.notify("status", {"message": "No tracks found", "running": False})
            return

        # Sort order
        if req.sort == "latest":
            tracks.reverse()

        with state.lock:
            state.playlist_title = collection_title
            state.total_tracks = len(tracks)
            state.status_message = f"Downloading \"{collection_title}\""

        state.notify("playlist_loaded", {
            "title": collection_title,
            "total": len(tracks)
        })

        with ThreadPoolExecutor(max_workers=req.threads) as executor:
            future_to_track = {
                executor.submit(
                    download_single_track,
                    track,
                    SONGS_DIR,
                    ffmpeg_bin,
                    req.quality,
                    req.naming
                ): track
                for track in tracks
            }

            for future in as_completed(future_to_track):
                if state.should_stop:
                    break

                track = future_to_track[future]
                try:
                    success, status, filename = future.result()
                    with state.lock:
                        if status == "skipped":
                            state.skipped_count += 1
                        elif success:
                            state.downloaded_count += 1
                        else:
                            state.failed_count += 1

                        song_item = {
                            "filename": filename,
                            "title": track.get("title"),
                            "artist": track.get("artist"),
                            "album": track.get("album"),
                            "cover_url": track.get("cover_url"),
                            "status": status,
                            "timestamp": time.time()
                        }
                        state.recent_completed.insert(0, song_item)
                        if len(state.recent_completed) > 100:
                            state.recent_completed.pop()

                    processed = state.downloaded_count + state.skipped_count + state.failed_count
                    pct = int((processed / max(1, state.total_tracks)) * 100)
                    
                    state.notify("progress", {
                        "processed": processed,
                        "total": state.total_tracks,
                        "percent": pct,
                        "downloaded": state.downloaded_count,
                        "skipped": state.skipped_count,
                        "failed": state.failed_count,
                        "last_song": song_item
                    })
                except Exception as e:
                    with state.lock:
                        state.failed_count += 1

    except Exception as e:
        with state.lock:
            state.status_message = f"Error: {e}"
    finally:
        with state.lock:
            state.is_downloading = False
            state.status_message = "Download completed!" if not state.should_stop else "Download stopped."
        state.notify("completed", {
            "downloaded": state.downloaded_count,
            "skipped": state.skipped_count,
            "failed": state.failed_count,
            "time": round(time.time() - state.start_time, 1)
        })

def run_enrich_worker(req: EnrichRequest):
    with state.lock:
        state.is_enriching = True
        state.status_message = "Enriching metadata with Apple Music..."
    state.notify("enrich_start", {"running": True})

    try:
        mp3_files = [
            os.path.join(SONGS_DIR, f)
            for f in os.listdir(SONGS_DIR)
            if f.endswith('.mp3') and not f.startswith('.')
        ]
        total = len(mp3_files)
        success_count = 0

        with ThreadPoolExecutor(max_workers=req.threads) as executor:
            future_to_file = {
                executor.submit(enrich_single_file, f, req.upgrade_artwork): f
                for f in mp3_files
            }

            for idx, future in enumerate(as_completed(future_to_file), 1):
                success, filename, details = future.result()
                if success:
                    success_count += 1
                state.notify("enrich_progress", {
                    "current": idx,
                    "total": total,
                    "percent": int((idx / max(1, total)) * 100),
                    "filename": filename,
                    "details": details
                })

    finally:
        with state.lock:
            state.is_enriching = False
            state.status_message = "Metadata enrichment complete!"
        state.notify("enrich_complete", {"updated": success_count, "total": total})

# REST Endpoints
@app.get("/api/status")
def get_status():
    with state.lock:
        processed = state.downloaded_count + state.skipped_count + state.failed_count
        pct = int((processed / max(1, state.total_tracks)) * 100) if state.total_tracks > 0 else 0
        elapsed = time.time() - state.start_time if state.is_downloading else 0
        speed = round((state.downloaded_count / max(1, elapsed)) * 60, 1) if elapsed > 0 else 0

        return {
            "is_downloading": state.is_downloading,
            "is_enriching": state.is_enriching,
            "playlist_title": state.playlist_title,
            "total_tracks": state.total_tracks,
            "downloaded": state.downloaded_count,
            "skipped": state.skipped_count,
            "failed": state.failed_count,
            "percent": pct,
            "speed_songs_per_min": speed,
            "status_message": state.status_message,
            "recent_completed": state.recent_completed[:20]
        }

@app.post("/api/download/start")
def start_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    if state.is_downloading:
        raise HTTPException(status_code=400, detail="A download is already in progress.")
    background_tasks.add_task(run_download_worker, req)
    return {"status": "started", "url": req.url}

@app.post("/api/download/stop")
def stop_download():
    if not state.is_downloading:
        return {"status": "not_running"}
    with state.lock:
        state.should_stop = True
        state.status_message = "Stopping download workers..."
    return {"status": "stopping"}

@app.post("/api/enrich/start")
def start_enrich(req: EnrichRequest, background_tasks: BackgroundTasks):
    if state.is_enriching:
        raise HTTPException(status_code=400, detail="Metadata enrichment is already in progress.")
    background_tasks.add_task(run_enrich_worker, req)
    return {"status": "enriching_started"}

@app.get("/api/songs")
def list_songs(search: Optional[str] = None):
    songs = []
    if not os.path.isdir(SONGS_DIR):
        return []

    for f in os.listdir(SONGS_DIR):
        if not f.endswith(".mp3") or f.startswith("."):
            continue
        filepath = os.path.join(SONGS_DIR, f)
        try:
            stat = os.stat(filepath)
            size_mb = round(stat.st_size / (1024 * 1024), 2)
            
            title = f[:-4]
            artist = "Unknown Artist"
            album = "Unknown Album"
            year = ""
            genre = ""
            duration = 0
            
            try:
                mp3 = MP3(filepath)
                duration = int(mp3.info.length)
                raw = ID3(filepath)
                if 'TIT2' in raw and raw['TIT2'].text:
                    title = raw['TIT2'].text[0]
                if 'TPE1' in raw and raw['TPE1'].text:
                    artist = raw['TPE1'].text[0]
                if 'TALB' in raw and raw['TALB'].text:
                    album = raw['TALB'].text[0]
                if 'TDRC' in raw and raw['TDRC'].text:
                    year = str(raw['TDRC'].text[0])
                if 'TCON' in raw and raw['TCON'].text:
                    genre = str(raw['TCON'].text[0])
            except Exception:
                pass

            if search:
                query = search.lower()
                if query not in title.lower() and query not in artist.lower() and query not in album.lower() and query not in f.lower():
                    continue

            songs.append({
                "filename": f,
                "title": title,
                "artist": artist,
                "album": album,
                "year": year,
                "genre": genre,
                "duration": duration,
                "size_mb": size_mb,
                "mtime": stat.st_mtime
            })
        except Exception:
            continue

    # Sort newest downloaded first
    songs.sort(key=lambda x: x["mtime"], reverse=True)
    return songs

@app.get("/api/songs/artwork/{filename}")
def get_song_artwork(filename: str):
    filepath = os.path.join(SONGS_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        raw = ID3(filepath)
        for k in raw.keys():
            if k.startswith('APIC'):
                frame = raw[k]
                mime = frame.mime or "image/jpeg"
                return StreamingResponse(iter([frame.data]), media_type=mime)
    except Exception:
        pass

    # Fallback to default SVG placeholder
    svg = """<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5"><rect width="100%" height="100%" fill="#18181b"/><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v9"/></svg>"""
    return StreamingResponse(iter([svg.encode('utf-8')]), media_type="image/svg+xml")

@app.get("/api/songs/audio/{filename}")
def stream_audio(filename: str):
    filepath = os.path.join(SONGS_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Song not found")
    return FileResponse(filepath, media_type="audio/mpeg", filename=filename)

@app.post("/api/open-folder")
def open_songs_folder():
    if sys.platform == "darwin":
        subprocess.run(["open", SONGS_DIR])
    elif sys.platform == "win32":
        os.startfile(SONGS_DIR)
    else:
        subprocess.run(["xdg-open", SONGS_DIR])
    return {"status": "opened", "path": SONGS_DIR}

@app.get("/api/events")
async def events_stream():
    queue = asyncio.Queue()
    state.listeners.append(queue)
    
    async def event_generator():
        try:
            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            state.listeners.remove(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Mount Static Assets & Frontend
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Loading UI...</h1>")

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting SpotiDownloader Studio Web Server on http://localhost:5000")
    print("📁 Destination folder:", SONGS_DIR)
    uvicorn.run("app:app", host="127.0.0.1", port=5000, reload=False, log_level="info")

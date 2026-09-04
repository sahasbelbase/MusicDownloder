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

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request, Response
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
import discovery
from fix_metadata import process_file as enrich_single_file, fetch_itunes_metadata

app = FastAPI(title="Music Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static") or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

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
        
        # Enrichment cache: {(artist, title): enriched_metadata}
        self.enriched_metadata_cache: Dict[tuple, Dict] = {}
        
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

class SingleTrackDownloadRequest(BaseModel):
    title: str
    artist: str
    album: Optional[str] = "Single"
    cover_url: Optional[str] = None
    query: Optional[str] = None
    quality: str = "320k"
    naming: str = "title"

class BatchTracksDownloadRequest(BaseModel):
    title: str
    tracks: List[Dict]
    threads: int = 3
    quality: str = "320k"
    naming: str = "title"

class EnrichRequest(BaseModel):
    threads: int = 4
    upgrade_artwork: bool = True
    force: bool = False

def enrich_tracks_for_download(tracks: List[Dict], threads: int = 4) -> Dict[tuple, Dict]:
    """Enrich track metadata before downloading. Returns cache of enriched data."""
    enriched_cache = {}
    total = len(tracks)
    
    with ThreadPoolExecutor(max_workers=threads) as executor:
        futures = {}
        for idx, track in enumerate(tracks):
            artist = track.get('artist', 'Unknown Artist')
            title = track.get('title', 'Unknown Title')
            cache_key = (artist, title)
            
            # Skip if already cached
            if cache_key in state.enriched_metadata_cache:
                enriched_cache[cache_key] = state.enriched_metadata_cache[cache_key]
                state.notify("enrich_progress", {
                    "current": len(enriched_cache),
                    "total": total,
                    "percent": int((len(enriched_cache) / total) * 100),
                    "status": "cached",
                    "title": title
                })
                continue
            
            # Submit enrichment task
            future = executor.submit(fetch_itunes_metadata, artist, title)
            futures[future] = (cache_key, title, idx)
        
        # Collect results
        for idx, future in enumerate(as_completed(futures), 1):
            cache_key, title, track_idx = futures[future]
            try:
                enriched_data = future.result()
                if enriched_data and enriched_data.get('match_score', 0) >= 0.45:
                    enriched_cache[cache_key] = enriched_data
                    state.enriched_metadata_cache[cache_key] = enriched_data
                    
                    state.notify("enrich_progress", {
                        "current": len(enriched_cache) + (total - len(futures)),
                        "total": total,
                        "percent": int((len(enriched_cache) / total) * 100),
                        "status": "enriched",
                        "title": title,
                        "album": enriched_data.get('album', 'N/A')
                    })
                else:
                    state.notify("enrich_progress", {
                        "current": len(enriched_cache) + idx,
                        "total": total,
                        "percent": int(((len(enriched_cache) + idx) / total) * 100),
                        "status": "no_match",
                        "title": title
                    })
            except Exception as e:
                state.notify("enrich_progress", {
                    "current": len(enriched_cache) + idx,
                    "total": total,
                    "percent": int(((len(enriched_cache) + idx) / total) * 100),
                    "status": "error",
                    "title": title
                })
    
    return enriched_cache


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

        # Phase 1: Enrich metadata from iTunes before downloading
        with state.lock:
            state.status_message = "Enriching metadata with Apple Music..."
        state.notify("enrich_start", {"message": "Enriching metadata from iTunes...", "total": len(tracks)})
        
        enriched_cache = enrich_tracks_for_download(tracks, threads=min(4, req.threads))
        
        with state.lock:
            state.status_message = f"Downloading \"{collection_title}\" with enriched metadata"
        state.notify("enrich_complete", {
            "enriched": len(enriched_cache),
            "total": len(tracks),
            "message": f"Enriched {len(enriched_cache)} tracks. Starting downloads..."
        })

        # Phase 2: Download tracks with enriched metadata
        with ThreadPoolExecutor(max_workers=req.threads) as executor:
            future_to_track = {
                executor.submit(
                    download_single_track,
                    track,
                    SONGS_DIR,
                    ffmpeg_bin,
                    req.quality,
                    req.naming,
                    None,  # cookies_browser
                    enriched_cache.get((track.get('artist', 'Unknown Artist'), track.get('title', 'Unknown Title')))
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

        with ThreadPoolExecutor(max_workers=min(4, req.threads)) as executor:
            future_to_file = {
                executor.submit(enrich_single_file, f, req.upgrade_artwork, req.force): f
                for f in mp3_files
            }

            for idx, future in enumerate(as_completed(future_to_file), 1):
                status, filename, details = future.result()
                if status == 'updated':
                    success_count += 1
                state.notify("enrich_progress", {
                    "current": idx,
                    "total": total,
                    "percent": int((idx / max(1, total)) * 100),
                    "filename": filename,
                    "status": status,
                    "details": details
                })

    finally:
        with state.lock:
            state.is_enriching = False
            state.status_message = "Metadata enrichment complete!"
        state.notify("enrich_complete", {"updated": success_count, "total": total})

def run_single_song_worker(req: SingleTrackDownloadRequest):
    ffmpeg_bin = find_ffmpeg()
    track_title = f"{req.artist} - {req.title}"
    state.reset_download_state(track_title)
    with state.lock:
        state.playlist_title = track_title
        state.total_tracks = 1
        state.status_message = f"Downloading \"{req.title}\"..."

    state.notify("playlist_loaded", {
        "title": track_title,
        "total": 1
    })

    track_dict = {
        "title": req.title,
        "artist": req.artist,
        "album": req.album or "Single",
        "cover_url": req.cover_url or "",
        "track_number": 1,
        "query": req.query or f"{req.artist} - {req.title} Official Audio"
    }

    try:
        enriched = fetch_itunes_metadata(req.artist, req.title)
        success, status, filename = download_single_track(
            track_dict,
            SONGS_DIR,
            ffmpeg_bin,
            req.quality,
            req.naming,
            None,
            enriched
        )

        with state.lock:
            if status == "skipped":
                state.skipped_count = 1
                state.status_message = f"Already downloaded: {req.title}"
            elif success:
                state.downloaded_count = 1
                state.status_message = f"Downloaded: {req.title}"
            else:
                state.failed_count = 1
                state.status_message = f"Failed to download: {req.title}"

            song_item = {
                "filename": filename,
                "title": req.title,
                "artist": req.artist,
                "album": req.album,
                "cover_url": req.cover_url,
                "status": status,
                "timestamp": time.time()
            }
            state.recent_completed.insert(0, song_item)

        state.notify("progress", {
            "processed": 1,
            "total": 1,
            "percent": 100,
            "downloaded": state.downloaded_count,
            "skipped": state.skipped_count,
            "failed": state.failed_count,
            "last_song": song_item
        })
    except Exception as e:
        with state.lock:
            state.failed_count = 1
            state.status_message = f"Error: {e}"
        state.notify("song_failed", {"title": req.title, "error": str(e)})
    finally:
        with state.lock:
            state.is_downloading = False
        state.notify("completed", {
            "downloaded": state.downloaded_count,
            "skipped": state.skipped_count,
            "failed": state.failed_count,
            "time": round(time.time() - state.start_time, 1)
        })

def run_batch_songs_worker(req: BatchTracksDownloadRequest):
    ffmpeg_bin = find_ffmpeg()
    tracks = req.tracks
    if not tracks:
        return

    state.reset_download_state(req.title)
    with state.lock:
        state.playlist_title = req.title
        state.total_tracks = len(tracks)
        state.status_message = f"Downloading \"{req.title}\" ({len(tracks)} tracks)"

    state.notify("playlist_loaded", {
        "title": req.title,
        "total": len(tracks)
    })

    enriched_cache = enrich_tracks_for_download(tracks, threads=min(4, req.threads))

    with ThreadPoolExecutor(max_workers=req.threads) as executor:
        future_to_track = {
            executor.submit(
                download_single_track,
                track,
                SONGS_DIR,
                ffmpeg_bin,
                req.quality,
                req.naming,
                None,
                enriched_cache.get((track.get('artist', 'Unknown Artist'), track.get('title', 'Unknown Title')))
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
                state.notify("song_failed", {"title": track.get("title"), "error": str(e)})

    with state.lock:
        state.is_downloading = False
        state.status_message = "Download completed!" if not state.should_stop else "Download stopped."
    state.notify("completed", {
        "downloaded": state.downloaded_count,
        "skipped": state.skipped_count,
        "failed": state.failed_count,
        "time": round(time.time() - state.start_time, 1)
    })

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

@app.get("/api/explore/featured")
def get_featured():
    return {
        "featured": discovery.get_featured_playlists(),
        "trending": discovery.get_trending_tracks(limit=15)
    }

@app.get("/api/explore/playlist/{playlist_id}")
def get_playlist_view(playlist_id: str):
    details = discovery.get_playlist_details(playlist_id)
    if not details:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return details

@app.get("/api/explore/album/{album_id}")
def get_album_view(album_id: str):
    details = discovery.get_album_details(album_id)
    if not details:
        raise HTTPException(status_code=404, detail="Album not found")
    return details

@app.get("/api/explore/search")
def search_explore(q: str, type: Optional[str] = "all"):
    clean_q = q.strip() if q else ""
    if not clean_q:
        return {"results": [], "tracks": [], "albums": []}

    tracks = []
    albums = []
    if type in ("all", "tracks"):
        tracks = discovery.search_tracks(clean_q, limit=25)
    if type in ("all", "albums"):
        albums = discovery.search_albums(clean_q, limit=12)

    return {
        "results": tracks,
        "tracks": tracks,
        "albums": albums
    }

@app.post("/api/download/track")
def download_single_track_route(req: SingleTrackDownloadRequest, background_tasks: BackgroundTasks):
    if state.is_downloading:
        raise HTTPException(status_code=400, detail="A download is already in progress.")
    background_tasks.add_task(run_single_song_worker, req)
    return {"status": "started", "title": req.title, "artist": req.artist}

@app.post("/api/download/playlist-tracks")
def download_batch_tracks_route(req: BatchTracksDownloadRequest, background_tasks: BackgroundTasks):
    if state.is_downloading:
        raise HTTPException(status_code=400, detail="A download is already in progress.")
    background_tasks.add_task(run_batch_songs_worker, req)
    return {"status": "started", "title": req.title, "count": len(req.tracks)}

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
            collaborators = []
            duration = 0
            bitrate = "320 kbps"
            
            try:
                mp3 = MP3(filepath)
                duration = int(mp3.info.length)
                # Extract bitrate
                if hasattr(mp3.info, 'bitrate'):
                    bitrate = f"{mp3.info.bitrate // 1000} kbps"
                    
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
                # Extract featuring artists (TPE4 is "Involved people list" or look in title)
                if 'TPE4' in raw and raw['TPE4'].text:
                    collaborators = [str(c) for c in raw['TPE4'].text]
                elif ' feat. ' in title or ' featuring ' in title:
                    # Extract from title if present
                    parts = title.split(' feat. ')[-1] if ' feat. ' in title else title.split(' featuring ')[-1]
                    collaborators = [c.strip() for c in parts.split(',')] if parts else []
            except Exception:
                pass

            if search:
                query = search.lower()
                search_match = (query in title.lower() or query in artist.lower() or 
                               query in album.lower() or query in f.lower() or
                               any(query in c.lower() for c in collaborators))
                if not search_match:
                    continue

            songs.append({
                "filename": f,
                "title": title,
                "artist": artist,
                "album": album,
                "year": year,
                "genre": genre,
                "collaborators": collaborators,
                "duration": duration,
                "size_mb": size_mb,
                "bitrate": bitrate,
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

@app.api_route("/api/songs/audio/{filename}", methods=["GET", "HEAD"])
def stream_audio(filename: str, request: Request):
    filepath = os.path.join(SONGS_DIR, filename)
    if not os.path.isfile(filepath):
        raise HTTPException(status_code=404, detail="Song not found")

    stat = os.stat(filepath)
    file_size = stat.st_size

    if request.method == "HEAD":
        return Response(
            status_code=200,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
                "Content-Type": "audio/mpeg",
            }
        )

    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(
            filepath,
            media_type="audio/mpeg",
            headers={"Accept-Ranges": "bytes"}
        )

    try:
        range_value = range_header.strip().lower()
        if not range_value.startswith("bytes="):
            return FileResponse(filepath, media_type="audio/mpeg", headers={"Accept-Ranges": "bytes"})

        byte_range = range_value[6:].split("-")
        start = int(byte_range[0]) if byte_range[0] else 0
        end = int(byte_range[1]) if len(byte_range) > 1 and byte_range[1] else file_size - 1

        if start >= file_size or end >= file_size or start > end:
            return Response(
                status_code=416,
                headers={"Content-Range": f"bytes */{file_size}"}
            )

        chunk_size = (end - start) + 1

        def iterfile(start_pos: int, length: int):
            with open(filepath, mode="rb") as f:
                f.seek(start_pos)
                remaining = length
                chunk = 64 * 1024
                while remaining > 0:
                    read_size = min(chunk, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "audio/mpeg",
        }
        return StreamingResponse(
            iterfile(start, chunk_size),
            status_code=206,
            headers=headers
        )
    except Exception:
        return FileResponse(filepath, media_type="audio/mpeg", headers={"Accept-Ranges": "bytes"})

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

@app.get("/favicon.ico")
def serve_favicon():
    fav_path = os.path.join(STATIC_DIR, "favicon.svg")
    if os.path.isfile(fav_path):
        return FileResponse(fav_path, media_type="image/svg+xml")
    return HTMLResponse("", status_code=204)

@app.get("/")
def serve_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Loading UI...</h1>")

if __name__ == "__main__":
    import uvicorn
    PORT = int(os.environ.get("PORT", 5050))
    print(f"\n🚀 Starting Music Studio Web Server on http://localhost:{PORT}")
    print("📁 Destination folder:", SONGS_DIR)
    uvicorn.run("app:app", host="127.0.0.1", port=PORT, reload=False, log_level="info")

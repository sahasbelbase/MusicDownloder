"""
discovery.py - In-App Music Discovery, Trending Charts, and Live Search
Provides free, keyless music exploration via Deezer & Spotify Embed extractors.
"""

import os
import json
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Optional, Tuple
from download_playlist import SpotifyExtractor

USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

# In-memory cache to ensure sub-millisecond responses and prevent redundant API hits
_CACHE = {}
CACHE_TTL = 3600  # 1 hour

def _get_cached(key: str) -> Optional[any]:
    entry = _CACHE.get(key)
    if entry and (time.time() - entry['time'] < CACHE_TTL):
        return entry['data']
    return None

def _set_cache(key: str, data: any):
    _CACHE[key] = {
        'time': time.time(),
        'data': data
    }

def _fetch_json(url: str, timeout: int = 10) -> Optional[Dict]:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"[Discovery] Error fetching {url}: {e}")
        return None

def get_featured_playlists() -> List[Dict]:
    """Returns curated featured playlists for the Discover view."""
    return [
        {
            "id": "todays-top-hits",
            "title": "Today's Top Hits",
            "subtitle": "The hottest songs right now worldwide",
            "badge": "Top 100 Worldwide",
            "type": "chart",
            "deezer_id": "3155776842",
            "cover_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
            "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
        },
        {
            "id": "weekly-top-50",
            "title": "Weekly Global Viral 50",
            "subtitle": "Most streamed and trending tracks this week",
            "badge": "Weekly Viral",
            "type": "weekly",
            "deezer_id": "4403076402",
            "cover_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
            "spotify_url": "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF"
        },
        {
            "id": "all-time-legends",
            "title": "Rock & Pop Legends",
            "subtitle": "Timeless rock anthems & legendary classics",
            "badge": "100 Classics",
            "type": "legendary",
            "deezer_id": "11242423484",
            "cover_url": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80",
            "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U"
        },
        {
            "id": "all-out-2000s",
            "title": "2000s Golden Era",
            "subtitle": "The defining hits and party anthems of the 2000s",
            "badge": "2000s Era",
            "type": "era",
            "deezer_id": "4897737548",
            "cover_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
            "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DX4o1oenSJRJd"
        },
        {
            "id": "all-out-80s",
            "title": "All Out 80s Classics",
            "subtitle": "Synthwave, iconic pop, and timeless 80s gems",
            "badge": "80s Hits",
            "type": "era",
            "deezer_id": "1913763402",
            "cover_url": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
            "spotify_url": "https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe"
        }
    ]

def get_trending_tracks(limit: int = 15) -> List[Dict]:
    """Fetches real-time trending tracks from Deezer global chart."""
    cached = _get_cached(f"trending_{limit}")
    if cached:
        return cached

    url = f"https://api.deezer.com/chart/0/tracks?limit={limit}"
    data = _fetch_json(url)
    tracks = []

    if data and "data" in data:
        for t in data["data"]:
            tracks.append({
                "id": str(t.get("id")),
                "title": t.get("title_short") or t.get("title"),
                "artist": t.get("artist", {}).get("name", "Unknown Artist"),
                "album": t.get("album", {}).get("title", "Single"),
                "duration": t.get("duration", 0),
                "cover_url": t.get("album", {}).get("cover_medium") or t.get("album", {}).get("cover_big", ""),
                "preview_url": t.get("preview", ""),
                "query": f"{t.get('artist', {}).get('name', '')} - {t.get('title', '')} Official Audio"
            })

    # Fallback to Spotify extractor if Deezer didn't return tracks
    if not tracks:
        try:
            _, sp_tracks = SpotifyExtractor.extract_tracks("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")
            for idx, t in enumerate(sp_tracks[:limit]):
                tracks.append({
                    "id": f"sp_{idx}",
                    "title": t.get("title"),
                    "artist": t.get("artist"),
                    "album": t.get("album"),
                    "duration": t.get("duration", 0),
                    "cover_url": t.get("cover_url"),
                    "preview_url": "",
                    "query": t.get("query")
                })
        except Exception as e:
            print(f"[Discovery] Spotify fallback error: {e}")

    if tracks:
        _set_cache(f"trending_{limit}", tracks)

    return tracks

def get_playlist_details(playlist_id: str) -> Optional[Dict]:
    """Retrieves full playlist metadata and tracklist by ID with unique covers and real durations."""
    cached = _get_cached(f"playlist_{playlist_id}")
    if cached:
        return cached

    featured_map = {p["id"]: p for p in get_featured_playlists()}
    playlist_meta = featured_map.get(playlist_id)

    title = playlist_meta["title"] if playlist_meta else "Featured Playlist"
    subtitle = playlist_meta["subtitle"] if playlist_meta else ""
    cover_url = playlist_meta["cover_url"] if playlist_meta else ""
    tracks = []

    # 1. Primary: If playlist has a Deezer playlist ID, fetch directly for individual album covers and duration
    deezer_pid = None
    if playlist_meta and playlist_meta.get("deezer_id"):
        deezer_pid = playlist_meta["deezer_id"]
    elif playlist_id.isdigit():
        deezer_pid = playlist_id

    if deezer_pid:
        data = _fetch_json(f"https://api.deezer.com/playlist/{deezer_pid}")
        if data and "tracks" in data:
            if not playlist_meta and data.get("title"):
                title = data.get("title")
            if not cover_url and data.get("picture_medium"):
                cover_url = data.get("picture_medium")

            for idx, t in enumerate(data.get("tracks", {}).get("data", []), 1):
                track_title = t.get("title_short") or t.get("title", "")
                track_artist = t.get("artist", {}).get("name", "Unknown Artist")
                track_album = t.get("album", {}).get("title", "")
                track_cover = (
                    t.get("album", {}).get("cover_big")
                    or t.get("album", {}).get("cover_medium")
                    or cover_url
                )
                track_duration = t.get("duration", 0)
                preview_url = t.get("preview", "")

                tracks.append({
                    "track_number": idx,
                    "title": track_title,
                    "artist": track_artist,
                    "album": track_album or title,
                    "cover_url": track_cover,
                    "duration": track_duration,
                    "preview_url": preview_url,
                    "query": f"{track_artist} - {track_title} Official Audio"
                })

    # 2. Secondary fallback: Spotify Extractor if Deezer returned no tracks
    if not tracks and playlist_meta and playlist_meta.get("spotify_url"):
        try:
            sp_title, sp_tracks = SpotifyExtractor.extract_tracks(playlist_meta["spotify_url"])
            if sp_title:
                title = sp_title
            for idx, t in enumerate(sp_tracks, 1):
                raw_dur = t.get("duration", 0)
                dur_sec = raw_dur // 1000 if raw_dur > 1000 else raw_dur
                tracks.append({
                    "track_number": idx,
                    "title": t.get("title"),
                    "artist": t.get("artist"),
                    "album": t.get("album", title),
                    "cover_url": t.get("cover_url", cover_url),
                    "duration": dur_sec,
                    "preview_url": "",
                    "query": t.get("query") or f"{t.get('artist')} - {t.get('title')} Official Audio"
                })
        except Exception as e:
            print(f"[Discovery] Error extracting playlist {playlist_id} via Spotify: {e}")

    result = {
        "id": playlist_id,
        "title": title,
        "subtitle": subtitle,
        "cover_url": cover_url,
        "track_count": len(tracks),
        "tracks": tracks
    }

    if tracks:
        _set_cache(f"playlist_{playlist_id}", result)

    return result

def search_tracks(query: str, limit: int = 25) -> List[Dict]:
    """Performs instant live search across millions of tracks using Deezer public API."""
    q_clean = query.strip()
    if not q_clean:
        return []

    cache_key = f"search_{q_clean.lower()}_{limit}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    url = f"https://api.deezer.com/search?q={urllib.parse.quote(q_clean)}&limit={limit}"
    data = _fetch_json(url)
    results = []

    if data and "data" in data:
        for t in data["data"]:
            results.append({
                "id": str(t.get("id")),
                "title": t.get("title_short") or t.get("title"),
                "artist": t.get("artist", {}).get("name", "Unknown Artist"),
                "album": t.get("album", {}).get("title", ""),
                "duration": t.get("duration", 0),
                "cover_url": t.get("album", {}).get("cover_medium") or t.get("album", {}).get("cover_big", ""),
                "preview_url": t.get("preview", ""),
                "query": f"{t.get('artist', {}).get('name', '')} - {t.get('title', '')} Official Audio"
            })

    _set_cache(cache_key, results)
    return results

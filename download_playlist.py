#!/usr/bin/env python3
"""
High-Speed Spotify & YouTube Music Playlist Downloader
Supports:
- YouTube Music & YouTube Playlists / Albums / Tracks
- Spotify Playlists / Albums / Tracks
- 320 kbps MP3 Conversion via FFmpeg
- Clean Song Titles (strips (Official Video), lyrics, etc.)
- Full ID3v2 Metadata Tagging & High-Resolution Album Art
- Smart Resume (instantly skips existing songs)
- Latest Songs First (reverse playlist order / newest additions prioritized)
- Parallel Multi-Threaded Downloads
"""

import os
import re
import sys
import time
import json
import shutil
import urllib.request
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import List, Dict, Optional, Tuple

import mutagen
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, TRCK, APIC, ID3NoHeaderError

# Default configuration
DEFAULT_PLAYLIST_URL = "https://music.youtube.com/playlist?list=YOUR_PLAYLIST_ID"
DEFAULT_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Songs")
DEFAULT_THREADS = 3
DEFAULT_BITRATE = "320k"
DEFAULT_NAMING = "title"  # 'title' -> "{Title}.mp3", 'artist-title' -> "{Artist} - {Title}.mp3"

# Console color codes
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

print_lock = Lock()

def log(msg: str, color: str = ""):
    with print_lock:
        if color:
            print(f"{color}{msg}{Colors.RESET}")
        else:
            print(msg)

def sanitize_filename(name: str) -> str:
    """Sanitize string to be safe for macOS/Linux/Windows filenames."""
    sanitized = re.sub(r'[\\/*?:"<>|]', "", name)
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    return sanitized or "Unknown"

def clean_track_artist_and_title(raw_title: str, raw_artist: str = "") -> Tuple[str, str]:
    """Clean track title and artist, stripping unwanted suffixes like (Official Video), ft., feat., etc."""
    title = raw_title.strip()
    artist = raw_artist.strip() if raw_artist else "Unknown Artist"

    # 1. Clean bracketed noise: (Official Video), [OFFICIAL MUSIC VIDEO], etc.
    bracket_noise = [
        r'\s*[\(\[\{][^\)\]\}]*(?:official|video|audio|lyrics|visualizer|remaster|hd|4k|version|edit|clip)[^\)\]\}]*[\)\]\}]',
        r'\s*[\(\[\{]\s*(?:audio|lyrics|hd|4k|hq)\s*[\)\]\}]',
    ]
    for p in bracket_noise:
        title = re.sub(p, '', title, flags=re.IGNORECASE).strip()

    # 2. Clean trailing noise: Official Video, Official Music Video, Lyrics, etc.
    trailing_noise = [
        r'\s*\|\s*.*$',
        r'\s*-\s*Official\s*.*$',
        r'\s+Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|HD|4K)\b.*$',
    ]
    for p in trailing_noise:
        title = re.sub(p, '', title, flags=re.IGNORECASE).strip()

    # 3. Detect Artist embedded in Title (e.g. "Vance Joy - Riptide", "Kendrick Lamar, SZA - All The Stars")
    if " - " in title:
        parts = title.split(" - ", 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    elif ": " in title:
        parts = title.split(": ", 1)
        artist = parts[0].strip()
        title = parts[1].strip()

    if artist.endswith(" - Topic"):
        artist = artist[:-8].strip()

    # 4. Extract and strip featuring artists (ft., feat., featuring)
    feat_patterns = [
        r'\s*[\(\[\{]\s*(?:feat\.?|ft\.?|featuring)\s+([^\)\]\}]+)[\)\]\}]',
        r'\s+(?:feat\.?|ft\.?|featuring)\s+(.+)$',
    ]
    featured_artists = []
    for p in feat_patterns:
        match = re.search(p, title, flags=re.IGNORECASE)
        if match:
            feat_art = match.group(1).strip()
            if feat_art and feat_art not in featured_artists:
                featured_artists.append(feat_art)
            title = re.sub(p, '', title, flags=re.IGNORECASE).strip()

    if featured_artists and artist and artist != "Unknown Artist":
        extra = ", ".join(featured_artists)
        if extra.lower() not in artist.lower():
            artist = f"{artist}, {extra}"

    # Strip surrounding quotes and whitespace
    title = title.strip("'\"` ").strip()
    artist = artist.strip("'\"` ").strip()
    return artist, title

def find_ffmpeg() -> str:
    """Find FFmpeg binary in system or Homebrew paths."""
    ffmpeg_bin = shutil.which("ffmpeg")
    if ffmpeg_bin:
        return ffmpeg_bin

    mac_paths = [
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        "/opt/local/bin/ffmpeg"
    ]
    for path in mac_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return ""

def check_dependencies() -> str:
    """Verify FFmpeg and yt-dlp are available."""
    ffmpeg_bin = find_ffmpeg()
    if not ffmpeg_bin:
        log("❌ Error: FFmpeg not found on your system!", Colors.RED)
        log("💡 Install using Homebrew: brew install ffmpeg", Colors.YELLOW)
        sys.exit(1)

    try:
        import yt_dlp
    except ImportError:
        log("⚠️ yt-dlp is not installed. Installing now...", Colors.YELLOW)
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-U", "yt-dlp", "mutagen", "requests"])
    
    return ffmpeg_bin

class SpotifyExtractor:
    """Extract tracks and metadata from Spotify URLs without requiring API credentials."""
    
    @staticmethod
    def is_spotify_url(url: str) -> bool:
        return "open.spotify.com" in url or "spotify.link" in url

    @staticmethod
    def extract_tracks(url: str) -> Tuple[str, List[Dict]]:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
        
        track_match = re.search(r'spotify\.com/track/([a-zA-Z0-9]+)', url)
        playlist_match = re.search(r'spotify\.com/playlist/([a-zA-Z0-9]+)', url)
        album_match = re.search(r'spotify\.com/album/([a-zA-Z0-9]+)', url)

        tracks = []
        collection_title = "Spotify Playlist"

        if track_match:
            track_id = track_match.group(1)
            embed_url = f"https://open.spotify.com/embed/track/{track_id}"
            req = urllib.request.Request(embed_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode('utf-8')
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
            if match:
                data = json.loads(match.group(1))
                entity = data.get('props', {}).get('pageProps', {}).get('state', {}).get('data', {}).get('entity', {})
                collection_title = entity.get('title', 'Spotify Track')
                tracks.append({
                    'title': entity.get('title', ''),
                    'artist': entity.get('subtitle', ''),
                    'album': entity.get('album', {}).get('name', entity.get('title', '')),
                    'cover_url': entity.get('visualIdentity', {}).get('image', [{}])[-1].get('url', ''),
                    'track_number': 1,
                    'query': f"{entity.get('subtitle', '')} - {entity.get('title', '')} Official Audio",
                    'spotify_url': url
                })
            return collection_title, tracks

        if playlist_match or album_match:
            entity_type = "playlist" if playlist_match else "album"
            entity_id = playlist_match.group(1) if playlist_match else album_match.group(1)
            embed_url = f"https://open.spotify.com/embed/{entity_type}/{entity_id}"
            
            req = urllib.request.Request(embed_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode('utf-8')
            
            match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
            if match:
                data = json.loads(match.group(1))
                entity = data.get('props', {}).get('pageProps', {}).get('state', {}).get('data', {}).get('entity', {})
                collection_title = entity.get('title', 'Spotify Collection')
                cover_url = entity.get('visualIdentity', {}).get('image', [{}])[-1].get('url', '')
                
                track_list = entity.get('trackList', [])
                for idx, t in enumerate(track_list, 1):
                    t_title = t.get('title', '')
                    t_artist = t.get('subtitle', '')
                    tracks.append({
                        'title': t_title,
                        'artist': t_artist,
                        'album': collection_title,
                        'cover_url': cover_url,
                        'track_number': idx,
                        'query': f"{t_artist} - {t_title} Official Audio",
                        'spotify_url': f"https://open.spotify.com/track/{t.get('id', '')}"
                    })
            return collection_title, tracks

        return collection_title, tracks

class YouTubeExtractor:
    """Extract tracks from YouTube and YouTube Music URLs using yt-dlp."""
    
    @staticmethod
    def extract_tracks(url: str, limit: Optional[int] = None) -> Tuple[str, List[Dict]]:
        import yt_dlp
        
        ydl_opts = {
            'extract_flat': 'in_playlist',
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        tracks = []
        collection_title = "YouTube Music Playlist"
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if 'entries' in info:
                collection_title = info.get('title', 'YouTube Playlist')
                entries = list(info['entries'])
                
                for idx, entry in enumerate(entries, 1):
                    if not entry:
                        continue
                    
                    raw_title = entry.get('title', '')
                    raw_artist = entry.get('artist') or entry.get('uploader') or entry.get('channel') or "Unknown Artist"
                    
                    artist, title = clean_track_artist_and_title(raw_title, raw_artist)
                    thumbnail = entry.get('thumbnail') or (entry.get('thumbnails', [{}])[-1].get('url') if entry.get('thumbnails') else '')
                    video_url = entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}"
                    
                    tracks.append({
                        'title': title,
                        'artist': artist,
                        'album': entry.get('album') or collection_title,
                        'release_year': entry.get('release_year') or (entry.get('upload_date', '')[:4] if entry.get('upload_date') else ''),
                        'cover_url': thumbnail,
                        'track_number': idx,
                        'query': video_url,
                        'yt_url': video_url,
                        'id': entry.get('id')
                    })
            else:
                raw_title = info.get('title', '')
                raw_artist = info.get('artist') or info.get('uploader') or "Unknown Artist"
                artist, title = clean_track_artist_and_title(raw_title, raw_artist)
                    
                collection_title = info.get('album') or title
                thumbnail = info.get('thumbnail') or ''
                video_url = info.get('webpage_url') or url
                
                tracks.append({
                    'title': title,
                    'artist': artist,
                    'album': info.get('album') or collection_title,
                    'release_year': info.get('release_year') or (info.get('upload_date', '')[:4] if info.get('upload_date') else ''),
                    'cover_url': thumbnail,
                    'track_number': 1,
                    'query': video_url,
                    'yt_url': video_url,
                    'id': info.get('id')
                })
                
        return collection_title, tracks

def embed_id3_tags(file_path: str, track_info: Dict):
    """Embed comprehensive ID3v2.3 tags and high-resolution album art into MP3 file."""
    try:
        try:
            audio = ID3(file_path)
        except ID3NoHeaderError:
            audio = ID3()

        title = track_info.get('title', '')
        artist = track_info.get('artist', '')
        album = track_info.get('album', '')
        year = str(track_info.get('release_year', ''))
        track_num = str(track_info.get('track_number', '1'))

        if title:
            audio.add(TIT2(encoding=3, text=title))
        if artist:
            audio.add(TPE1(encoding=3, text=artist))
        if album:
            audio.add(TALB(encoding=3, text=album))
        if year and year.isdigit():
            audio.add(TDRC(encoding=3, text=year))
        if track_num and track_num.isdigit():
            audio.add(TRCK(encoding=3, text=track_num))

        cover_url = track_info.get('cover_url')
        if cover_url and cover_url.startswith('http'):
            try:
                req = urllib.request.Request(cover_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    img_data = resp.read()
                    mime_type = "image/jpeg"
                    if cover_url.lower().endswith(".png"):
                        mime_type = "image/png"
                    elif cover_url.lower().endswith(".webp"):
                        mime_type = "image/webp"

                    audio.delall('APIC')
                    audio.add(APIC(
                        encoding=3,
                        mime=mime_type,
                        type=3,
                        desc="Cover",
                        data=img_data
                    ))
            except Exception:
                pass

        audio.save(file_path, v2_version=3)
    except Exception as e:
        log(f"⚠️ Warning embedding ID3 tags into {os.path.basename(file_path)}: {e}", Colors.YELLOW)

def get_target_filename(track_info: Dict, naming_format: str = "title") -> str:
    """Generate clean filename based on chosen naming convention."""
    artist = sanitize_filename(track_info.get('artist', 'Unknown Artist'))
    title = sanitize_filename(track_info.get('title', 'Unknown Title'))
    track_num = str(track_info.get('track_number', '1')).zfill(2)

    if naming_format == "title":
        return f"{title}.mp3"
    elif naming_format == "artist-title":
        return f"{artist} - {title}.mp3"
    elif naming_format == "track-title":
        return f"{track_num} - {title}.mp3"
    elif naming_format == "track-artist-title":
        return f"{track_num} - {artist} - {title}.mp3"
    return f"{title}.mp3"

def download_single_track(
    track_info: Dict,
    output_folder: str,
    ffmpeg_bin: str,
    bitrate: str = "320k",
    naming_format: str = "title",
    cookies_browser: Optional[str] = None
) -> Tuple[bool, str, str]:
    """Download a single track using yt-dlp, convert to MP3, and tag with ID3 metadata."""
    import yt_dlp

    target_filename = get_target_filename(track_info, naming_format)
    target_filepath = os.path.join(output_folder, target_filename)
    temp_prefix = os.path.join(output_folder, f".temp_{track_info.get('id', int(time.time()*1000))}")

    # Also check if artist - title variant already exists to prevent duplicate downloads
    artist = sanitize_filename(track_info.get('artist', 'Unknown Artist'))
    title = sanitize_filename(track_info.get('title', 'Unknown Title'))
    alt_filepath = os.path.join(output_folder, f"{artist} - {title}.mp3")

    if (os.path.isfile(target_filepath) and os.path.getsize(target_filepath) > 200 * 1024) or \
       (os.path.isfile(alt_filepath) and os.path.getsize(alt_filepath) > 200 * 1024):
        # If alt filepath exists, rename to user's desired naming format
        if os.path.isfile(alt_filepath) and not os.path.isfile(target_filepath):
            shutil.move(alt_filepath, target_filepath)
        return True, "skipped", target_filename

    query = track_info.get('query') or f"{artist} - {title} Official Audio"
    if not query.startswith("http"):
        query = f"ytsearch1:{query}"

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f"{temp_prefix}.%(ext)s",
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': bitrate.replace('k', ''),
        }],
        'ffmpeg_location': ffmpeg_bin,
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'noplaylist': True,
    }

    if cookies_browser:
        ydl_opts['cookiesfrombrowser'] = (cookies_browser,)

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([query])

            temp_mp3 = f"{temp_prefix}.mp3"
            if os.path.isfile(temp_mp3):
                embed_id3_tags(temp_mp3, track_info)
                shutil.move(temp_mp3, target_filepath)
                return True, "downloaded", target_filename
            else:
                matched = [f for f in os.listdir(output_folder) if f.startswith(f".temp_{track_info.get('id', '')}")]
                if matched:
                    cand = os.path.join(output_folder, matched[0])
                    embed_id3_tags(cand, track_info)
                    shutil.move(cand, target_filepath)
                    return True, "downloaded", target_filename
                
                raise RuntimeError(f"FFmpeg conversion failed to produce {temp_mp3}")
                
        except Exception as e:
            if attempt < max_retries:
                time.sleep(1.5 * attempt)
            else:
                for f in os.listdir(output_folder):
                    if f.startswith(".temp_"):
                        try:
                            os.remove(os.path.join(output_folder, f))
                        except:
                            pass
                return False, str(e), target_filename

    return False, "Max retries exceeded", target_filename

def run_downloader(
    url: str,
    output_folder: str,
    threads: int = DEFAULT_THREADS,
    bitrate: str = DEFAULT_BITRATE,
    sort_order: str = "latest",
    naming_format: str = DEFAULT_NAMING,
    limit: Optional[int] = None,
    cookies_browser: Optional[str] = None
):
    os.makedirs(output_folder, exist_ok=True)
    ffmpeg_bin = check_dependencies()

    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}🎵  Spotify & YouTube Music High-Speed Downloader  🎵{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"🔗 Target URL:   {Colors.YELLOW}{url}{Colors.RESET}")
    log(f"📁 Destination:  {Colors.YELLOW}{output_folder}{Colors.RESET}")
    log(f"⚡ Threads:      {Colors.CYAN}{threads}{Colors.RESET} | Quality: {Colors.CYAN}{bitrate} MP3{Colors.RESET} | Sort: {Colors.CYAN}{sort_order.upper()}{Colors.RESET} | Naming: {Colors.CYAN}{naming_format.upper()}{Colors.RESET}")
    log(f"🔍 Fetching playlist metadata...\n", Colors.DIM)

    start_time = time.time()
    if SpotifyExtractor.is_spotify_url(url):
        log("🟢 Detected Spotify URL. Parsing track catalog...", Colors.GREEN)
        collection_title, tracks = SpotifyExtractor.extract_tracks(url)
    else:
        log("🔴 Detected YouTube / YouTube Music URL. Parsing track catalog...", Colors.RED)
        collection_title, tracks = YouTubeExtractor.extract_tracks(url, limit=None)

    total_tracks_found = len(tracks)
    if total_tracks_found == 0:
        log(f"❌ No tracks found for the provided URL: {url}", Colors.RED)
        return

    # Sort tracks according to preference
    if sort_order == "latest":
        tracks.reverse()
        log(f"🔄 Sorted by {Colors.BOLD}LATEST ADDED FIRST{Colors.RESET} (Newest songs prioritized)", Colors.CYAN)
    elif sort_order == "oldest":
        log(f"🔄 Sorted by {Colors.BOLD}OLDEST FIRST{Colors.RESET} (Playlist default order)", Colors.CYAN)

    if limit and len(tracks) > limit:
        tracks = tracks[:limit]

    total_to_download = len(tracks)
    log(f"📋 Playlist Title: {Colors.BOLD}{collection_title}{Colors.RESET}")
    log(f"🔢 Total Tracks to Process: {Colors.BOLD}{total_to_download}{Colors.RESET} (from {total_tracks_found} in playlist)\n")

    downloaded_count = 0
    skipped_count = 0
    failed_count = 0
    failed_list = []

    log(f"🚀 Starting download workers ({threads} concurrent streams)...\n", Colors.BOLD)

    with ThreadPoolExecutor(max_workers=threads) as executor:
        future_to_track = {
            executor.submit(
                download_single_track,
                track,
                output_folder,
                ffmpeg_bin,
                bitrate,
                naming_format,
                cookies_browser
            ): (idx, track)
            for idx, track in enumerate(tracks, 1)
        }

        for future in as_completed(future_to_track):
            idx, track = future_to_track[future]
            try:
                success, status, filename = future.result()
                current_total = downloaded_count + skipped_count + failed_count + 1
                progress = f"[{current_total}/{total_to_download}] ({int(current_total/total_to_download*100)}%)"

                if status == "skipped":
                    skipped_count += 1
                    log(f"{Colors.DIM}⏩ {progress} Skipped (already exists): {filename}{Colors.RESET}")
                elif success:
                    downloaded_count += 1
                    log(f"{Colors.GREEN}✅ {progress} Downloaded: {filename}{Colors.RESET}")
                else:
                    failed_count += 1
                    failed_list.append((filename, status))
                    log(f"{Colors.RED}❌ {progress} Failed: {filename} - {status}{Colors.RESET}")
            except Exception as e:
                failed_count += 1
                failed_list.append((track.get('title', 'Unknown'), str(e)))
                log(f"{Colors.RED}❌ Error processing track {idx}: {e}{Colors.RESET}")

    elapsed = round(time.time() - start_time, 1)
    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}✨ Download Summary for \"{collection_title}\"{Colors.RESET}")
    log(f"⏱️  Time Elapsed:     {elapsed}s")
    log(f"✅ Newly Downloaded: {Colors.GREEN}{downloaded_count}{Colors.RESET}")
    log(f"⏩ Already Existed:  {Colors.YELLOW}{skipped_count}{Colors.RESET}")
    log(f"❌ Failed Tracks:    {Colors.RED if failed_count else Colors.GREEN}{failed_count}{Colors.RESET}")
    log(f"📂 Folder:           {output_folder}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")

    if failed_list:
        log("⚠️  Failed Tracks List:", Colors.YELLOW)
        for item, reason in failed_list:
            log(f"   • {item} ({reason})", Colors.RED)

def main():
    parser = argparse.ArgumentParser(
        description="High-Speed Spotify & YouTube Music Playlist Downloader (320kbps MP3 + Full ID3 Tags)"
    )
    parser.add_argument("url", nargs="?", default=DEFAULT_PLAYLIST_URL, help="Playlist or Track URL")
    parser.add_argument("--output", "-o", default=DEFAULT_OUTPUT_FOLDER, help="Output destination folder")
    parser.add_argument("--threads", "-t", type=int, default=DEFAULT_THREADS, help="Download threads (default: 3)")
    parser.add_argument("--quality", "-q", default=DEFAULT_BITRATE, help="Audio bitrate (default: 320k)")
    parser.add_argument("--sort", "-s", choices=["latest", "oldest"], default="latest", help="Sort order: 'latest' (newest additions first, default) or 'oldest'")
    parser.add_argument("--naming", "-n", choices=["title", "artist-title", "track-title"], default=DEFAULT_NAMING, help="Filename format: 'title' (Song.mp3, default), 'artist-title', or 'track-title'")
    parser.add_argument("--limit", "-l", type=int, default=None, help="Limit number of tracks to download (e.g. --limit 5 for testing)")
    parser.add_argument("--cookies-browser", help="Browser to extract cookies from (chrome, safari, firefox, brave)")

    args = parser.parse_args()

    run_downloader(
        url=args.url,
        output_folder=args.output,
        threads=args.threads,
        bitrate=args.quality,
        sort_order=args.sort,
        naming_format=args.naming,
        limit=args.limit,
        cookies_browser=args.cookies_browser
    )

if __name__ == "__main__":
    main()

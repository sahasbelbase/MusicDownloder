#!/usr/bin/env python3
"""
Audio Metadata Enricher & HD Cover Art Updater
- Queries official Apple Music / iTunes master catalogs for each song
- Updates:
    • Official Studio Album Name (replaces generic playlist names)
    • Exact Release Year (e.g. 2024, 2023, etc.)
    • Primary Genre (e.g. Pop, Hip-Hop/Rap, R&B/Soul, Rock)
    • 1000x1000 Ultra-HD Studio Cover Artwork
    • Clean Song Titles & Artists
- Fast Multi-Threaded Execution
"""

import os
import re
import sys
import time
import json
import urllib.request
import urllib.parse
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import Optional, Dict, Tuple

import mutagen
from mutagen.id3 import ID3, TIT2, TPE1, TALB, TDRC, TCON, APIC, ID3NoHeaderError
from mutagen.easyid3 import EasyID3

DEFAULT_SONGS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Songs")
DEFAULT_THREADS = 8

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

def clean_song_name(name: str) -> str:
    """Strip .mp3 extension and any leftover video/audio tags."""
    if name.lower().endswith(".mp3"):
        name = name[:-4]
    patterns = [
        r'\s*[\(\[\{][^\)\]\}]*(?:official|video|audio|lyrics|visualizer|remaster|hd|4k|version|edit|clip|ft\.|feat\.)[^\)\]\}]*[\)\]\}]',
        r'\s+(?:feat\.?|ft\.?|featuring)\s+.+$',
        r'\s*\|\s*.*$',
        r'\s*-\s*Official\s*.*$',
        r'\s+Official\s*(?:Music\s*)?(?:Video|Audio|Lyric\s*Video|HD|4K)\b.*$',
    ]
    for p in patterns:
        name = re.sub(p, '', name, flags=re.IGNORECASE).strip()
    return name.strip('\'"` ')

def fetch_itunes_metadata(artist: str, title: str) -> Optional[Dict]:
    """Query Apple Music / iTunes Search API for official metadata and HD artwork."""
    queries = [
        f"{artist} {title}".strip(),
        title.strip()
    ]

    for q in queries:
        if not q:
            continue
        try:
            url = "https://itunes.apple.com/search?" + urllib.parse.urlencode({
                'term': q,
                'media': 'music',
                'entity': 'song',
                'limit': 3
            })
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get('results', [])
                if results:
                    best = results[0]
                    # Check if artist matches better in other top results
                    for r in results:
                        if artist and artist.lower() in r.get('artistName', '').lower():
                            best = r
                            break

                    artwork_url = best.get('artworkUrl100', '')
                    if artwork_url:
                        # Upgrade to 1000x1000 HD artwork
                        artwork_url = artwork_url.replace('100x100bb.jpg', '1000x1000bb.jpg').replace('100x100bb.png', '1000x1000bb.png')

                    return {
                        'title': best.get('trackName'),
                        'artist': best.get('artistName'),
                        'album': best.get('collectionName'),
                        'year': best.get('releaseDate', '')[:4],
                        'genre': best.get('primaryGenreName'),
                        'artwork_url': artwork_url,
                    }
        except Exception:
            continue
    return None

def process_file(file_path: str, upgrade_artwork: bool = True) -> Tuple[bool, str, str]:
    filename = os.path.basename(file_path)
    clean_title = clean_song_name(filename)
    current_artist = "Unknown Artist"

    try:
        audio = ID3(file_path)
    except ID3NoHeaderError:
        audio = ID3()
    except Exception as e:
        return False, filename, f"Failed to read ID3: {e}"

    # Extract existing artist if present
    if 'TPE1' in audio and audio['TPE1'].text:
        current_artist = audio['TPE1'].text[0]

    # Query iTunes for official studio metadata
    meta = fetch_itunes_metadata(current_artist, clean_title)

    if not meta:
        return False, filename, "No iTunes match found"

    try:
        # Update Title, Artist, Album, Year, Genre
        if meta.get('title'):
            audio.add(TIT2(encoding=3, text=meta['title']))
        if meta.get('artist'):
            audio.add(TPE1(encoding=3, text=meta['artist']))
        if meta.get('album'):
            audio.add(TALB(encoding=3, text=meta['album']))
        if meta.get('year') and meta['year'].isdigit():
            audio.add(TDRC(encoding=3, text=meta['year']))
        if meta.get('genre'):
            audio.add(TCON(encoding=3, text=meta['genre']))

        # Upgrade artwork to 1000x1000 HD
        if upgrade_artwork and meta.get('artwork_url'):
            try:
                req = urllib.request.Request(meta['artwork_url'], headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    img_data = resp.read()
                    audio.delall('APIC')
                    audio.add(APIC(
                        encoding=3,
                        mime="image/jpeg",
                        type=3,
                        desc="Cover",
                        data=img_data
                    ))
            except Exception:
                pass

        audio.save(file_path, v2_version=3)
        return True, filename, f"{meta.get('album', '')} ({meta.get('year', '')}) [{meta.get('genre', '')}]"

    except Exception as e:
        return False, filename, f"Error saving tags: {e}"

def enrich_folder(folder_path: str, threads: int = DEFAULT_THREADS, upgrade_artwork: bool = True):
    if not os.path.isdir(folder_path):
        log(f"❌ Folder not found: {folder_path}", Colors.RED)
        return

    mp3_files = [
        os.path.join(folder_path, f)
        for f in os.listdir(folder_path)
        if f.endswith('.mp3') and not f.startswith('.')
    ]

    total_files = len(mp3_files)
    if total_files == 0:
        log(f"❌ No MP3 files found in {folder_path}", Colors.RED)
        return

    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}✨  Audio Metadata & HD Cover Art Enricher  ✨{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"📁 Target Folder:  {Colors.YELLOW}{folder_path}{Colors.RESET}")
    log(f"🔢 Total Songs:    {Colors.BOLD}{total_files}{Colors.RESET}")
    log(f"⚡ Threads:        {Colors.CYAN}{threads}{Colors.RESET} | HD Artwork: {Colors.GREEN}{upgrade_artwork}{Colors.RESET}")
    log(f"🔍 Enriching album names, release years, genres & artwork...\n", Colors.DIM)

    start_time = time.time()
    success_count = 0
    skipped_count = 0

    with ThreadPoolExecutor(max_workers=threads) as executor:
        future_to_file = {
            executor.submit(process_file, f, upgrade_artwork): f
            for f in mp3_files
        }

        for idx, future in enumerate(as_completed(future_to_file), 1):
            success, filename, details = future.result()
            progress = f"[{idx}/{total_files}] ({int(idx/total_files*100)}%)"

            if success:
                success_count += 1
                log(f"{Colors.GREEN}✅ {progress} {filename} ➔ {details}{Colors.RESET}")
            else:
                skipped_count += 1
                log(f"{Colors.YELLOW}⚠️ {progress} {filename} ➔ {details}{Colors.RESET}")

    elapsed = round(time.time() - start_time, 1)
    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}✨ Metadata Enrichment Complete!{Colors.RESET}")
    log(f"⏱️  Time Elapsed:     {elapsed}s")
    log(f"✅ Successfully Updated: {Colors.GREEN}{success_count}{Colors.RESET}")
    log(f"⚠️  Unchanged / Skipped: {Colors.YELLOW}{skipped_count}{Colors.RESET}")
    log(f"📂 Folder:               {folder_path}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")

def main():
    parser = argparse.ArgumentParser(
        description="Enrich MP3 metadata with official studio Album, Release Year, Genre, and 1000x1000 HD Cover Art"
    )
    parser.add_argument("--folder", "-f", default=DEFAULT_SONGS_FOLDER, help="Path to Songs directory")
    parser.add_argument("--threads", "-t", type=int, default=DEFAULT_THREADS, help="Number of worker threads (default: 8)")
    parser.add_argument("--no-art", action="store_true", help="Skip updating cover art (only update text tags)")

    args = parser.parse_args()

    enrich_folder(
        folder_path=args.folder,
        threads=args.threads,
        upgrade_artwork=not args.no_art
    )

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Audio Metadata Enricher & HD Cover Art Updater (v2)
- Queries official Apple Music / iTunes master catalogs for each song
- Updates:
    • Official Studio Album Name (replaces generic playlist names)
    • Exact Release Year (e.g. 2024, 2023, etc.)
    • Primary Genre (e.g. Pop, Hip-Hop/Rap, R&B/Soul, Rock)
    • 1000x1000 Ultra-HD Studio Cover Artwork
    • Clean Song Titles & Artists
- Smart Skip: Detects already-enriched songs and skips them instantly
- Fuzzy Match: Validates iTunes results against file metadata before writing
- Export Report: Saves enrichment_report.json with full audit trail
- Fast Multi-Threaded Execution
"""

import os
import re
import sys
import time
import json
import urllib.request
import urllib.parse
from ssl_helper import safe_urlopen
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import Optional, Dict, Tuple
from difflib import SequenceMatcher

import mutagen
from mutagen.id3 import ID3, TIT2, TPE1, TPE2, TALB, TDRC, TYER, TCON, APIC, ID3NoHeaderError
from mutagen.easyid3 import EasyID3

def set_macos_finder_icon(file_path: str, image_data: bytes) -> bool:
    """Set native macOS Finder file icon on the MP3 file using AppKit."""
    if sys.platform != "darwin":
        return False
    try:
        from AppKit import NSWorkspace, NSImage, NSData
        nsdata = NSData.dataWithBytes_length_(image_data, len(image_data))
        img = NSImage.alloc().initWithData_(nsdata)
        if img:
            return bool(NSWorkspace.sharedWorkspace().setIcon_forFile_options_(img, file_path, 0))
    except Exception:
        pass
    return False

DEFAULT_SONGS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Songs")
DEFAULT_THREADS = 4
FUZZY_THRESHOLD = 0.45  # Minimum similarity score to accept a match

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
report_lock = Lock()
_itunes_lock = Lock()
_last_request_time = 0.0
MIN_REQUEST_INTERVAL = 0.30  # Minimum seconds between API requests across all worker threads

def _rate_limit():
    """Polite pacing across all threads to avoid Apple iTunes HTTP 429 rate limits."""
    global _last_request_time
    with _itunes_lock:
        now = time.time()
        elapsed = now - _last_request_time
        if elapsed < MIN_REQUEST_INTERVAL:
            time.sleep(MIN_REQUEST_INTERVAL - elapsed)
        _last_request_time = time.time()

# Global report data
report_data = {
    "updated": [],
    "skipped_already_enriched": [],
    "skipped_no_match": [],
    "skipped_fuzzy_reject": [],
    "failed": []
}

def log(msg: str, color: str = ""):
    with print_lock:
        if color:
            print(f"{color}{msg}{Colors.RESET}")
        else:
            print(msg)

def add_to_report(category: str, entry: dict):
    with report_lock:
        report_data[category].append(entry)

def clean_song_name(name: str) -> str:
    """Strip .mp3 extension, normalize unicode characters, and strip leftover video/audio tags."""
    if name.lower().endswith(".mp3"):
        name = name[:-4]
    name = name.replace('ᐳ', '>').replace('ᐸ', '<')
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

def normalize_for_comparison(text: str) -> str:
    """Normalize a string for fuzzy comparison — lowercase, strip punctuation and whitespace."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)  # remove punctuation
    text = re.sub(r'\s+', ' ', text)     # collapse whitespace
    return text.strip()

def fuzzy_match(str1: str, str2: str) -> float:
    """Return similarity ratio between two strings (0.0 to 1.0)."""
    a = normalize_for_comparison(str1)
    b = normalize_for_comparison(str2)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()

def is_already_enriched(audio: ID3) -> bool:
    """
    Check if a song already has rich metadata indicating it was previously enriched.
    A song is considered enriched if it has ALL of: Album, Year, Genre, and HD artwork (>50KB).
    """
    has_album = False
    has_year = False
    has_genre = False
    has_hd_art = False

    if 'TALB' in audio and audio['TALB'].text:
        album = str(audio['TALB'].text[0]).strip()
        if album and album not in ('Unknown', 'Unknown Album', '', 'YouTube', 'YouTube Music'):
            has_album = True

    if 'TDRC' in audio and audio['TDRC'].text:
        year = str(audio['TDRC'].text[0]).strip()
        if year and len(year) >= 4 and year[:4].isdigit():
            has_year = True

    if 'TCON' in audio and audio['TCON'].text:
        genre = str(audio['TCON'].text[0]).strip()
        if genre and genre not in ('Unknown', ''):
            has_genre = True

    for k in audio.keys():
        if k.startswith('APIC'):
            frame = audio[k]
            if hasattr(frame, 'data') and len(frame.data) > 50000:  # >50KB = HD art
                has_hd_art = True
                break

    return has_album and has_year and has_genre and has_hd_art

def fetch_itunes_metadata(artist: str, title: str) -> Optional[Dict]:
    """
    Query Apple Music / iTunes Search API for official metadata and HD artwork.
    Includes rate-limiting pacing, multi-step fallback queries, and exponential backoff on HTTP 429.
    """
    # Build a prioritized list of search query candidates
    queries = []
    has_valid_artist = artist and artist not in ("Unknown Artist", "Unknown", "")
    
    if has_valid_artist:
        queries.append(f"{artist} {title}".strip())
    queries.append(title.strip())

    # Fallback 1: Primary artist only if multiple artists are comma-separated
    if has_valid_artist and ',' in artist:
        primary_artist = artist.split(',')[0].strip()
        queries.append(f"{primary_artist} {title}".strip())

    # Fallback 2: Strip bracketed parts from title (e.g. "Song (Remix)" -> "Song")
    base_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', title).strip()
    if base_title and base_title != title:
        if has_valid_artist:
            queries.append(f"{artist} {base_title}".strip())
        queries.append(base_title)

    # Fallback 3: Clean alphanumeric search
    sanitized_title = re.sub(r'[^\w\s]', ' ', title)
    sanitized_title = re.sub(r'\s+', ' ', sanitized_title).strip()
    if sanitized_title and sanitized_title not in queries:
        if has_valid_artist:
            queries.append(f"{artist} {sanitized_title}".strip())
        queries.append(sanitized_title)

    # De-duplicate while preserving order
    unique_queries = []
    for q in queries:
        if q and q not in unique_queries:
            unique_queries.append(q)

    for q in unique_queries:
        # Retry with backoff for each query if Apple throttles (HTTP 429)
        for attempt in range(3):
            _rate_limit()
            try:
                url = "https://itunes.apple.com/search?" + urllib.parse.urlencode({
                    'term': q,
                    'media': 'music',
                    'entity': 'song',
                    'limit': 5
                })
                req = urllib.request.Request(
                    url,
                    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
                )
                with safe_urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    results = data.get('results', [])
                    if results:
                        best = results[0]
                        best_score = 0.0

                        # Find the best matching result using fuzzy comparison
                        for r in results:
                            itunes_title = r.get('trackName', '')
                            itunes_artist = r.get('artistName', '')

                            title_score = fuzzy_match(title, itunes_title)
                            base_score = fuzzy_match(base_title, itunes_title) if base_title != title else 0.0
                            effective_title_score = max(title_score, base_score)

                            artist_score = fuzzy_match(artist, itunes_artist) if has_valid_artist else 0.3

                            combined = (effective_title_score * 0.7) + (artist_score * 0.3)
                            if combined > best_score:
                                best_score = combined
                                best = r

                        artwork_url = best.get('artworkUrl100', '')
                        if artwork_url:
                            # Upgrade to 1000x1000 HD artwork
                            artwork_url = artwork_url.replace('100x100bb.jpg', '1000x1000bb.jpg').replace('100x100bb.png', '1000x1000bb.png')

                        track_name = best.get('trackName', '')
                        collaborators = []
                        if ' feat. ' in track_name or ' featuring ' in track_name:
                            collab_str = track_name.split(' feat. ')[-1] if ' feat. ' in track_name else track_name.split(' featuring ')[-1]
                            collaborators = [c.strip() for c in collab_str.split(', ')] if collab_str else []

                        return {
                            'title': best.get('trackName'),
                            'artist': best.get('artistName'),
                            'album': best.get('collectionName'),
                            'year': best.get('releaseDate', '')[:4],
                            'genre': best.get('primaryGenreName'),
                            'artwork_url': artwork_url,
                            'collaborators': collaborators,
                            'match_score': best_score,
                        }
                    # If empty results, break retry attempt and try next fallback query
                    break
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504):
                    backoff = 1.5 * (attempt + 1)
                    time.sleep(backoff)
                    continue
                break
            except Exception:
                time.sleep(0.5)
                continue
    return None

def process_file(file_path: str, upgrade_artwork: bool = True, force: bool = False) -> Tuple[str, str, str]:
    """
    Process a single MP3 file. Returns (status, filename, details).
    Status is one of: 'updated', 'skipped_enriched', 'skipped_no_match', 'skipped_fuzzy', 'failed'
    """
    filename = os.path.basename(file_path)
    clean_title = clean_song_name(filename)
    current_artist = "Unknown Artist"

    try:
        audio = ID3(file_path)
    except ID3NoHeaderError:
        audio = ID3()
    except Exception as e:
        add_to_report("failed", {"file": filename, "reason": f"Failed to read ID3: {e}"})
        return 'failed', filename, f"Failed to read ID3: {e}"

    # Extract existing artist if present
    if 'TPE1' in audio and audio['TPE1'].text:
        current_artist = str(audio['TPE1'].text[0])

    # Smart Skip: check if already enriched (unless --force is used)
    if not force and is_already_enriched(audio):
        add_to_report("skipped_already_enriched", {"file": filename, "artist": current_artist, "title": clean_title})
        return 'skipped_enriched', filename, "Already enriched (album + year + genre + HD art)"

    # Query iTunes for official studio metadata
    meta = fetch_itunes_metadata(current_artist, clean_title)

    if not meta:
        add_to_report("skipped_no_match", {"file": filename, "artist": current_artist, "title": clean_title})
        return 'skipped_no_match', filename, "No iTunes match found"

    # Fuzzy Match Validation: verify the result actually matches this song
    title_similarity = fuzzy_match(clean_title, meta.get('title', ''))
    base_title = re.sub(r'[\(\[\{].*?[\)\]\}]', '', clean_title).strip()
    base_similarity = fuzzy_match(base_title, meta.get('title', '')) if base_title != clean_title else 0.0
    match_score = meta.get('match_score', 0.0)
    effective_score = max(title_similarity, base_similarity, match_score)

    if effective_score < FUZZY_THRESHOLD:
        add_to_report("skipped_fuzzy_reject", {
            "file": filename,
            "local_title": clean_title,
            "itunes_title": meta.get('title', ''),
            "itunes_artist": meta.get('artist', ''),
            "title_similarity": round(title_similarity, 2),
            "match_score": round(match_score, 2)
        })
        return 'skipped_fuzzy', filename, f"Fuzzy rejected: \"{meta.get('title')}\" by {meta.get('artist')} (score: {effective_score:.0%})"

    try:
        # Update Title, Artist, Album, Year, Genre using standard ID3v2.3 UTF-16
        if meta.get('title'):
            audio.add(TIT2(encoding=1, text=meta['title']))
        if meta.get('artist'):
            audio.add(TPE1(encoding=1, text=meta['artist']))
            audio.add(TPE2(encoding=1, text=meta['artist']))  # Album Artist for Windows Explorer & macOS Finder
        if meta.get('album'):
            audio.add(TALB(encoding=1, text=meta['album']))
        if meta.get('year') and str(meta['year']).isdigit():
            clean_year = str(meta['year'])[:4]
            audio.add(TDRC(encoding=1, text=clean_year))
            audio.add(TYER(encoding=1, text=clean_year))
        if meta.get('genre'):
            audio.add(TCON(encoding=1, text=meta['genre']))

        img_data = None
        # Upgrade artwork to 1000x1000 HD baseline JPEG
        if upgrade_artwork and meta.get('artwork_url'):
            try:
                req = urllib.request.Request(meta['artwork_url'], headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'})
                with safe_urlopen(req, timeout=8) as resp:
                    raw_data = resp.read()
                    import io
                    from PIL import Image
                    try:
                        pil_img = Image.open(io.BytesIO(raw_data)).convert('RGB')
                        pil_img.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
                        buf = io.BytesIO()
                        pil_img.save(buf, format='JPEG', quality=95, progressive=False)
                        img_data = buf.getvalue()
                    except Exception:
                        img_data = raw_data

                    audio.delall('APIC')
                    audio.add(APIC(
                        encoding=0,
                        mime="image/jpeg",
                        type=3,
                        desc="",
                        data=img_data
                    ))
            except Exception:
                pass

        audio.save(file_path, v2_version=3, v1=2)

        if img_data:
            set_macos_finder_icon(file_path, img_data)

        details = f"{meta.get('album', '')} ({meta.get('year', '')}) [{meta.get('genre', '')}] — match: {effective_score:.0%}"
        add_to_report("updated", {
            "file": filename,
            "title": meta.get('title'),
            "artist": meta.get('artist'),
            "album": meta.get('album'),
            "year": meta.get('year'),
            "genre": meta.get('genre'),
            "title_similarity": round(title_similarity, 2),
            "match_score": round(match_score, 2)
        })
        return 'updated', filename, details

    except Exception as e:
        add_to_report("failed", {"file": filename, "reason": f"Error saving tags: {e}"})
        return 'failed', filename, f"Error saving tags: {e}"

def enrich_folder(folder_path: str, threads: int = DEFAULT_THREADS, upgrade_artwork: bool = True, force: bool = False, retry_unmatched: bool = False):
    global report_data
    report_data = {"updated": [], "skipped_already_enriched": [], "skipped_no_match": [], "skipped_fuzzy_reject": [], "failed": []}

    if not os.path.isdir(folder_path):
        log(f"❌ Folder not found: {folder_path}", Colors.RED)
        return

    mp3_files = [
        os.path.join(folder_path, f)
        for f in os.listdir(folder_path)
        if f.endswith('.mp3') and not f.startswith('.')
    ]

    if retry_unmatched:
        report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "enrichment_report.json")
        if os.path.isfile(report_path):
            try:
                with open(report_path, 'r', encoding='utf-8') as f:
                    old_data = json.load(f)
                unmatched_names = {item['file'] for item in old_data.get('skipped_no_match', [])}
                mp3_files = [f for f in mp3_files if os.path.basename(f) in unmatched_names]
                log(f"🎯 Target: {len(mp3_files)} previously unmatched files from report.", Colors.CYAN)
            except Exception as e:
                log(f"⚠️ Could not parse previous report: {e}", Colors.YELLOW)

    total_files = len(mp3_files)
    if total_files == 0:
        log(f"❌ No MP3 files found in {folder_path}", Colors.RED)
        return

    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}✨  Audio Metadata & HD Cover Art Enricher v2  ✨{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"📁 Target Folder:  {Colors.YELLOW}{folder_path}{Colors.RESET}")
    log(f"🔢 Total Songs:    {Colors.BOLD}{total_files}{Colors.RESET}")
    log(f"⚡ Threads:        {Colors.CYAN}{threads}{Colors.RESET} | HD Artwork: {Colors.GREEN}{upgrade_artwork}{Colors.RESET} | Force: {Colors.YELLOW}{force}{Colors.RESET}")
    log(f"🛡️  Smart Skip:     {Colors.GREEN}ON{Colors.RESET} (skips already-enriched songs)")
    log(f"🎯 Fuzzy Match:    {Colors.GREEN}ON{Colors.RESET} (threshold: {FUZZY_THRESHOLD:.0%})")
    log(f"🔍 Enriching album names, release years, genres & artwork...\n", Colors.DIM)

    start_time = time.time()
    updated_count = 0
    skipped_enriched_count = 0
    skipped_no_match_count = 0
    skipped_fuzzy_count = 0
    failed_count = 0

    with ThreadPoolExecutor(max_workers=threads) as executor:
        future_to_file = {
            executor.submit(process_file, f, upgrade_artwork, force): f
            for f in mp3_files
        }

        for idx, future in enumerate(as_completed(future_to_file), 1):
            status, filename, details = future.result()
            progress = f"[{idx}/{total_files}] ({int(idx/total_files*100)}%)"

            if status == 'updated':
                updated_count += 1
                log(f"{Colors.GREEN}✅ {progress} {filename} ➔ {details}{Colors.RESET}")
            elif status == 'skipped_enriched':
                skipped_enriched_count += 1
                log(f"{Colors.DIM}⏩ {progress} {filename} ➔ {details}{Colors.RESET}")
            elif status == 'skipped_no_match':
                skipped_no_match_count += 1
                log(f"{Colors.YELLOW}⚠️  {progress} {filename} ➔ {details}{Colors.RESET}")
            elif status == 'skipped_fuzzy':
                skipped_fuzzy_count += 1
                log(f"{Colors.RED}🎯 {progress} {filename} ➔ {details}{Colors.RESET}")
            else:
                failed_count += 1
                log(f"{Colors.RED}❌ {progress} {filename} ➔ {details}{Colors.RESET}")

    elapsed = round(time.time() - start_time, 1)

    # Save enrichment report
    report_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "enrichment_report.json")
    report_data["summary"] = {
        "total_files": total_files,
        "updated": updated_count,
        "skipped_already_enriched": skipped_enriched_count,
        "skipped_no_match": skipped_no_match_count,
        "skipped_fuzzy_reject": skipped_fuzzy_count,
        "failed": failed_count,
        "elapsed_seconds": elapsed,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)

    log(f"\n{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}")
    log(f"{Colors.BOLD}{Colors.GREEN}✨ Metadata Enrichment Complete!{Colors.RESET}")
    log(f"⏱️  Time Elapsed:          {elapsed}s")
    log(f"✅ Successfully Updated:   {Colors.GREEN}{updated_count}{Colors.RESET}")
    log(f"⏩ Skipped (enriched):     {Colors.DIM}{skipped_enriched_count}{Colors.RESET}")
    log(f"⚠️  Skipped (no match):     {Colors.YELLOW}{skipped_no_match_count}{Colors.RESET}")
    log(f"🎯 Skipped (fuzzy reject): {Colors.RED}{skipped_fuzzy_count}{Colors.RESET}")
    log(f"❌ Failed:                 {Colors.RED}{failed_count}{Colors.RESET}")
    log(f"📋 Report saved:           {Colors.CYAN}{report_path}{Colors.RESET}")
    log(f"📂 Folder:                 {folder_path}")
    log(f"{Colors.BOLD}{Colors.CYAN}======================================================{Colors.RESET}\n")

def main():
    parser = argparse.ArgumentParser(
        description="Enrich MP3 metadata with official studio Album, Release Year, Genre, and 1000x1000 HD Cover Art"
    )
    parser.add_argument("--folder", "-f", default=DEFAULT_SONGS_FOLDER, help="Path to Songs directory")
    parser.add_argument("--threads", "-t", type=int, default=DEFAULT_THREADS, help="Number of worker threads (default: 4)")
    parser.add_argument("--no-art", action="store_true", help="Skip updating cover art (only update text tags)")
    parser.add_argument("--force", action="store_true", help="Force re-enrich all songs, even already enriched ones")
    parser.add_argument("--retry-unmatched", "-r", action="store_true", help="Only retry songs that were skipped as 'no match' in previous run")

    args = parser.parse_args()

    enrich_folder(
        folder_path=args.folder,
        threads=args.threads,
        upgrade_artwork=not args.no_art,
        force=args.force,
        retry_unmatched=args.retry_unmatched
    )

if __name__ == "__main__":
    main()

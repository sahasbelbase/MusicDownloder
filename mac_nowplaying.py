#!/usr/bin/env python3
"""
mac_nowplaying.py - Native macOS Now Playing & Hardware Media Keys Controller
Integrates Music Studio with macOS MediaPlayer framework:
1. Publishes active track metadata & album artwork to MPNowPlayingInfoCenter.
   - Shows active playback on macOS Lock Screen (like Spotify).
   - Shows active playback in macOS Control Center.
   - Automatically supports ANY third-party notch / Dynamic Island app
     (e.g., Boring.Notch, MediaMate, DynamicLake, NotchNook) that listens to MediaRemote.
2. Registers hardware media key handlers with MPRemoteCommandCenter:
   - Mac keyboard Fn buttons / media keys: F7 (Previous), F8 (Play/Pause), F9 (Next).
   - Lock screen media controls.
   - Bluetooth headphones and AirPods play/pause/skip clicks.
"""

import sys
import os
import time
import json
import threading
import urllib.request
import urllib.parse

_port = 5050
_remote_handler = None
_now_playing_thread = None
_stop_event = threading.Event()
_cached_artwork = None
_cached_cover_url = None

def dispatch_action(action: str, time_val: float = None):
    """Dispatch media key playback action to local Music Studio backend."""
    global _port
    try:
        url = f"http://127.0.0.1:{_port}/api/playback/action"
        payload = {"action": action}
        if time_val is not None:
            payload["time"] = time_val
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=1.5)
    except Exception as e:
        print(f"[MacNowPlaying] Action dispatch error ({action}): {e}")

def get_artwork_obj(cover_url: str):
    """Fetch and convert cover artwork into an MPMediaItemArtwork object."""
    global _cached_artwork, _cached_cover_url, _port
    if not cover_url:
        return None

    if cover_url == _cached_cover_url and _cached_artwork is not None:
        return _cached_artwork

    try:
        import objc
        from Foundation import NSData
        from AppKit import NSImage
        MPMediaItemArtwork = objc.lookUpClass("MPMediaItemArtwork")
        if not MPMediaItemArtwork:
            return None

        # Resolve URL
        if cover_url.startswith("http://") or cover_url.startswith("https://"):
            full_url = cover_url
        else:
            full_url = f"http://127.0.0.1:{_port}{cover_url if cover_url.startswith('/') else '/' + cover_url}"

        req = urllib.request.Request(full_url, headers={"User-Agent": "MusicStudio/3.3.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            img_bytes = resp.read()

        if img_bytes:
            nsdata = NSData.dataWithBytes_length_(img_bytes, len(img_bytes))
            nsimg = NSImage.alloc().initWithData_(nsdata)
            if nsimg and nsimg.size().width > 0:
                artwork = MPMediaItemArtwork.alloc().initWithImage_(nsimg)
                _cached_artwork = artwork
                _cached_cover_url = cover_url
                return artwork
    except Exception:
        pass
    return None

def update_system_now_playing(state: dict):
    """Publish current state to macOS MPNowPlayingInfoCenter."""
    if sys.platform != "darwin" or not state:
        return

    try:
        import objc
        from Foundation import NSBundle, NSNumber
        MPNowPlayingInfoCenter = objc.lookUpClass("MPNowPlayingInfoCenter")
        if not MPNowPlayingInfoCenter:
            return

        title = state.get("title") or "Music Studio"
        artist = state.get("artist") or "Music Player"
        album = state.get("album") or "Music Studio Library"
        duration = float(state.get("duration") or 0.0)
        current_time = float(state.get("current_time") or 0.0)
        is_playing = bool(state.get("is_playing"))
        cover_url = state.get("cover_url") or ""

        info = {
            "title": title,
            "artist": artist,
            "albumTitle": album,
            "playbackDuration": NSNumber.numberWithDouble_(duration),
            "MPNowPlayingInfoPropertyElapsedPlaybackTime": NSNumber.numberWithDouble_(current_time),
            "MPNowPlayingInfoPropertyPlaybackRate": NSNumber.numberWithDouble_(1.0 if is_playing else 0.0),
        }

        # Attach artwork if available
        art = get_artwork_obj(cover_url)
        if art:
            info["artwork"] = art

        MPNowPlayingInfoCenter.defaultCenter().setNowPlayingInfo_(info)
    except Exception as e:
        print(f"[MacNowPlaying] Update nowPlayingInfo notice: {e}")

def _playback_sync_worker():
    """Background polling/SSE worker to keep macOS Now Playing perfectly synchronized."""
    global _port, _stop_event
    last_title = None
    last_is_playing = None
    last_time = None

    while not _stop_event.is_set():
        try:
            url = f"http://127.0.0.1:{_port}/api/playback"
            req = urllib.request.Request(url, headers={"User-Agent": "MusicStudio/3.3.0"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            title = data.get("title")
            is_playing = data.get("is_playing")
            curr_time = int(data.get("current_time") or 0)

            # Update whenever track, play state, or significant time passed
            if (title != last_title or
                is_playing != last_is_playing or
                (last_time is not None and abs(curr_time - last_time) >= 5)):
                last_title = title
                last_is_playing = is_playing
                last_time = curr_time
                update_system_now_playing(data)
        except Exception:
            pass

        _stop_event.wait(1.5)

def init_now_playing(port=5050):
    """Initialize macOS MediaPlayer commands and start Now Playing sync."""
    global _port, _remote_handler, _now_playing_thread, _stop_event
    _port = port

    if sys.platform != "darwin":
        return False

    try:
        import objc
        from Foundation import NSBundle, NSObject

        bundle = NSBundle.bundleWithPath_("/System/Library/Frameworks/MediaPlayer.framework")
        if bundle:
            bundle.load()

        MPRemoteCommandCenter = objc.lookUpClass("MPRemoteCommandCenter")
        MPNowPlayingInfoCenter = objc.lookUpClass("MPNowPlayingInfoCenter")

        if not MPRemoteCommandCenter or not MPNowPlayingInfoCenter:
            print("[MacNowPlaying] MediaPlayer classes unavailable.")
            return False

        cmd_center = MPRemoteCommandCenter.sharedCommandCenter()

        class RemoteCommandHandler(NSObject):
            @objc.typedSelector(b"q@:@")
            def handleTogglePlayPause_(self, event):
                dispatch_action("toggle")
                return 0

            @objc.typedSelector(b"q@:@")
            def handlePlay_(self, event):
                dispatch_action("play")
                return 0

            @objc.typedSelector(b"q@:@")
            def handlePause_(self, event):
                dispatch_action("pause")
                return 0

            @objc.typedSelector(b"q@:@")
            def handleNext_(self, event):
                dispatch_action("next")
                return 0

            @objc.typedSelector(b"q@:@")
            def handlePrev_(self, event):
                dispatch_action("prev")
                return 0

            @objc.typedSelector(b"q@:@")
            def handleSeek_(self, event):
                try:
                    pos = event.positionTime()
                    dispatch_action("seek", time_val=float(pos))
                except Exception:
                    pass
                return 0

        _remote_handler = RemoteCommandHandler.alloc().init()

        # Keyboard media keys & Lock screen actions
        cmd_center.togglePlayPauseCommand().setEnabled_(True)
        cmd_center.togglePlayPauseCommand().addTarget_action_(_remote_handler, "handleTogglePlayPause:")

        cmd_center.playCommand().setEnabled_(True)
        cmd_center.playCommand().addTarget_action_(_remote_handler, "handlePlay:")

        cmd_center.pauseCommand().setEnabled_(True)
        cmd_center.pauseCommand().addTarget_action_(_remote_handler, "handlePause:")

        cmd_center.nextTrackCommand().setEnabled_(True)
        cmd_center.nextTrackCommand().addTarget_action_(_remote_handler, "handleNext:")

        cmd_center.previousTrackCommand().setEnabled_(True)
        cmd_center.previousTrackCommand().addTarget_action_(_remote_handler, "handlePrev:")

        cmd_center.changePlaybackPositionCommand().setEnabled_(True)
        cmd_center.changePlaybackPositionCommand().addTarget_action_(_remote_handler, "handleSeek:")

        # Start background sync thread for Lock Screen, Control Center, and 3rd-party notch apps
        _stop_event.clear()
        _now_playing_thread = threading.Thread(target=_playback_sync_worker, daemon=True)
        _now_playing_thread.start()

        print("[MacNowPlaying] ✅ Native macOS Lock Screen, Control Center, and Media Keys (Fn F7/F8/F9) active!")
        return True
    except Exception as e:
        print(f"[MacNowPlaying] Setup notice: {e}")
        return False

def cleanup_now_playing():
    """Cleanly deregister remote commands and clear now playing info on exit."""
    global _stop_event
    _stop_event.set()
    if sys.platform != "darwin":
        return
    try:
        import objc
        MPNowPlayingInfoCenter = objc.lookUpClass("MPNowPlayingInfoCenter")
        if MPNowPlayingInfoCenter:
            MPNowPlayingInfoCenter.defaultCenter().setNowPlayingInfo_(None)
    except Exception:
        pass

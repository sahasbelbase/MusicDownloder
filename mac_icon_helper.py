#!/usr/bin/env python3
"""
mac_icon_helper.py - Thread-safe macOS Finder icon attachment
Uses AppKit and NSWorkspace to attach cover art directly to audio files in macOS Finder.
Protects calls with a process-wide mutex lock and autorelease pool to prevent
CarbonCore Resource Manager race conditions and segmentation faults.
"""

import sys
import os
import threading

# Process-wide lock to serialize NSWorkspace.setIcon_forFile_options_ calls
# Apple's CarbonCore / Resource Manager underlying setIcon is NOT thread-safe.
# Concurrent calls from multiple background worker threads will corrupt memory and crash with SIGSEGV.
_macos_icon_lock = threading.Lock()

def set_macos_finder_icon(file_path: str, image_data: bytes) -> bool:
    """
    Set native macOS Finder file icon on the audio file using AppKit safely.
    Serialized across all threads to prevent CarbonCore crashes.
    """
    if sys.platform != "darwin":
        return False

    if not file_path or not os.path.isfile(file_path):
        return False

    if not image_data or not isinstance(image_data, (bytes, bytearray)) or len(image_data) == 0:
        return False

    # Acquire lock so only one thread executes NSWorkspace icon operations at any moment
    with _macos_icon_lock:
        try:
            import objc
            from AppKit import NSWorkspace, NSImage, NSData

            with objc.autorelease_pool():
                nsdata = NSData.dataWithBytes_length_(image_data, len(image_data))
                if not nsdata:
                    return False

                img = NSImage.alloc().initWithData_(nsdata)
                if not img:
                    return False

                # Verify image size is valid
                size = img.size()
                if size.width <= 0 or size.height <= 0:
                    return False

                workspace = NSWorkspace.sharedWorkspace()
                if not workspace:
                    return False

                # 0 = default options
                return bool(workspace.setIcon_forFile_options_(img, file_path, 0))
        except Exception:
            # Never let icon failure crash or abort downloading/tagging
            return False

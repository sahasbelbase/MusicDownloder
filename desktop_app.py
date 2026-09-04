#!/usr/bin/env python3
"""
Music Studio - Standalone Desktop Launcher
Runs the local FastAPI backend server and displays a native desktop window.
"""

import sys
import os
import time
import socket
import threading
import webbrowser

# Add app directory to sys.path
BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import uvicorn
from app import app, SONGS_DIR

def find_available_port(default_port=5050):
    """Check if default port is free, or pick an available one."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', default_port)) != 0:
            return default_port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

class ServerThread(threading.Thread):
    def __init__(self, port):
        super().__init__(daemon=True)
        self.port = port
        config = uvicorn.Config(
            app=app,
            host="127.0.0.1",
            port=self.port,
            log_level="warning",
            loop="asyncio"
        )
        self.server = uvicorn.Server(config=config)

    def run(self):
        self.server.run()

    def stop(self):
        self.server.should_exit = True

def wait_for_server(port, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.5)
                if s.connect_ex(('127.0.0.1', port)) == 0:
                    return True
        except Exception:
            pass
        time.sleep(0.1)
    return False

def main():
    port = find_available_port(5050)
    server_thread = ServerThread(port)
    server_thread.start()

    if not wait_for_server(port):
        print(f"Error: Music Studio server failed to start on port {port}")
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"
    print(f"🚀 Music Studio running at {url}")
    print(f"📁 Local music library: {SONGS_DIR}")

    # Check if GUI webview is available
    use_webview = True
    if "--browser" in sys.argv:
        use_webview = False

    if use_webview:
        try:
            import webview
            print("Opening native desktop window...")
            window = webview.create_window(
                title="Music Studio",
                url=url,
                width=1280,
                height=840,
                min_size=(380, 600),
                background_color="#0b0e14",
                text_select=True
            )
            webview.start(debug=False)
        except Exception as e:
            print(f"Webview note: {e}. Falling back to default web browser.")
            webbrowser.open(url)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
    else:
        webbrowser.open(url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    print("Shutting down Music Studio...")
    server_thread.stop()

if __name__ == "__main__":
    main()

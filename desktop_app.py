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

def get_log_dir() -> str:
    """Return OS-appropriate log directory."""
    if sys.platform == "win32":
        base = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA") or os.path.expanduser("~")
        path = os.path.join(base, "MusicStudio", "Logs")
    elif sys.platform == "darwin":
        path = os.path.expanduser("~/Library/Logs/MusicStudio")
    else:
        base = os.environ.get("XDG_DATA_HOME") or os.path.expanduser("~/.local/share")
        path = os.path.join(base, "MusicStudio", "logs")

    try:
        os.makedirs(path, exist_ok=True)
        return path
    except Exception:
        fallback = os.path.join(BASE_DIR, "logs")
        try:
            os.makedirs(fallback, exist_ok=True)
            return fallback
        except Exception:
            return BASE_DIR

def show_error_dialog(title: str, message: str):
    """Display a native error dialog so crashes are never silent on any OS."""
    try:
        if sys.__stderr__:
            sys.__stderr__.write(f"[{title}] {message}\n")
            sys.__stderr__.flush()
    except Exception:
        pass

    if sys.platform == "win32":
        try:
            import ctypes
            # MB_ICONERROR (0x10) | MB_OK (0x0) | MB_SYSTEMMODAL (0x1000)
            ctypes.windll.user32.MessageBoxW(0, message, title, 0x10 | 0x1000)
            return
        except Exception:
            pass
    elif sys.platform == "darwin":
        try:
            import subprocess
            escaped_msg = message.replace('\\', '\\\\').replace('"', '\\"')
            escaped_title = title.replace('\\', '\\\\').replace('"', '\\"')
            subprocess.run([
                "osascript", "-e",
                f'display alert "{escaped_title}" message "{escaped_msg}" as critical'
            ], timeout=5)
            return
        except Exception:
            pass
    elif sys.platform.startswith("linux"):
        try:
            import subprocess
            subprocess.run(["zenity", "--error", f"--text={message}", f"--title={title}"], timeout=5)
            return
        except Exception:
            pass

class TeeLogger:
    def __init__(self, stream, file_path):
        self.stream = stream
        try:
            self.file = open(file_path, "a", encoding="utf-8")
        except Exception:
            self.file = None

    def write(self, data):
        if self.stream:
            try:
                self.stream.write(data)
                self.stream.flush()
            except Exception:
                pass
        if self.file:
            try:
                self.file.write(data)
                self.file.flush()
            except Exception:
                pass

    def flush(self):
        if self.stream:
            try:
                self.stream.flush()
            except Exception:
                pass
        if self.file:
            try:
                self.file.flush()
            except Exception:
                pass

# Setup safe logging for windowed mode
log_dir = get_log_dir()
log_file = os.path.join(log_dir, "desktop_app.log")
try:
    if sys.stdout is not None:
        sys.stdout = TeeLogger(sys.stdout, log_file)
    else:
        sys.stdout = open(log_file, "a", encoding="utf-8")
    if sys.stderr is not None:
        sys.stderr = TeeLogger(sys.stderr, log_file)
    else:
        sys.stderr = open(log_file, "a", encoding="utf-8")
except Exception:
    if sys.stdout is None:
        sys.stdout = open(os.devnull, 'w')
    if sys.stderr is None:
        sys.stderr = open(os.devnull, 'w')

# Guarded top-level imports with native graphical error dialog
try:
    import uvicorn
    import ssl_helper  # Configure CA certificates & SSL bypass globally
    from app import app, SONGS_DIR
except Exception as err:
    import traceback
    tb = traceback.format_exc()
    startup_err_file = os.path.join(log_dir, "startup_error.log")
    try:
        with open(startup_err_file, "w", encoding="utf-8") as f:
            f.write(tb)
    except Exception:
        pass

    missing_hint = ""
    err_str = str(err)
    if "No module named" in err_str or isinstance(err, ModuleNotFoundError):
        missing_module = err_str.split("No module named")[-1].strip(" '\"")
        missing_hint = (
            f"\n\nMissing Python module: {missing_module}\n"
            f"To fix this automatically, run MusicStudio.bat or install dependencies:\n"
            f"  python -m pip install -r requirements.txt"
        )

    diag_msg = (
        f"Music Studio encountered a startup error:\n\n"
        f"{err_str}{missing_hint}\n\n"
        f"Detailed log saved to:\n{startup_err_file}"
    )
    show_error_dialog("Music Studio — Startup Error", diag_msg)
    sys.exit(1)

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
        err_msg = f"Music Studio server failed to start on port {port} within 10 seconds."
        print(f"Error: {err_msg}")
        show_error_dialog("Music Studio Server Error", err_msg)
        sys.exit(1)

    url = f"http://127.0.0.1:{port}"
    print(f"🚀 Music Studio running at {url}")
    print(f"📁 Local music library: {SONGS_DIR}")

    # Check if GUI webview is available
    use_webview = True
    if "--browser" in sys.argv:
        use_webview = False

    def on_gui_ready():
        if sys.platform == "darwin":
            try:
                import mac_nowplaying
                from PyObjCTools import AppHelper
                AppHelper.callAfter(mac_nowplaying.init_now_playing, port)
            except Exception as e:
                print(f"[DesktopApp] Mac NowPlaying notice: {e}")

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

            # Background mode like Spotify: closing the window hides it so audio continues playing
            if sys.platform == "darwin":
                def on_closing():
                    try:
                        window.hide()
                        return False
                    except Exception:
                        return True
                window.events.closing += on_closing

                try:
                    from AppKit import NSApplication
                    from Foundation import NSObject
                    class AppReopenDelegate(NSObject):
                        def applicationShouldHandleReopen_hasVisibleWindows_(self, app, flag):
                            try:
                                window.show()
                                window.restore()
                            except Exception:
                                pass
                            return True
                    _dock_delegate = AppReopenDelegate.alloc().init()
                    NSApplication.sharedApplication().setDelegate_(_dock_delegate)
                except Exception:
                    pass

            webview.start(on_gui_ready, debug=False)
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
    try:
        main()
    except Exception as e:
        import traceback
        err_text = traceback.format_exc()
        crash_log = os.path.join(log_dir, "crash.log")
        try:
            with open(crash_log, "w", encoding="utf-8") as f:
                f.write(err_text)
        except Exception:
            pass
        show_error_dialog("Music Studio — Crash", f"An unexpected error occurred:\n\n{str(e)}\n\nCrash log saved to:\n{crash_log}")
        sys.exit(1)

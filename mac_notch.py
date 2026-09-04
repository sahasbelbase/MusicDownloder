#!/usr/bin/env python3
"""
mac_notch.py - macOS Hardware Notch Floating HUD Controller
Attaches a floating, borderless AppKit panel directly underneath the MacBook physical camera notch.
Expands on hover into a music playback HUD and collapses when the mouse leaves.
Strictly disabled on non-notched Macs and external displays.
"""

import sys
import os

def has_hardware_notch() -> bool:
    """Return True only if running on macOS on a display with a physical camera notch."""
    if sys.platform != "darwin":
        return False
    try:
        from AppKit import NSScreen
        screen = NSScreen.mainScreen()
        if not screen:
            return False
        safe_area = getattr(screen, "safeAreaInsets", None)
        if not safe_area:
            return False
        top = screen.safeAreaInsets().top
        return bool(top and top > 0)
    except Exception:
        return False

class MacNotchController:
    def __init__(self, port=5050):
        self.port = port
        self.panel = None
        self.webview = None
        self.is_expanded = False
        self.collapsed_frame = None
        self.expanded_frame = None

    def setup(self):
        if not has_hardware_notch():
            print("[MacNotch] No physical hardware notch detected. Controller safely disabled.")
            return False

        try:
            import objc
            from Foundation import NSObject, NSURL, NSURLRequest
            from AppKit import (
                NSApplication, NSPanel, NSWindowStyleMaskBorderless,
                NSWindowStyleMaskNonactivatingPanel, NSBackingStoreBuffered,
                NSColor, NSStatusWindowLevel,
                NSWindowCollectionBehaviorCanJoinAllSpaces,
                NSWindowCollectionBehaviorFullScreenAuxiliary,
                NSWindowCollectionBehaviorStationary, NSScreen, NSMakeRect,
                NSView, NSTrackingArea, NSTrackingMouseEnteredAndExited,
                NSTrackingActiveAlways, NSTrackingInVisibleRect
            )
            from WebKit import (
                WKWebView, WKWebViewConfiguration, WKUserContentController
            )

            screen = NSScreen.mainScreen()
            screen_frame = screen.frame()
            screen_w = screen_frame.size.width
            screen_h = screen_frame.size.height
            notch_top = screen.safeAreaInsets().top or 38.0

            # Calculate physical notch position from auxiliary areas
            aux_l = getattr(screen, "auxiliaryTopLeftArea", None)
            aux_r = getattr(screen, "auxiliaryTopRightArea", None)
            if aux_l and aux_r:
                left_r = aux_l()
                right_r = aux_r()
                notch_w = max(220.0, right_r.origin.x - (left_r.origin.x + left_r.size.width))
                center_x = (left_r.origin.x + left_r.size.width + right_r.origin.x) / 2.0
            else:
                notch_w = 230.0
                center_x = screen_w / 2.0

            collapsed_w = notch_w
            collapsed_h = notch_top
            self.collapsed_frame = NSMakeRect(center_x - collapsed_w / 2.0, screen_h - collapsed_h, collapsed_w, collapsed_h)

            expanded_w = 440.0
            expanded_h = 108.0
            self.expanded_frame = NSMakeRect(center_x - expanded_w / 2.0, screen_h - expanded_h, expanded_w, expanded_h)

            # Create Floating Borderless Panel sitting directly at camera notch
            style = NSWindowStyleMaskBorderless | NSWindowStyleMaskNonactivatingPanel
            self.panel = NSPanel.alloc().initWithContentRect_styleMask_backing_defer_(
                self.collapsed_frame,
                style,
                NSBackingStoreBuffered,
                False
            )
            self.panel.setLevel_(NSStatusWindowLevel + 3)
            self.panel.setCollectionBehavior_(
                NSWindowCollectionBehaviorCanJoinAllSpaces |
                NSWindowCollectionBehaviorFullScreenAuxiliary |
                NSWindowCollectionBehaviorStationary
            )
            self.panel.setOpaque_(False)
            self.panel.setBackgroundColor_(NSColor.clearColor())
            self.panel.setHasShadow_(False)
            self.panel.setIgnoresMouseEvents_(False)

            # Host View with mouse tracking
            controller_ref = self
            class NotchTrackingView(NSView):
                def mouseEntered_(self, event):
                    controller_ref.expand()

                def mouseExited_(self, event):
                    controller_ref.collapse()

            hosting_view = NotchTrackingView.alloc().initWithFrame_(NSMakeRect(0, 0, collapsed_w, collapsed_h))
            options = NSTrackingMouseEnteredAndExited | NSTrackingActiveAlways | NSTrackingInVisibleRect
            tracking = NSTrackingArea.alloc().initWithRect_options_owner_userInfo_(
                hosting_view.bounds(), options, hosting_view, None
            )
            hosting_view.addTrackingArea_(tracking)

            # WebKit Script Handler for hover and clicks
            class ScriptHandler(NSObject):
                def userContentController_didReceiveScriptMessage_(self, ucc, msg):
                    body = str(msg.body())
                    if body == "expand":
                        controller_ref.expand()
                    elif body == "collapse":
                        controller_ref.collapse()

            ucc = WKUserContentController.alloc().init()
            handler = ScriptHandler.alloc().init()
            ucc.addScriptMessageHandler_name_(handler, "notch")

            config = WKWebViewConfiguration.alloc().init()
            config.setUserContentController_(ucc)

            self.webview = WKWebView.alloc().initWithFrame_configuration_(
                hosting_view.bounds(), config
            )
            self.webview.setValue_forKey_(False, "drawsBackground")
            self.webview.setAutoresizingMask_(18)  # NSViewWidthSizable | NSViewHeightSizable

            hosting_view.addSubview_(self.webview)
            self.panel.setContentView_(hosting_view)

            # Load notch_hud.html
            hud_url = NSURL.URLWithString_(f"http://127.0.0.1:{self.port}/notch_hud")
            req = NSURLRequest.requestWithURL_(hud_url)
            self.webview.loadRequest_(req)

            self.panel.orderFrontRegardless()
            print(f"[MacNotch] Attached floating HUD to physical Mac hardware notch (width: {notch_w:.1f}pt, height: {notch_top:.1f}pt).")
            return True
        except Exception as e:
            print(f"[MacNotch] Initialization notice: {e}")
            return False

    def expand(self):
        if self.is_expanded or not self.panel:
            return
        self.is_expanded = True
        self.panel.animator().setFrame_display_(self.expanded_frame, True)
        self.panel.setHasShadow_(True)

    def collapse(self):
        if not self.is_expanded or not self.panel:
            return
        self.is_expanded = False
        self.panel.animator().setFrame_display_(self.collapsed_frame, True)
        self.panel.setHasShadow_(False)

notch_instance = None

def init_mac_notch(port=5050):
    global notch_instance
    if sys.platform != "darwin":
        return None
    notch_instance = MacNotchController(port=port)
    success = notch_instance.setup()
    return notch_instance if success else None

if __name__ == "__main__":
    from AppKit import NSApplication
    app = NSApplication.sharedApplication()
    init_mac_notch(5050)
    print("Mac Notch running... press Ctrl+C to exit")
    app.run()

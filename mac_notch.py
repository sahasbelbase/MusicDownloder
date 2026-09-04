#!/usr/bin/env python3
"""
mac_notch.py - macOS Hardware Notch Floating Dynamic Island Controller
Attaches a floating, borderless AppKit panel directly beneath the MacBook physical camera notch.
In collapsed mode, a mini status pill sits cleanly underneath the camera notch without being obscured.
Expands on hover into a full Dynamic Island music controller with debounced hysteresis (no jitter/shaking).
Strictly disabled on non-notched Macs and external displays.
"""

import sys
import os
import threading

def get_notched_screen():
    """Find and return the NSScreen that has a physical hardware camera notch, or None."""
    if sys.platform != "darwin":
        return None
    try:
        from AppKit import NSScreen
        for s in NSScreen.screens():
            top = s.safeAreaInsets().top
            if top and top > 0:
                return s
    except Exception:
        pass
    return None

def has_hardware_notch() -> bool:
    """Return True only if running on macOS on a display with a physical camera notch."""
    return get_notched_screen() is not None

class MacNotchController:
    def __init__(self, port=5050):
        self.port = port
        self.panel = None
        self.webview = None
        self.is_expanded = False
        self.collapsed_frame = None
        self.expanded_frame = None
        self._collapse_timer = None

    def _cancel_collapse_timer(self):
        if self._collapse_timer:
            try:
                self._collapse_timer.cancel()
            except Exception:
                pass
            self._collapse_timer = None

    def setup(self):
        screen = get_notched_screen()
        if not screen:
            print("[MacNotch] No physical hardware notch detected on display. Controller safely disabled.")
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
                NSTrackingMouseMoved, NSTrackingActiveAlways, NSTrackingInVisibleRect,
                NSEvent, NSPointInRect
            )
            from WebKit import (
                WKWebView, WKWebViewConfiguration, WKUserContentController
            )

            screen_frame = screen.frame()
            screen_w = screen_frame.size.width
            screen_h = screen_frame.size.height
            screen_x = screen_frame.origin.x
            screen_y = screen_frame.origin.y

            # Physical notch height in points (e.g. 38.0 pt on MacBook Pro)
            notch_h = screen.safeAreaInsets().top or 38.0

            # Calculate physical notch position from screen auxiliary areas
            aux_l = getattr(screen, "auxiliaryTopLeftArea", None)
            aux_r = getattr(screen, "auxiliaryTopRightArea", None)
            if aux_l and aux_r:
                left_r = aux_l()
                right_r = aux_r()
                notch_w = max(220.0, right_r.origin.x - (left_r.origin.x + left_r.size.width))
                center_x = (left_r.origin.x + left_r.size.width + right_r.origin.x) / 2.0
            else:
                notch_w = 222.0
                center_x = screen_x + (screen_w / 2.0)

            # Collapsed Mini Pill:
            # Sits directly underneath the camera notch so the physical camera bezel does NOT block it.
            # Total height = notch_h (transparent area behind camera) + pill_h (visible pill below camera)
            pill_h = 34.0
            collapsed_w = max(notch_w + 16.0, 238.0)
            collapsed_h = notch_h + pill_h
            self.collapsed_frame = NSMakeRect(
                center_x - collapsed_w / 2.0,
                screen_y + screen_h - collapsed_h,
                collapsed_w,
                collapsed_h
            )

            # Expanded Dynamic Island Card:
            card_h = 106.0
            expanded_w = 460.0
            expanded_h = notch_h + card_h
            self.expanded_frame = NSMakeRect(
                center_x - expanded_w / 2.0,
                screen_y + screen_h - expanded_h,
                expanded_w,
                expanded_h
            )

            # Create Floating Borderless Panel anchored at top edge of physical notch
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

            # Host View with debounced mouse tracking to eliminate jitter/shaking
            controller_ref = self
            class NotchTrackingView(NSView):
                def mouseEntered_(self, event):
                    controller_ref.on_mouse_entered()

                def mouseExited_(self, event):
                    controller_ref.on_mouse_exited()

                def mouseMoved_(self, event):
                    controller_ref.on_mouse_entered()

            hosting_view = NotchTrackingView.alloc().initWithFrame_(
                NSMakeRect(0, 0, collapsed_w, collapsed_h)
            )
            hosting_view.setAutoresizingMask_(18)  # NSViewWidthSizable | NSViewHeightSizable

            options = (
                NSTrackingMouseEnteredAndExited |
                NSTrackingMouseMoved |
                NSTrackingActiveAlways |
                NSTrackingInVisibleRect
            )
            tracking = NSTrackingArea.alloc().initWithRect_options_owner_userInfo_(
                hosting_view.bounds(), options, hosting_view, None
            )
            hosting_view.addTrackingArea_(tracking)

            # WebKit Script Handler for hover and clicks
            class ScriptHandler(NSObject):
                def userContentController_didReceiveScriptMessage_(self, ucc, msg):
                    body = str(msg.body())
                    if body == "expand":
                        controller_ref.on_mouse_entered()
                    elif body == "collapse":
                        controller_ref.on_mouse_exited()

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

            # Load notch_hud.html with dynamic notch parameters
            hud_url = NSURL.URLWithString_(
                f"http://127.0.0.1:{self.port}/notch_hud?notch_h={int(notch_h)}&pill_h={int(pill_h)}&w={int(collapsed_w)}"
            )
            req = NSURLRequest.requestWithURL_(hud_url)
            self.webview.loadRequest_(req)

            self.panel.orderFrontRegardless()
            print(f"[MacNotch] Attached floating HUD to physical Mac hardware notch (width: {notch_w:.1f}pt, notch_h: {notch_h:.1f}pt, pill_h: {pill_h:.1f}pt).")
            return True
        except Exception as e:
            print(f"[MacNotch] Initialization notice: {e}")
            return False

    def on_mouse_entered(self):
        """Called when mouse enters the notch area or mini pill."""
        self._cancel_collapse_timer()
        if not self.is_expanded:
            self.expand()

    def on_mouse_exited(self):
        """Called when mouse exits. Checks if cursor is still within panel frame to prevent spurious oscillation."""
        from AppKit import NSEvent, NSPointInRect
        try:
            # If cursor is still within the panel frame, ignore spurious event
            if self.panel and NSPointInRect(NSEvent.mouseLocation(), self.panel.frame()):
                return
        except Exception:
            pass

        # Debounce collapse by 450ms so user can move freely without flicker
        self._cancel_collapse_timer()
        from PyObjCTools import AppHelper
        self._collapse_timer = threading.Timer(0.45, lambda: AppHelper.callAfter(self._check_and_collapse))
        self._collapse_timer.daemon = True
        self._collapse_timer.start()

    def _check_and_collapse(self):
        """Confirm cursor is genuinely outside before collapsing."""
        from AppKit import NSEvent, NSPointInRect
        try:
            if self.panel and NSPointInRect(NSEvent.mouseLocation(), self.panel.frame()):
                return
        except Exception:
            pass
        self.collapse()

    def expand(self):
        if self.is_expanded or not self.panel:
            return
        self.is_expanded = True
        self._cancel_collapse_timer()

        # Update webview state
        if self.webview:
            self.webview.evaluateJavaScript_completionHandler_(
                "window.setExpanded && window.setExpanded(true);", None
            )

        self.panel.animator().setFrame_display_(self.expanded_frame, True)
        self.panel.setHasShadow_(True)

    def collapse(self):
        if not self.is_expanded or not self.panel:
            return
        self.is_expanded = False
        self._cancel_collapse_timer()

        # Update webview state
        if self.webview:
            self.webview.evaluateJavaScript_completionHandler_(
                "window.setExpanded && window.setExpanded(false);", None
            )

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

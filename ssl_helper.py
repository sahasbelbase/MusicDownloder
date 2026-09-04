"""
ssl_helper.py
Universal SSL configuration for macOS & Windows desktop app.
Ensures certifi root certificates are used, and provides a safe fallback
to eliminate [SSL: CERTIFICATE_VERIFY_FAILED] errors across all platforms.
"""

import os
import sys
import ssl
import urllib.request
import urllib.error

def setup_ssl():
    """Configure default SSL certificates globally for all HTTPS requests."""
    ca_bundle = None
    try:
        import certifi
        ca_bundle = certifi.where()
    except Exception:
        pass

    if not ca_bundle or not os.path.exists(ca_bundle):
        # PyInstaller bundled location
        meipass = getattr(sys, '_MEIPASS', '')
        if meipass:
            cand = os.path.join(meipass, 'certifi', 'cacert.pem')
            if os.path.isfile(cand):
                ca_bundle = cand

    if ca_bundle and os.path.exists(ca_bundle):
        os.environ['SSL_CERT_FILE'] = ca_bundle
        os.environ['REQUESTS_CA_BUNDLE'] = ca_bundle
        try:
            ssl._create_default_https_context = lambda: ssl.create_default_context(cafile=ca_bundle)
        except Exception:
            pass
    else:
        try:
            ssl._create_default_https_context = ssl._create_unverified_context
        except Exception:
            pass

def get_ssl_context():
    """Returns an SSL context configured with certifi, or unverified as fallback."""
    try:
        import certifi
        ca = certifi.where()
        if os.path.exists(ca):
            return ssl.create_default_context(cafile=ca)
    except Exception:
        pass
    try:
        return ssl.create_default_context()
    except Exception:
        return ssl._create_unverified_context()

def safe_urlopen(req, timeout=15):
    """
    Executes urllib.request.urlopen with verified certifi context,
    automatically falling back to unverified context if local CA verification fails.
    """
    try:
        ctx = get_ssl_context()
        return urllib.request.urlopen(req, context=ctx, timeout=timeout)
    except (ssl.SSLError, urllib.error.URLError) as e:
        err_str = str(e)
        if "CERTIFICATE_VERIFY_FAILED" in err_str or "certificate verify failed" in err_str or "SSL" in err_str:
            unverified_ctx = ssl._create_unverified_context()
            return urllib.request.urlopen(req, context=unverified_ctx, timeout=timeout)
        raise

# Initialize globally on import
setup_ssl()

package com.musicstudio.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.app.DownloadManager;
import android.media.MediaScannerConnection;
import android.os.Environment;
import java.io.File;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 2026;

    private final BroadcastReceiver onDownloadComplete = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (id != -1) {
                DownloadManager downloadManager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (downloadManager == null) return;
                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(id);
                try (Cursor cursor = downloadManager.query(query)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        if (statusIndex != -1 && cursor.getInt(statusIndex) == DownloadManager.STATUS_SUCCESSFUL) {
                            int uriIndex = cursor.getColumnIndex(DownloadManager.COLUMN_LOCAL_URI);
                            if (uriIndex != -1) {
                                String localUri = cursor.getString(uriIndex);
                                if (localUri != null) {
                                    String path = Uri.parse(localUri).getPath();
                                    if (path != null) {
                                        MediaScannerConnection.scanFile(
                                            MainActivity.this,
                                            new String[]{path},
                                            new String[]{"audio/mpeg"},
                                            (scannedPath, uri) -> {
                                                runOnUiThread(() -> {
                                                    WebView webView = getBridge().getWebView();
                                                    if (webView != null) {
                                                        webView.evaluateJavascript("if (typeof window.onAndroidDownloadComplete === 'function') { window.onAndroidDownloadComplete(); }", null);
                                                    }
                                                });
                                            }
                                        );
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.addJavascriptInterface(new AndroidMusicBridge(), "AndroidMusicScanner");
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }

        requestAudioPermissions();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (hasPermission()) {
            notifyWebViewPermissionsGranted();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep WebView audio running when app is minimized / screen is locked
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(onDownloadComplete);
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) == PackageManager.PERMISSION_GRANTED;
        } else {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private void requestAudioPermissions() {
        if (!hasPermission()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.READ_MEDIA_AUDIO}, PERMISSION_REQUEST_CODE);
            } else {
                ActivityCompat.requestPermissions(this, new String[]{
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                }, PERMISSION_REQUEST_CODE);
            }
        } else {
            notifyWebViewPermissionsGranted();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                notifyWebViewPermissionsGranted();
            }
        }
    }

    private void notifyWebViewPermissionsGranted() {
        runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.evaluateJavascript("if (typeof window.onAndroidPermissionsGranted === 'function') { window.onAndroidPermissionsGranted(); }", null);
            }
        });
    }

    public class AndroidMusicBridge {

        @JavascriptInterface
        public boolean downloadTrackToDevice(String audioUrl, String title, String artist, String album, String coverUrl) {
            if (audioUrl == null || audioUrl.isEmpty()) return false;
            try {
                String cleanTitle = (title != null) ? title.replaceAll("[^a-zA-Z0-9._ -]", "").trim() : "Track";
                String cleanArtist = (artist != null) ? artist.replaceAll("[^a-zA-Z0-9._ -]", "").trim() : "Unknown Artist";
                if (cleanTitle.isEmpty()) cleanTitle = "Track";
                if (cleanArtist.isEmpty()) cleanArtist = "Unknown Artist";
                String filename = cleanArtist + " - " + cleanTitle + ".mp3";

                DownloadManager downloadManager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                if (downloadManager == null) return false;

                Uri uri = Uri.parse(audioUrl);
                DownloadManager.Request request = new DownloadManager.Request(uri);
                request.setTitle(cleanTitle);
                request.setDescription("Music Studio • " + cleanArtist);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

                File musicDir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC), "Music Studio");
                if (!musicDir.exists()) {
                    musicDir.mkdirs();
                }

                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_MUSIC, "Music Studio/" + filename);
                request.setMimeType("audio/mpeg");

                downloadManager.enqueue(request);

                File targetFile = new File(musicDir, filename);
                MediaScannerConnection.scanFile(
                    MainActivity.this,
                    new String[]{targetFile.getAbsolutePath()},
                    new String[]{"audio/mpeg"},
                    null
                );

                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public boolean hasStoragePermission() {
            return hasPermission();
        }

        @JavascriptInterface
        public void requestStoragePermission() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    requestAudioPermissions();
                }
            });
        }

        @JavascriptInterface
        public String scanDeviceAudio() {
            JSONArray songArray = new JSONArray();
            if (!hasPermission()) {
                requestAudioPermissions();
                return songArray.toString();
            }

            try {
                Uri collection;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    collection = MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
                } else {
                    collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }

                String[] projection = new String[]{
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.DATA,
                    MediaStore.Audio.Media.SIZE,
                    MediaStore.Audio.Media.DATE_MODIFIED
                };

                String selection = "((" + MediaStore.Audio.Media.IS_MUSIC + " != 0) OR (" +
                                  MediaStore.Audio.Media.DATA + " LIKE '%.mp3') OR (" +
                                  MediaStore.Audio.Media.DATA + " LIKE '%.m4a') OR (" +
                                  MediaStore.Audio.Media.DATA + " LIKE '%.flac') OR (" +
                                  MediaStore.Audio.Media.DATA + " LIKE '%.wav')) AND (" +
                                  MediaStore.Audio.Media.DURATION + " >= 5000)";
                String sortOrder = MediaStore.Audio.Media.TITLE + " ASC";

                try (Cursor cursor = getContentResolver().query(collection, projection, selection, null, sortOrder)) {
                    if (cursor != null) {
                        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                        int titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                        int artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                        int albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                        int durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                        int dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                        int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                        int mtimeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED);

                        while (cursor.moveToNext()) {
                            long id = cursor.getLong(idCol);
                            String title = cursor.getString(titleCol);
                            String artist = cursor.getString(artistCol);
                            String album = cursor.getString(albumCol);
                            long durationMs = cursor.getLong(durationCol);
                            String dataPath = cursor.getString(dataCol);
                            long sizeBytes = cursor.getLong(sizeCol);
                            long mtime = cursor.getLong(mtimeCol);

                            if (dataPath == null || dataPath.isEmpty()) continue;

                            JSONObject song = new JSONObject();
                            song.put("id", "android_" + id);
                            song.put("title", (title != null && !title.isEmpty()) ? title : "Unknown Title");
                            song.put("artist", (artist != null && !artist.equals("<unknown>") && !artist.isEmpty()) ? artist : "Mobile Audio");
                            song.put("album", (album != null && !album.equals("<unknown>") && !album.isEmpty()) ? album : "Device Music");
                            song.put("duration", durationMs > 0 ? Math.round(durationMs / 1000.0) : 0);
                            song.put("size_mb", Math.round((sizeBytes / (1024.0 * 1024.0)) * 100.0) / 100.0);
                            song.put("filename", dataPath);
                            song.put("file_path", dataPath);
                            song.put("content_uri", ContentUris.withAppendedId(collection, id).toString());
                            song.put("is_local_device", true);
                            song.put("is_android_mediastore", true);
                            song.put("mtime", mtime);
                            song.put("cover_url", "placeholder.svg");

                            songArray.put(song);
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return songArray.toString();
        }
    }
}
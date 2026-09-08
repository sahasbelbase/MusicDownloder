package com.musicstudio.app;

import android.Manifest;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 2026;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new AndroidMusicBridge(), "AndroidMusicScanner");
        }

        requestAudioPermissions();
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
        }
    }

    public class AndroidMusicBridge {
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

                String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";
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

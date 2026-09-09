package com.musicstudio.app;

import android.Manifest;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.WallpaperManager;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.MediaMetadataRetriever;
import android.media.MediaScannerConnection;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.provider.Settings;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 2026;
    private static final String NOTIFICATION_CHANNEL_ID = "music_studio_playback";
    private static final int NOTIFICATION_ID = 2026;

    private static MainActivity instance;

    private MediaSession mediaSession;
    private String pendingMediaAction = null;
    private String pendingOpenAudioJson = null;
    private final Map<String, Bitmap> coverBitmapCache = new HashMap<>();

    private boolean isLockscreenWallpaperEnabled = true;
    private String currentWallpaperTrackKey = null;

    public static MainActivity getInstance() {
        return instance;
    }

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
        instance = this;
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            webView.addJavascriptInterface(new AndroidMusicBridge(), "AndroidMusicScanner");
        }

        createNotificationChannel();
        initMediaSession();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }

        handleIncomingIntent(getIntent());

        requestAudioPermissions();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = new NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Music Playback",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Music Studio notification bar playback controls");
                channel.setShowBadge(false);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.enableVibration(false);
                channel.setSound(null, null);
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void initMediaSession() {
        try {
            mediaSession = new MediaSession(this, "MusicStudioSession");
            mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    dispatchMediaControl("play");
                }

                @Override
                public void onPause() {
                    dispatchMediaControl("pause");
                }

                @Override
                public void onSkipToNext() {
                    dispatchMediaControl("next");
                }

                @Override
                public void onSkipToPrevious() {
                    dispatchMediaControl("prev");
                }

                @Override
                public void onStop() {
                    dispatchMediaControl("pause");
                }

                @Override
                public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                    return super.onMediaButtonEvent(mediaButtonIntent);
                }
            });

            PlaybackState state = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE |
                            PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_SKIP_TO_NEXT |
                            PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_STOP)
                .setState(PlaybackState.STATE_PAUSED, 0, 1.0f)
                .build();
            mediaSession.setPlaybackState(state);
            mediaSession.setActive(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void dispatchMediaControl(final String action) {
        runOnUiThread(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.evaluateJavascript("if (typeof window.androidMediaControl === 'function') { window.androidMediaControl('" + action + "'); }", null);
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;

        if (intent.hasExtra("extra_media_action")) {
            String act = intent.getStringExtra("extra_media_action");
            if (act != null) {
                dispatchMediaControl(act);
            }
        }

        if (Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri audioUri = intent.getData();
            if (audioUri != null) {
                processOpenedAudioUri(audioUri);
            }
        }
    }

    private void processOpenedAudioUri(Uri uri) {
        try {
            String title = "Audio File";
            String artist = "Local Music";
            long durationSec = 0;
            String path = null;

            ContentResolver cr = getContentResolver();

            try (Cursor c = cr.query(uri, null, null, null, null)) {
                if (c != null && c.moveToFirst()) {
                    int nameIdx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIdx != -1) {
                        String displayName = c.getString(nameIdx);
                        if (displayName != null && !displayName.isEmpty()) {
                            int dotIdx = displayName.lastIndexOf(".");
                            if (dotIdx > 0) {
                                title = displayName.substring(0, dotIdx);
                            } else {
                                title = displayName;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}

            MediaMetadataRetriever mmr = new MediaMetadataRetriever();
            try {
                mmr.setDataSource(this, uri);
                String metaTitle = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE);
                String metaArtist = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST);
                String metaDur = mmr.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                if (metaTitle != null && !metaTitle.trim().isEmpty()) title = metaTitle.trim();
                if (metaArtist != null && !metaArtist.trim().isEmpty()) artist = metaArtist.trim();
                if (metaDur != null) {
                    try {
                        durationSec = Math.round(Long.parseLong(metaDur) / 1000.0);
                    } catch (Exception ignored) {}
                }
            } catch (Exception ignored) {
            } finally {
                try { mmr.release(); } catch (Exception ignored) {}
            }

            JSONObject song = new JSONObject();
            song.put("id", "intent_" + System.currentTimeMillis());
            song.put("title", title);
            song.put("artist", artist);
            song.put("album", "Opened Audio");
            song.put("duration", durationSec);
            song.put("content_uri", uri.toString());
            song.put("file_path", uri.toString());
            song.put("cover_url", "placeholder.svg");
            song.put("is_local_device", true);
            song.put("is_android_mediastore", true);
            song.put("auto_play", true);

            final String songJson = song.toString();
            pendingOpenAudioJson = songJson;

            runOnUiThread(() -> {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.evaluateJavascript("if (typeof window.onAndroidOpenFile === 'function') { window.onAndroidOpenFile(" + JSONObject.quote(songJson) + "); }", null);
                    pendingOpenAudioJson = null;
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void updateNotification(String title, String artist, String album, boolean isPlaying, Bitmap cover) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            Intent openIntent = new Intent(this, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent openPI = PendingIntent.getActivity(this, 0, openIntent, flags);

            Intent prevIntent = new Intent(this, MusicWidgetProvider.class);
            prevIntent.setAction(MusicWidgetProvider.ACTION_WIDGET_PREV);
            PendingIntent prevPI = PendingIntent.getBroadcast(this, 10, prevIntent, flags);

            Intent playPauseIntent = new Intent(this, MusicWidgetProvider.class);
            playPauseIntent.setAction(MusicWidgetProvider.ACTION_WIDGET_PLAY_PAUSE);
            PendingIntent playPausePI = PendingIntent.getBroadcast(this, 11, playPauseIntent, flags);

            Intent nextIntent = new Intent(this, MusicWidgetProvider.class);
            nextIntent.setAction(MusicWidgetProvider.ACTION_WIDGET_NEXT);
            PendingIntent nextPI = PendingIntent.getBroadcast(this, 12, nextIntent, flags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, NOTIFICATION_CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
            }

            builder.setContentTitle(title)
                   .setContentText(artist)
                   .setSubText(album)
                   .setContentIntent(openPI)
                   .setSmallIcon(R.mipmap.ic_launcher)
                   .setVisibility(Notification.VISIBILITY_PUBLIC)
                   .setOngoing(isPlaying)
                   .setOnlyAlertOnce(true);

            if (cover != null && !cover.isRecycled()) {
                builder.setLargeIcon(cover);
            }

            Notification.Action prevAction = new Notification.Action.Builder(
                Icon.createWithResource(this, R.drawable.ic_widget_prev),
                "Previous",
                prevPI
            ).build();

            Notification.Action playPauseAction = new Notification.Action.Builder(
                Icon.createWithResource(this, isPlaying ? R.drawable.ic_widget_pause : R.drawable.ic_widget_play),
                isPlaying ? "Pause" : "Play",
                playPausePI
            ).build();

            Notification.Action nextAction = new Notification.Action.Builder(
                Icon.createWithResource(this, R.drawable.ic_widget_next),
                "Next",
                nextPI
            ).build();

            builder.addAction(prevAction);
            builder.addAction(playPauseAction);
            builder.addAction(nextAction);

            Notification.MediaStyle mediaStyle = new Notification.MediaStyle();
            if (mediaSession != null) {
                mediaStyle.setMediaSession(mediaSession.getSessionToken());
            }
            mediaStyle.setShowActionsInCompactView(0, 1, 2);
            builder.setStyle(mediaStyle);

            nm.notify(NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private Bitmap getRoundedCornerBitmap(Bitmap bitmap, float cornerRadius) {
        Bitmap output = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(output);
        final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);
        canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, paint);
        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);
        return output;
    }

    private void updateLockScreenWallpaper(final Bitmap coverArt, final String trackKey, final boolean isPlaying) {
        if (!isLockscreenWallpaperEnabled) return;

        new Thread(() -> {
            try {
                WallpaperManager wm = WallpaperManager.getInstance(this);
                if (!wm.isWallpaperSupported() || !wm.isSetWallpaperAllowed()) return;

                if (!isPlaying) {
                    if (currentWallpaperTrackKey != null) {
                        try {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                wm.clear(WallpaperManager.FLAG_LOCK);
                            }
                        } catch (Exception ignored) {}
                        currentWallpaperTrackKey = null;
                    }
                    return;
                }

                if (coverArt == null || coverArt.isRecycled()) return;
                if (trackKey != null && trackKey.equals(currentWallpaperTrackKey)) return;

                DisplayMetrics metrics = getResources().getDisplayMetrics();
                int screenWidth = metrics.widthPixels > 0 ? metrics.widthPixels : 1080;
                int screenHeight = metrics.heightPixels > 0 ? metrics.heightPixels : 2400;

                Bitmap wallpaper = Bitmap.createBitmap(screenWidth, screenHeight, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(wallpaper);

                // Dark sleek background
                Paint bgPaint = new Paint();
                bgPaint.setColor(0xFF0C0F17);
                canvas.drawRect(0, 0, screenWidth, screenHeight, bgPaint);

                // Subtle ambient glow from cover
                try {
                    Bitmap ambient = Bitmap.createScaledBitmap(coverArt, Math.max(10, screenWidth / 4), Math.max(10, screenHeight / 4), true);
                    Paint blurPaint = new Paint();
                    blurPaint.setAlpha(60);
                    Rect srcRect = new Rect(0, 0, ambient.getWidth(), ambient.getHeight());
                    Rect dstRect = new Rect(0, 0, screenWidth, screenHeight);
                    canvas.drawBitmap(ambient, srcRect, dstRect, blurPaint);
                    ambient.recycle();
                } catch (Exception ignored) {}

                // Center rounded card with the cover picture
                int cardSize = (int) (screenWidth * 0.72f);
                int left = (screenWidth - cardSize) / 2;
                int top = (int) (screenHeight * 0.30f);

                // Drop shadow
                Paint shadowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                shadowPaint.setColor(0x88000000);
                RectF shadowRect = new RectF(left - 6, top + 10, left + cardSize + 6, top + cardSize + 20);
                canvas.drawRoundRect(shadowRect, 32, 32, shadowPaint);

                // Rounded album cover
                Bitmap scaledCover = Bitmap.createScaledBitmap(coverArt, cardSize, cardSize, true);
                Bitmap roundedCover = getRoundedCornerBitmap(scaledCover, 28);
                canvas.drawBitmap(roundedCover, left, top, null);

                scaledCover.recycle();
                roundedCover.recycle();

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    wm.setBitmap(wallpaper, null, true, WallpaperManager.FLAG_LOCK);
                    currentWallpaperTrackKey = trackKey;
                }

                wallpaper.recycle();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
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

        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIFICATION_ID);
        } catch (Exception ignored) {}

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                WallpaperManager.getInstance(this).clear(WallpaperManager.FLAG_LOCK);
            }
        } catch (Exception ignored) {}

        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }

        if (instance == this) {
            instance = null;
        }
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
            List<String> perms = new ArrayList<>();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                perms.add(Manifest.permission.READ_MEDIA_AUDIO);
                perms.add(Manifest.permission.POST_NOTIFICATIONS);
            } else {
                perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
                perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
            ActivityCompat.requestPermissions(this, perms.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
                }
            }
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
                if (pendingOpenAudioJson != null) {
                    webView.evaluateJavascript("if (typeof window.onAndroidOpenFile === 'function') { window.onAndroidOpenFile(" + JSONObject.quote(pendingOpenAudioJson) + "); }", null);
                    pendingOpenAudioJson = null;
                }
            }
        });
    }

    public class AndroidMusicBridge {

        @JavascriptInterface
        public void setLockscreenWallpaperEnabled(boolean enabled) {
            isLockscreenWallpaperEnabled = enabled;
            if (!enabled) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        WallpaperManager.getInstance(MainActivity.this).clear(WallpaperManager.FLAG_LOCK);
                    }
                    currentWallpaperTrackKey = null;
                } catch (Exception ignored) {}
            }
        }

        @JavascriptInterface
        public void updatePlaybackState(boolean isPlaying, String title, String artist, String album, long durationMs, long positionMs, String coverUrl, boolean isShuffle) {
            runOnUiThread(() -> {
                try {
                    String sTitle = (title != null && !title.isEmpty()) ? title : "Music Studio";
                    String sArtist = (artist != null && !artist.isEmpty()) ? artist : "Playing";
                    String sAlbum = (album != null && !album.isEmpty()) ? album : "Music Studio";

                    if (mediaSession != null) {
                        long actions = PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE |
                                      PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_SKIP_TO_NEXT |
                                      PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_SEEK_TO |
                                      PlaybackState.ACTION_STOP;

                        PlaybackState state = new PlaybackState.Builder()
                            .setActions(actions)
                            .setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, positionMs, 1.0f)
                            .build();
                        mediaSession.setPlaybackState(state);

                        MediaMetadata.Builder meta = new MediaMetadata.Builder()
                            .putString(MediaMetadata.METADATA_KEY_TITLE, sTitle)
                            .putString(MediaMetadata.METADATA_KEY_ARTIST, sArtist)
                            .putString(MediaMetadata.METADATA_KEY_ALBUM, sAlbum)
                            .putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs);

                        Bitmap cachedArt = coverBitmapCache.get(coverUrl);
                        if (cachedArt != null && !cachedArt.isRecycled()) {
                            meta.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, cachedArt);
                        }
                        mediaSession.setMetadata(meta.build());
                    }

                    Bitmap cachedCover = coverBitmapCache.get(coverUrl);
                    MusicWidgetProvider.updateWidget(MainActivity.this, sTitle, sArtist, isPlaying, isShuffle, cachedCover);
                    updateNotification(sTitle, sArtist, sAlbum, isPlaying, cachedCover);
                    updateLockScreenWallpaper(cachedCover, sTitle + "_" + sArtist, isPlaying);

                    // Decode artwork asynchronously if not cached yet
                    if (coverUrl != null && !coverUrl.isEmpty() && !coverBitmapCache.containsKey(coverUrl)) {
                        new Thread(() -> {
                            try {
                                Bitmap decoded = null;
                                if (coverUrl.startsWith("data:image")) {
                                    int comma = coverUrl.indexOf(',');
                                    if (comma != -1) {
                                        byte[] bytes = Base64.decode(coverUrl.substring(comma + 1), Base64.DEFAULT);
                                        decoded = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                                    }
                                } else if (coverUrl.startsWith("content://")) {
                                    try (InputStream is = getContentResolver().openInputStream(Uri.parse(coverUrl))) {
                                        if (is != null) decoded = BitmapFactory.decodeStream(is);
                                    }
                                } else if (coverUrl.startsWith("/") || coverUrl.startsWith("file://")) {
                                    String path = coverUrl.replaceFirst("^file://", "");
                                    decoded = BitmapFactory.decodeFile(path);
                                }

                                if (decoded != null) {
                                    Bitmap scaled = Bitmap.createScaledBitmap(decoded, 140, 140, true);
                                    coverBitmapCache.put(coverUrl, scaled);
                                    final Bitmap finalDecoded = decoded;
                                    runOnUiThread(() -> {
                                        MusicWidgetProvider.updateWidget(MainActivity.this, sTitle, sArtist, isPlaying, isShuffle, scaled);
                                        updateNotification(sTitle, sArtist, sAlbum, isPlaying, scaled);
                                        updateLockScreenWallpaper(finalDecoded, sTitle + "_" + sArtist, isPlaying);

                                        if (mediaSession != null) {
                                            MediaMetadata.Builder meta = new MediaMetadata.Builder()
                                                .putString(MediaMetadata.METADATA_KEY_TITLE, sTitle)
                                                .putString(MediaMetadata.METADATA_KEY_ARTIST, sArtist)
                                                .putString(MediaMetadata.METADATA_KEY_ALBUM, sAlbum)
                                                .putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs)
                                                .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, scaled);
                                            mediaSession.setMetadata(meta.build());
                                        }
                                    });
                                }
                            } catch (Exception ignored) {}
                        }).start();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void openDefaultAppsSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
                startActivity(intent);
            } catch (Exception e1) {
                try {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getPackageName()));
                    startActivity(intent);
                } catch (Exception e2) {
                    e2.printStackTrace();
                }
            }
        }

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
        public String getTrackArtwork(String filePath) {
            if (filePath == null || filePath.isEmpty()) return "";
            MediaMetadataRetriever mmr = new MediaMetadataRetriever();
            try {
                mmr.setDataSource(filePath);
                byte[] rawArt = mmr.getEmbeddedPicture();
                if (rawArt != null && rawArt.length > 0) {
                    Bitmap bitmap = BitmapFactory.decodeByteArray(rawArt, 0, rawArt.length);
                    if (bitmap != null) {
                        int targetSize = 120;
                        Bitmap scaled = Bitmap.createScaledBitmap(bitmap, targetSize, targetSize, true);
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        scaled.compress(Bitmap.CompressFormat.JPEG, 75, out);
                        byte[] jpegBytes = out.toByteArray();
                        scaled.recycle();
                        bitmap.recycle();
                        return "data:image/jpeg;base64," + Base64.encodeToString(jpegBytes, Base64.NO_WRAP);
                    }
                }
            } catch (Exception ignored) {
            } finally {
                try { mmr.release(); } catch (Exception ignored) {}
            }
            return "";
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
                    MediaStore.Audio.Media.ALBUM_ID,
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
                        int albumIdCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ID);
                        int durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                        int dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                        int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                        int mtimeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_MODIFIED);

                        while (cursor.moveToNext()) {
                            long id = cursor.getLong(idCol);
                            String title = cursor.getString(titleCol);
                            String artist = cursor.getString(artistCol);
                            String album = cursor.getString(albumCol);
                            long albumId = (albumIdCol != -1) ? cursor.getLong(albumIdCol) : -1;
                            long durationMs = cursor.getLong(durationCol);
                            String dataPath = cursor.getString(dataCol);
                            long sizeBytes = cursor.getLong(sizeCol);
                            long mtime = cursor.getLong(mtimeCol);

                            if (dataPath == null || dataPath.isEmpty()) continue;

                            String cleanTitle = (title != null && !title.isEmpty()) ? title : "Unknown Title";
                            String cleanArtist = (artist != null && !artist.equals("<unknown>") && !artist.isEmpty()) ? artist : "Mobile Audio";
                            String cleanAlbum = (album != null && !album.equals("<unknown>") && !album.isEmpty()) ? album : "Device Music";

                            String coverUrl = "placeholder.svg";
                            if (albumId > 0) {
                                coverUrl = ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId).toString();
                            }

                            JSONObject song = new JSONObject();
                            song.put("id", "android_" + id);
                            song.put("title", cleanTitle);
                            song.put("artist", cleanArtist);
                            song.put("album", cleanAlbum);
                            song.put("album_id", albumId);
                            song.put("genre", "General");
                            song.put("duration", durationMs > 0 ? Math.round(durationMs / 1000.0) : 0);
                            song.put("size_mb", Math.round((sizeBytes / (1024.0 * 1024.0)) * 100.0) / 100.0);
                            song.put("filename", dataPath);
                            song.put("file_path", dataPath);
                            song.put("content_uri", ContentUris.withAppendedId(collection, id).toString());
                            song.put("cover_url", coverUrl);
                            song.put("is_local_device", true);
                            song.put("is_android_mediastore", true);
                            song.put("mtime", mtime);

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
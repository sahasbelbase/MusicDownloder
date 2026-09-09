package com.musicstudio.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.widget.RemoteViews;

public class MusicWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_PLAY_PAUSE = "com.musicstudio.app.ACTION_WIDGET_PLAY_PAUSE";
    public static final String ACTION_WIDGET_PREV = "com.musicstudio.app.ACTION_WIDGET_PREV";
    public static final String ACTION_WIDGET_NEXT = "com.musicstudio.app.ACTION_WIDGET_NEXT";
    public static final String ACTION_WIDGET_SHUFFLE = "com.musicstudio.app.ACTION_WIDGET_SHUFFLE";
    public static final String ACTION_UPDATE_WIDGET_STATE = "com.musicstudio.app.ACTION_UPDATE_WIDGET_STATE";

    private static String currentTitle = "Music Studio";
    private static String currentArtist = "Tap to listen";
    private static boolean isPlaying = false;
    private static boolean isShuffle = false;
    private static Bitmap currentCover = null;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.music_widget);

        // Update labels
        views.setTextViewText(R.id.widget_title, currentTitle != null ? currentTitle : "Music Studio");
        views.setTextViewText(R.id.widget_artist, currentArtist != null ? currentArtist : "Tap to listen");

        // Update icons
        views.setImageViewResource(R.id.widget_btn_play_pause, isPlaying ? R.drawable.ic_widget_pause : R.drawable.ic_widget_play);
        views.setImageViewResource(R.id.widget_btn_shuffle, isShuffle ? R.drawable.ic_widget_shuffle_active : R.drawable.ic_widget_shuffle);

        if (currentCover != null && !currentCover.isRecycled()) {
            views.setImageViewBitmap(R.id.widget_album_art, currentCover);
        } else {
            views.setImageViewResource(R.id.widget_album_art, R.drawable.widget_art_bg);
        }

        // PendingIntent flags
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap widget background to open MainActivity
        Intent openAppIntent = new Intent(context, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent openAppPI = PendingIntent.getActivity(context, 0, openAppIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, openAppPI);
        views.setOnClickPendingIntent(R.id.widget_album_art, openAppPI);
        views.setOnClickPendingIntent(R.id.widget_meta_layout, openAppPI);

        // Play / Pause Button
        Intent playPauseIntent = new Intent(context, MusicWidgetProvider.class);
        playPauseIntent.setAction(ACTION_WIDGET_PLAY_PAUSE);
        PendingIntent playPausePI = PendingIntent.getBroadcast(context, 1, playPauseIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_btn_play_pause, playPausePI);

        // Previous Button
        Intent prevIntent = new Intent(context, MusicWidgetProvider.class);
        prevIntent.setAction(ACTION_WIDGET_PREV);
        PendingIntent prevPI = PendingIntent.getBroadcast(context, 2, prevIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_btn_prev, prevPI);

        // Next Button
        Intent nextIntent = new Intent(context, MusicWidgetProvider.class);
        nextIntent.setAction(ACTION_WIDGET_NEXT);
        PendingIntent nextPI = PendingIntent.getBroadcast(context, 3, nextIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_btn_next, nextPI);

        // Shuffle Button
        Intent shuffleIntent = new Intent(context, MusicWidgetProvider.class);
        shuffleIntent.setAction(ACTION_WIDGET_SHUFFLE);
        PendingIntent shufflePI = PendingIntent.getBroadcast(context, 4, shuffleIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_btn_shuffle, shufflePI);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void updateWidget(Context context, String title, String artist, boolean playing, boolean shuffle, Bitmap cover) {
        currentTitle = title;
        currentArtist = artist;
        isPlaying = playing;
        isShuffle = shuffle;
        if (cover != null && !cover.isRecycled()) {
            currentCover = cover;
        }

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, MusicWidgetProvider.class);
        int[] appWidgetIds = manager.getAppWidgetIds(component);
        if (appWidgetIds != null && appWidgetIds.length > 0) {
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, manager, appWidgetId);
            }
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (action == null) return;

        MainActivity activity = MainActivity.getInstance();

        if (ACTION_WIDGET_PLAY_PAUSE.equals(action)) {
            if (activity != null) {
                activity.dispatchMediaControl("toggle");
            } else {
                launchAppWithAction(context, "toggle");
            }
        } else if (ACTION_WIDGET_PREV.equals(action)) {
            if (activity != null) {
                activity.dispatchMediaControl("prev");
            } else {
                launchAppWithAction(context, "prev");
            }
        } else if (ACTION_WIDGET_NEXT.equals(action)) {
            if (activity != null) {
                activity.dispatchMediaControl("next");
            } else {
                launchAppWithAction(context, "next");
            }
        } else if (ACTION_WIDGET_SHUFFLE.equals(action)) {
            if (activity != null) {
                activity.dispatchMediaControl("shuffle");
            } else {
                launchAppWithAction(context, "shuffle");
            }
        }
    }

    private void launchAppWithAction(Context context, String mediaAction) {
        Intent i = new Intent(context, MainActivity.class);
        i.setAction(Intent.ACTION_MAIN);
        i.addCategory(Intent.CATEGORY_LAUNCHER);
        i.putExtra("extra_media_action", mediaAction);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        context.startActivity(i);
    }
}
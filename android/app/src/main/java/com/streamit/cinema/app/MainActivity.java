package com.streamit.cinema.app;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private StreamItEmbeddedServer embeddedServer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Prevent Android TV / Streamer screensaver from dimming or turning off the TV during movies
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Start built-in standalone 1080p stream & HLS proxy engine on 127.0.0.1:8092 inside the Streamer APK
        embeddedServer = new StreamItEmbeddedServer();
        embeddedServer.start();
    }

    @Override
    public void onDestroy() {
        if (embeddedServer != null) {
            embeddedServer.stop();
        }
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN && getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            int keyCode = event.getKeyCode();

            if (keyCode == KeyEvent.KEYCODE_BACK) {
                webView.evaluateJavascript(
                    "(function(){ return !!(window.TVNavigation && window.TVNavigation.handleAndroidBackButton()); })()",
                    result -> {
                        if (!"true".equals(result)) {
                            runOnUiThread(MainActivity.super::onBackPressed);
                        }
                    }
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                    || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY
                    || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                webView.evaluateJavascript(
                    "(function(){ var v=document.getElementById('cinemaVideo'); if(v){ if(v.paused) v.play(); else v.pause(); } })()",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
                webView.evaluateJavascript(
                    "(function(){ var v=document.getElementById('cinemaVideo'); if(v){ v.currentTime = Math.min(v.duration||9999, v.currentTime+10); } })()",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_REWIND) {
                webView.evaluateJavascript(
                    "(function(){ var v=document.getElementById('cinemaVideo'); if(v){ v.currentTime = Math.max(0, v.currentTime-10); } })()",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                webView.evaluateJavascript(
                    "(function(){ if(window.StreamItApp) window.StreamItApp.playNextBingeTarget(); })()",
                    null
                );
                return true;
            }

            if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                webView.evaluateJavascript(
                    "(function(){ if(window.StreamItApp) window.StreamItApp.playPrevBingeTarget(); })()",
                    null
                );
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }
}

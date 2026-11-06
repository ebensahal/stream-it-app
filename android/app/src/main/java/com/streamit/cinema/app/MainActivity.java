package com.streamit.cinema.app;

import android.os.Bundle;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private StreamItEmbeddedServer embeddedServer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Prevent Android TV / Streamer screensaver from dimming or turning off the TV during movies
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Configure WebView for 1080p Smart TV viewport, zero mixed-content blocks, and instant autoplay
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings ws = webView.getSettings();
            ws.setUseWideViewPort(true);
            ws.setLoadWithOverviewMode(true);
            ws.setTextZoom(82);
            ws.setMediaPlaybackRequiresUserGesture(false);
            ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            ws.setDomStorageEnabled(true);
            ws.setJavaScriptEnabled(true);
        }

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
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            int keyCode = event.getKeyCode();
            int action = event.getAction();

            // Consume ACTION_UP for D-Pad Center & Arrows so WebView never double-fires or scrolls erratically
            if (action == KeyEvent.ACTION_UP) {
                if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                        || keyCode == KeyEvent.KEYCODE_ENTER
                        || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER
                        || keyCode == KeyEvent.KEYCODE_DPAD_UP
                        || keyCode == KeyEvent.KEYCODE_DPAD_DOWN
                        || keyCode == KeyEvent.KEYCODE_DPAD_LEFT
                        || keyCode == KeyEvent.KEYCODE_DPAD_RIGHT
                        || keyCode == KeyEvent.KEYCODE_BACK) {
                    return true;
                }
            }

            if (action == KeyEvent.ACTION_DOWN) {
                // 1. D-Pad Arrows (Up / Down / Left / Right) -> Direct Spatial Navigation
                if (keyCode == KeyEvent.KEYCODE_DPAD_UP) {
                    webView.evaluateJavascript(
                        "(function(){ if(window.TVNavigation) window.TVNavigation.handleRemoteDirection('up'); })()",
                        null
                    );
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
                    webView.evaluateJavascript(
                        "(function(){ if(window.TVNavigation) window.TVNavigation.handleRemoteDirection('down'); })()",
                        null
                    );
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
                    webView.evaluateJavascript(
                        "(function(){ if(window.TVNavigation) window.TVNavigation.handleRemoteDirection('left'); })()",
                        null
                    );
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
                    webView.evaluateJavascript(
                        "(function(){ if(window.TVNavigation) window.TVNavigation.handleRemoteDirection('right'); })()",
                        null
                    );
                    return true;
                }

                // 2. D-Pad Center / OK / Enter -> Direct Click on Focused Element
                if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                        || keyCode == KeyEvent.KEYCODE_ENTER
                        || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER) {
                    webView.evaluateJavascript(
                        "(function(){ if(window.TVNavigation) window.TVNavigation.handleRemoteOk(); })()",
                        null
                    );
                    return true;
                }

                // 3. Back Button
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

                // 4. Media Buttons
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
        }
        return super.dispatchKeyEvent(event);
    }
}

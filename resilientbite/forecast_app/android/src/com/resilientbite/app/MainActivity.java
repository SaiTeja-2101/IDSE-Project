package com.resilientbite.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.webkit.*;
import android.widget.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.Objects;

public class MainActivity extends Activity {
    private static final int PICK_UPLOAD = 1;
    private static final int SAVE_FORECAST = 2;
    private static final long MIN_SPLASH_MS = 2000;
    private static final long MAX_SPLASH_MS = 75000;
    private static final int PAPER = Color.rgb(241, 238, 231);
    private static final int SLATE = Color.rgb(35, 59, 80);

    private WebView web;
    private ValueCallback<Uri[]> upload;
    private String server;
    private String pendingCsvUrl;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null) pendingCsvUrl = state.getString("pendingCsvUrl");
        server = BuildConfig.SERVER_URL;
        if (server.isEmpty()) {
            server = getPreferences(0).getString("server", "");
            showConnection();
        } else {
            showPlanner();
        }
    }

    private void showConnection() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32, 56, 32, 24);
        layout.setBackgroundColor(Color.rgb(244, 247, 241));
        TextView title = new TextView(this);
        title.setText("ResilientBite");
        title.setTextSize(28);
        title.setTextColor(Color.rgb(35, 78, 53));
        layout.addView(title);
        TextView help = new TextView(this);
        help.setText("Connect to your forecasting server\n\nRun the Python app on your computer. Connect this phone to the same Wi-Fi and enter the computer’s address, for example http://192.168.1.10:8501\n");
        layout.addView(help);
        EditText address = new EditText(this);
        address.setSingleLine(true);
        address.setInputType(17);
        address.setHint("Server address");
        address.setText(server);
        layout.addView(address);
        Button connect = new Button(this);
        connect.setText("Open meal planner");
        layout.addView(connect);
        connect.setOnClickListener(view -> {
            String value = address.getText().toString().trim();
            Uri uri = Uri.parse(value);
            if (uri.getHost() == null || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
                address.setError("Enter a complete http:// or https:// address");
                return;
            }
            server = value;
            getPreferences(0).edit().putString("server", server).apply();
            showPlanner();
        });
        setContentView(layout);
    }

    private void showPlanner() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        if (BuildConfig.SERVER_URL.isEmpty()) {
            Button settings = new Button(this);
            settings.setText("Change server");
            settings.setOnClickListener(view -> {
                web.destroy();
                web = null;
                showConnection();
            });
            layout.addView(settings);
        }
        getWindow().setStatusBarColor(SLATE);
        web = new WebView(this);
        web.setBackgroundColor(PAPER);
        FrameLayout planner = new FrameLayout(this);
        planner.addView(web, new FrameLayout.LayoutParams(-1, -1));
        View splash = createSplash();
        planner.addView(splash, new FrameLayout.LayoutParams(-1, -1));
        long openedAt = SystemClock.uptimeMillis();
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                if (splash.getVisibility() == View.VISIBLE) {
                    waitForPlanner(view, splash, openedAt);
                }
            }

            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame() && view == web && !isFinishing()) {
                    splash.setVisibility(View.GONE);
                    new AlertDialog.Builder(MainActivity.this)
                        .setMessage("Could not connect. Check your internet connection.")
                        .setPositiveButton("Try again", (dialog, which) -> view.reload())
                        .setNegativeButton("Close", null)
                        .show();
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (upload != null) upload.onReceiveValue(null);
                upload = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(intent, PICK_UPLOAD);
                return true;
            }
        });
        web.setDownloadListener((url, userAgent, disposition, mimeType, length) ->
            chooseCsvDestination(url, disposition, mimeType));
        layout.addView(planner, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);
        WebView loadingView = web;
        planner.postDelayed(() -> {
            if (web == loadingView) splash.setVisibility(View.GONE);
        }, MAX_SPLASH_MS);
        web.loadUrl(server);
    }

    private void chooseCsvDestination(String url, String disposition, String mimeType) {
        Uri source = Uri.parse(url);
        Uri planner = Uri.parse(server);
        if (!Objects.equals(source.getScheme(), planner.getScheme())
                || !Objects.equals(source.getHost(), planner.getHost())
                || source.getPort() != planner.getPort()
                || source.getPath() == null || !source.getPath().startsWith("/media/")
                || !source.getPath().endsWith(".csv")) {
            Toast.makeText(this, "Could not open this CSV download.", Toast.LENGTH_LONG).show();
            return;
        }
        if (pendingCsvUrl != null) return;
        Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        save.addCategory(Intent.CATEGORY_OPENABLE);
        save.setType("text/csv");
        save.putExtra(Intent.EXTRA_TITLE, URLUtil.guessFileName(url, disposition, mimeType));
        pendingCsvUrl = url;
        startActivityForResult(save, SAVE_FORECAST);
    }

    private void saveForecast(String url, Uri destination) {
        String cookies = CookieManager.getInstance().getCookie(url);
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                if (cookies != null) connection.setRequestProperty("Cookie", cookies);
                String type = connection.getContentType();
                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK || type == null
                        || !type.toLowerCase(Locale.ROOT).startsWith("text/csv")) {
                    throw new IOException("Forecast CSV unavailable");
                }
                try (InputStream input = connection.getInputStream();
                        OutputStream output = getContentResolver().openOutputStream(destination, "wt")) {
                    if (output == null) throw new IOException("No output stream");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                }
                showSaveMessage("Forecast CSV saved.");
            } catch (IOException | SecurityException error) {
                showSaveMessage("Could not save the CSV. Generate the forecast and try again.");
            } finally {
                if (connection != null) connection.disconnect();
            }
        }, "save-forecast-csv").start();
    }

    private void showSaveMessage(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putString("pendingCsvUrl", pendingCsvUrl);
    }

    private View createSplash() {
        LinearLayout splash = new LinearLayout(this);
        splash.setOrientation(LinearLayout.VERTICAL);
        splash.setGravity(Gravity.CENTER);
        splash.setBackgroundColor(PAPER);
        splash.setClickable(true);
        int size = (int) (88 * getResources().getDisplayMetrics().density);
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.mipmap.ic_launcher);
        splash.addView(logo, new LinearLayout.LayoutParams(size, size));
        logo.setContentDescription("ResilientBite");
        return splash;
    }

    private void waitForPlanner(WebView view, View splash, long openedAt) {
        if (view != web || isFinishing() || splash.getVisibility() != View.VISIBLE) return;
        // Streamlit renders the upload control after the browser loads its initial page.
        view.evaluateJavascript("Boolean(document.querySelector('[data-testid=stFileUploader]'))", ready -> {
            if (view != web || isFinishing() || splash.getVisibility() != View.VISIBLE) return;
            if ("true".equals(ready)) {
                long remaining = Math.max(0, MIN_SPLASH_MS - (SystemClock.uptimeMillis() - openedAt));
                splash.postDelayed(() -> splash.setVisibility(View.GONE), remaining);
            } else {
                splash.postDelayed(() -> waitForPlanner(view, splash, openedAt), 250);
            }
        });
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_UPLOAD && upload != null) {
            upload.onReceiveValue(result == RESULT_OK && data != null ? new Uri[]{data.getData()} : null);
            upload = null;
        }
        if (request == SAVE_FORECAST) {
            String url = pendingCsvUrl;
            pendingCsvUrl = null;
            if (result == RESULT_OK && url != null && data != null && data.getData() != null) {
                saveForecast(url, data.getData());
            }
        }
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else if (web != null && BuildConfig.SERVER_URL.isEmpty()) { web.destroy(); web = null; showConnection(); }
        else super.onBackPressed();
    }
}

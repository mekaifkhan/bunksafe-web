# Android & Flutter Wrapper Integration Guide

This guide details how to integrate BunkSafe (React + Vite + TypeScript web application) into an Android or Flutter wrapper (using WebViews) and configure Firebase Cloud Messaging (FCM) push notifications seamlessly.

---

## 1. Interaction Architecture

The interaction model is simple, reliable, and secure:
1. **WebView Loading**: The Android / Flutter wrapper loads the hosted BunkSafe URL.
2. **Token & Device ID Injection**: Once the WebView is initialized and loaded, the native code retrieves the device's unique identifier (e.g. `Settings.Secure.ANDROID_ID`) and the Firebase Cloud Messaging (FCM) Token.
3. **Global Window Handlers**: The native code executes lightweight JavaScript on the WebView to call BunkSafe's exposed global functions:
   - `window.setDeviceID(id)` / `window.updateDeviceID(id)`
   - `window.setFCMToken(token)` / `window.updateFCMToken(token)` / `window.onFCMTokenReceived(token)`
4. **Automatic Synchronization**: BunkSafe receives these values, stores them in `localStorage`, and triggers our high-efficiency, single-write-per-day sync module after 12:55 PM IST to update the Firestore `notificationDevices` database.

---

## 2. Android Native (Kotlin) Integration

### Step A: Configure WebView
In your Activity's layout or programmatically, instantiate your WebView with JavaScript enabled:

```kotlin
import android.annotation.SuppressLint
import android.os.Bundle
import android.provider.Settings
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.messaging.FirebaseMessaging

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        // Enable JavaScript and local storage
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // When page load completes, inject Device ID and current FCM Token
                injectDeviceCredentials()
            }
        }

        // Replace with your actual hosted web app URL (e.g. Vercel deployment)
        webView.loadUrl("https://bunksafe.example.com")
    }

    private fun injectDeviceCredentials() {
        // 1. Retrieve & Inject unique Android Device ID
        val androidId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: ""
        if (androidId.isNotEmpty()) {
            webView.evaluateJavascript("window.setDeviceID('$androidId');", null)
        }

        // 2. Retrieve & Inject FCM token from Firebase SDK
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful && task.result != null) {
                val token = task.result
                webView.evaluateJavascript("window.setFCMToken('$token');", null)
            }
        }
    }
}
```

### Step B: Handle Token Updates (Background / Foreground)
Implement your Firebase Messaging Service in the Android App to pass any refreshed tokens to the active WebView automatically:

```kotlin
import com.google.firebase.messaging.FirebaseMessagingService
import android.os.Handler
import android.os.Looper

class MyFirebaseService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        
        // Log the refreshed token for debugging
        android.util.Log.d("FCM_TOKEN", "Refreshed token: $token")

        // If the webview is active, update the token dynamically
        Handler(Looper.getMainLooper()).post {
            // Locate your active activity and inject:
            // activity.webView.evaluateJavascript("window.updateFCMToken('$token');", null)
        }
    }
}
```

---

## 3. Flutter WebView Integration

If you are using Flutter, you can use the official `webview_flutter` package to handle the integration.

### Step A: Implement WebView Widget
Add the dependencies `webview_flutter` and `firebase_messaging` to your `pubspec.yaml`, then implement your webview widget:

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

class BunkSafeWebView extends StatefulWidget {
  const BunkSafeWebView({Key? key}) : super(key: key);

  @override
  State<BunkSafeWebView> createState() => _BunkSafeWebViewState();
}

class _BunkSafeWebViewState extends State<BunkSafeWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            // Inject credentials once page loads
            _injectDeviceCredentials();
          },
        ),
      )
      // Replace with your actual hosted web app URL (e.g. Vercel deployment)
      ..loadRequest(Uri.parse('https://bunksafe.example.com'));

    // Listen to token refreshes dynamically
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      _controller.runJavaScript("window.updateFCMToken('$newToken');");
    });
  }

  Future<void> _injectDeviceCredentials() async {
    try {
      // 1. Fetch Unique Device ID
      String deviceId = "";
      final deviceInfo = DeviceInfoPlugin();
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        deviceId = androidInfo.id; // Unique hardware ID
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        deviceId = iosInfo.identifierForVendor ?? "";
      }

      if (deviceId.isNotEmpty) {
        await _controller.runJavaScript("window.setDeviceID('$deviceId');");
      }

      // 2. Fetch Firebase Token
      String? token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _controller.runJavaScript("window.setFCMToken('$token');");
      }
    } catch (e) {
      debugPrint("Error injecting credentials into WebView: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: WebViewWidget(controller: _controller),
      ),
    );
  }
}
```

---

## 4. Summary of Benefits of This Method

1. **Zero Setup Cost**: The web app operates exactly as a mobile application without importing bulky SDK bundles client-side.
2. **Unified Data Storage**: Both physical Android devices and standard Web/PWA clients map to the exact same Firestore collection schema.
3. **Notification Delivery Reliability**: The background scheduler (`/api/cron/send-reminders`) targeting `FLUTTER_NOTIFICATION_CLICK` allows native Android launchers and Flutter engines to handle click actions without any additional custom payload mapping.

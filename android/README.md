# BunkSafe Android WebView Wrapper integration Guide

This directory contains the production-ready code to resolve the **Google Sign-In Error 403 (disallowed_useragent)** issue within your Kotlin Android WebView wrapper app.

Following Google's OAuth best practices, the Google login process is routed outside of the restricted WebView environment into a secure **Chrome Custom Tab** (or device default browser) and safely deep-linked back to the native app to restore the logged-in session instantly inside the WebView.

---

## 🛠️ Step-by-Step Integration

### 1. Add Custom Tabs Dependency
Open your app-level `build.gradle` file (`app/build.gradle`) and add the **AndroidX Browser** library to your `dependencies` block:
```groovy
dependencies {
    // Chrome Custom Tabs library for OAuth
    implementation 'androidx.browser:browser:1.5.0'
}
```

### 2. Configure AndroidManifest.xml
To receive the authentication token back from Chrome Custom Tabs, your MainActivity must declare a custom URI scheme listener. Update your `AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:configChanges="orientation|screenSize|keyboardHidden">
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.category.LAUNCHER" />
    </intent-filter>

    <!-- Deep Link Intent Filter for Auth Callback -->
    <intent-filter android:label="BunkSafe OAuth Callback">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.category.DEFAULT" />
        <category android:name="android.category.BROWSABLE" />
        
        <!-- Matches bunksafe://auth_success -->
        <data android:scheme="bunksafe" />
        <data android:host="auth_success" />
    </intent-filter>
</activity>
```

### 3. Replace MainActivity.kt
Copy the contents of `MainActivity.kt` from this directory into your Android project. 
* Make sure to adjust the `package com.bunksafe.app` name at the top to match your actual package name.
* Replace the `webAppUrl` variable with your live production URL (it is currently configured to use your development URL: `https://ais-dev-lcvtzroand56ayfvwkbrrt-628033860104.asia-southeast1.run.app`).

---

## 🔄 How the Flow Works Under the Hood

1. **WebView Load**: The user loads the website in your Android App's WebView.
2. **Continue with Google Click**: The user clicks the Google Sign-In button on the website.
3. **Bridge Interception**: The website detects it is running inside the Android app (via the injected `AndroidBridge` Javascript Interface) and delegates authentication to the native app.
4. **Launch Custom Tab**: The native app opens a secure **Chrome Custom Tab** loaded with the login redirect URL (`https://<domain>/?login_mode=custom_tab`).
5. **Secure Sign-In**: Because Chrome Custom Tabs is a real Chrome instance, Google permits Google Sign-In with 100% security. The login finishes and redirects back to the website inside Custom Tabs.
6. **Deep Link Redirect**: The website (now successfully logged in inside Custom Tabs) gets the Firebase ID Token and redirects to `bunksafe://auth_success?idToken=<TOKEN>`.
7. **Session Token Injection**: Your `MainActivity` intercepts this deep link, receives the ID Token, closes the Custom Tab, and injects the token into the WebView via JavaScript (`window.signInWithGoogleToken`).
8. **Automatic Persistence**: Firebase Web SDK signs in using the injected token. The WebView saves the session inside standard persistent HTML5 Storage.
9. **Instant Future Opens**: The next time the user launches the app, the session is preserved, requiring **zero** repeat logins!

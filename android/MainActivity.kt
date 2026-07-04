package com.bunksafe.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    // Replace with your production web app URL
    private val webAppUrl = "https://ais-dev-lcvtzroand56ayfvwkbrrt-628033860104.asia-southeast1.run.app"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Initialize WebView programmatically or load from layout
        webView = WebView(this)
        setContentView(webView)

        // 2. Configure WebView Settings for optimal web-app execution
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Enable persistent cookies & cross-site session management
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        // Prevent typical user-agent detection blocks (Google Sign-In web client)
        // while also identifying as BunkSafe Android App
        val defaultUserAgent = settings.userAgentString
        val cleanUserAgent = defaultUserAgent
            .replace("; wv", "")
            .replace("Version/[0-9.]+".toRegex(), "") + " BunkSafeAndroidWebView"
        settings.userAgentString = cleanUserAgent

        // 3. Register JavaScript Interface Bridge
        webView.addJavascriptInterface(AndroidBridge(), "AndroidBridge")

        // 4. Configure custom WebViewClient to handle in-app navigation
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                
                // If user clicks a standard Google Sign-In, force launch Chrome Custom Tabs
                if (url.contains("accounts.google.com") || url.contains("__/auth/handler")) {
                    launchChromeCustomTab(url)
                    return true
                }
                return false
            }
        }

        // 5. Load main URL (checking if this activity was started by an OAuth redirect deep link)
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    /**
     * Intercept deep links from Chrome Custom Tabs (e.g. bunksafe://auth_success?idToken=...)
     */
    private fun handleIntent(intent: Intent?) {
        val appLinkData: Uri? = intent?.data
        if (appLinkData != null && "bunksafe" == appLinkData.scheme && "auth_success" == appLinkData.host) {
            val idToken = appLinkData.getQueryParameter("idToken")
            if (!idToken.isNullOrEmpty()) {
                // User successfully logged in via Chrome Custom Tabs!
                // Inject the ID token into the running WebView instance to log the user in.
                webView.post {
                    webView.evaluateJavascript("javascript:window.signInWithGoogleToken('$idToken')") { result ->
                        // Token injected successfully! The WebView is now logged in.
                    }
                }
                return
            }
        }

        // Default: If no deep link data, load the main web application home page
        webView.loadUrl(webAppUrl)
    }

    /**
     * Helper to launch Chrome Custom Tabs securely following Google's OAuth best practices
     */
    private fun launchChromeCustomTab(url: String) {
        val builder = CustomTabsIntent.Builder()
        builder.setShareState(CustomTabsIntent.SHARE_STATE_OFF)
        builder.setShowTitle(true)
        val customTabsIntent = builder.build()
        
        // Add flag to ensure Custom Tab session doesn't keep running in a separate task
        customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        
        try {
            customTabsIntent.launchUrl(this, Uri.parse(url))
        } catch (e: Exception) {
            // Fallback: If Chrome or Custom Tabs is not installed/disabled, launch default browser
            val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(browserIntent)
        }
    }

    /**
     * JavaScript Interface Bridge exposed to the React Web Application
     */
    inner class AndroidBridge {
        @JavascriptInterface
        fun onGoogleLoginClick() {
            runOnUiThread {
                // When "Continue with Google" is clicked, load the login page with custom_tab login mode
                // so that it triggers automatic Google Redirect in the Chrome Custom Tab!
                val loginUrl = "$webAppUrl/?login_mode=custom_tab"
                launchChromeCustomTab(loginUrl)
            }
        }
    }

    /**
     * Handle physical device back button navigation inside WebView
     */
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}

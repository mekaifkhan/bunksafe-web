/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

// WARNING: Client-side exposure of third-party API keys is acceptable here as it is standard practice
// for Firebase Client SDK configuration, but keep in mind that these keys are readable in browser builds.
const firebaseConfig = {
  apiKey: "AIzaSyBghm3BGlW-keoTOePkyOlCZjFoLO_-Pu8",
  authDomain: "bunksafe-by-kaif-khan.firebaseapp.com",
  projectId: "bunksafe-by-kaif-khan",
  storageBucket: "bunksafe-by-kaif-khan.firebasestorage.app",
  messagingSenderId: "411120043089",
  appId: "1:411120043089:web:11de1f9679f76661fea470",
  measurementId: "G-75S073ZQ6Q"
};

const isBrowser = typeof window !== 'undefined';
const isProd = !!(import.meta as any).env?.PROD;

let app;
let analytics: Analytics | undefined;

if (isBrowser) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  if (isProd) {
    analytics = getAnalytics(app);
  }
}

/**
 * Log a page view event with path, URL and title information.
 */
export function trackPageView(pagePath: string) {
  if (analytics) {
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      page_title: typeof document !== 'undefined' ? document.title : '',
    });
  }
}

// Intercept History API to track SPA route changes automatically
if (isBrowser && isProd) {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (state: any, unused: string, url?: string | URL | null) {
    originalPushState.apply(window.history, [state, unused, url]);
    let path = window.location.pathname;
    if (url) {
      if (url instanceof URL) {
        path = url.pathname;
      } else {
        try {
          const parsed = new URL(url, window.location.origin);
          path = parsed.pathname;
        } catch {
          path = String(url).split('?')[0].split('#')[0];
        }
      }
    }
    trackPageView(path);
  };

  window.history.replaceState = function (state: any, unused: string, url?: string | URL | null) {
    originalReplaceState.apply(window.history, [state, unused, url]);
    let path = window.location.pathname;
    if (url) {
      if (url instanceof URL) {
        path = url.pathname;
      } else {
        try {
          const parsed = new URL(url, window.location.origin);
          path = parsed.pathname;
        } catch {
          path = String(url).split('?')[0].split('#')[0];
        }
      }
    }
    trackPageView(path);
  };

  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname);
  });

  // Track the initial page view when the window loads
  if (document.readyState === 'complete') {
    trackPageView(window.location.pathname);
  } else {
    window.addEventListener('load', () => {
      trackPageView(window.location.pathname);
    });
  }
}

export { app, analytics };

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

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
export let db: any;

if (isBrowser) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  if (isProd) {
    analytics = getAnalytics(app);
  }
}

/**
 * Sync subjects list to Firestore
 */
export async function saveUserSubjectsToFirestore(email: string, subjects: any[]) {
  if (!db || !email) return;
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userDocRef, { subjects }, { merge: true });
    console.log('Successfully synced subjects to Firestore for:', email);
  } catch (error: any) {
    const isOffline = error instanceof Error && (
      error.message.toLowerCase().includes('offline') || 
      error.message.toLowerCase().includes('unavailable') || 
      (error as any).code === 'unavailable'
    );
    if (isOffline) {
      console.warn('Firestore is offline. Subject sync to cloud will resume when online.');
    } else {
      console.error('Error syncing subjects to Firestore:', error);
    }
  }
}

/**
 * Sync user profile to Firestore
 */
export async function saveUserProfileToFirestore(email: string, profile: any) {
  if (!db || !email) return;
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    await setDoc(userDocRef, { profile }, { merge: true });
    console.log('Successfully synced profile to Firestore for:', email);
  } catch (error: any) {
    const isOffline = error instanceof Error && (
      error.message.toLowerCase().includes('offline') || 
      error.message.toLowerCase().includes('unavailable') || 
      (error as any).code === 'unavailable'
    );
    if (isOffline) {
      console.warn('Firestore is offline. Profile sync to cloud will resume when online.');
    } else {
      console.error('Error syncing profile to Firestore:', error);
    }
  }
}

/**
 * Load user profile from Firestore
 */
export async function loadUserProfileFromFirestore(email: string): Promise<any | null> {
  if (!db || !email) return null;
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.profile || null;
    }
  } catch (error: any) {
    console.error('Error loading profile from Firestore:', error);
  }
  return null;
}

/**
 * Load subjects list from Firestore
 */
export async function loadUserSubjectsFromFirestore(email: string): Promise<any[] | null> {
  if (!db || !email) return null;
  try {
    const userDocRef = doc(db, 'users', email.toLowerCase().trim());
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.subjects || null;
    }
  } catch (error: any) {
    const isOffline = error instanceof Error && (
      error.message.toLowerCase().includes('offline') || 
      error.message.toLowerCase().includes('unavailable') || 
      (error as any).code === 'unavailable'
    );
    if (isOffline) {
      console.warn('Firestore is offline. Could not load subjects from cloud; using local fallback.');
    } else {
      console.error('Error loading subjects from Firestore:', error);
    }
  }
  return null;
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

/**
 * Log a custom event with properties.
 */
export function logCustomEvent(eventName: string, params?: Record<string, any>) {
  if (analytics) {
    logEvent(analytics, eventName, params);
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

/**
 * Submit a feature request to Firestore
 */
export async function addFeatureRequestToFirestore(email: string, title: string, description: string) {
  if (!db) return;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const requestDocRef = doc(db, 'featureRequests', requestId);
  const payload = {
    id: requestId,
    email: email.toLowerCase().trim(),
    title: title.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await setDoc(requestDocRef, payload);
}

/**
 * Fetch latest app version config from Firestore
 */
export async function fetchLatestAppVersionFromFirestore() {
  if (!db) return null;
  try {
    const configDocRef = doc(db, 'appConfig', 'version');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error('Error fetching latest app version:', error);
  }
  return null;
}

/**
 * Fetch changelogs from Firestore
 */
export async function fetchChangelogsFromFirestore() {
  if (!db) return [];
  try {
    const changelogCol = collection(db, 'changelog');
    const q = query(changelogCol, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push(docSnap.data());
    });
    return logs;
  } catch (error) {
    console.error('Error fetching changelogs:', error);
    return [];
  }
}

/**
 * Delete user account and Firestore documents
 */
export async function deleteUserAccountFromFirestore(email: string) {
  if (!db || !email) return;
  const userDocRef = doc(db, 'users', email.toLowerCase().trim());
  await deleteDoc(userDocRef);
  console.log('Successfully deleted user document from Firestore:', email);
}

// Zero-trust Security Error Handling enum
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Compliance-aligned error wrapper for permission failures
export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('insufficient')) {
    const errInfo = {
      error: message,
      operationType,
      path,
      authInfo: {
        userId: null,
        email: null,
        emailVerified: null,
        isAnonymous: null,
        tenantId: null,
        providerInfo: []
      }
    };
    throw new Error(JSON.stringify(errInfo));
  }
  throw error;
}

export interface NotificationDeviceData {
  deviceId: string;
  fcmToken: string;
  notificationEnabled: boolean;
  todayAttendance: boolean;
  semesterActive: boolean;
  holidayToday: boolean;
  timezone: string;
  lastSync: string;
  lastReminderBypassDate: string;
}

/**
 * Synchronize device registration state to Firestore (minimal writes pattern)
 */
export async function syncNotificationDeviceToFirestore(data: NotificationDeviceData) {
  if (!db) return;
  const path = `notificationDevices/${data.deviceId}`;
  try {
    const deviceDocRef = doc(db, 'notificationDevices', data.deviceId);
    await setDoc(deviceDocRef, data, { merge: true });
    console.log('Successfully synced notification device to Firestore:', data.deviceId);
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export { app, analytics };

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

let app: any;
let analytics: Analytics | undefined;
let db: any;
let auth: any;
let storage: any;
let messaging: any;

if (isBrowser) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('Firebase Messaging is not supported in this browser/environment:', e);
  }
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

export { 
  app, 
  analytics, 
  db, 
  auth, 
  storage, 
  messaging, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  getToken,
  onMessage
};

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle() {
  if (!auth) throw new Error("Auth is not initialized");
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  if (!auth) throw new Error("Auth is not initialized");
  await signOut(auth);
}

/**
 * Upload profile photo to Storage, save download URL in Firestore
 */
export async function uploadProfilePhoto(uid: string, fileBlob: Blob): Promise<string> {
  if (!storage) throw new Error("Storage is not initialized");
  
  // Create a unique name for the file
  const photoRef = ref(storage, `users/${uid}/profile_photo_${Date.now()}.jpg`);
  
  // Upload bytes
  await uploadBytes(photoRef, fileBlob, { contentType: 'image/jpeg' });
  
  // Get download url
  const downloadURL = await getDownloadURL(photoRef);
  
  // Update in Firestore under users/{uid}
  if (db) {
    const uidDocRef = doc(db, 'users', uid);
    await setDoc(uidDocRef, { photoURL: downloadURL }, { merge: true });
    
    // Also save in users/{email} if logged in and has email
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      const emailDocRef = doc(db, 'users', currentUser.email.toLowerCase().trim());
      await setDoc(emailDocRef, { photoURL: downloadURL }, { merge: true });
    }
  }
  
  return downloadURL;
}

/**
 * Save FCM token to Firestore
 */
export async function saveFCMTokenToFirestore(uid: string, token: string) {
  if (!db) return;
  try {
    const uidDocRef = doc(db, 'users', uid);
    await setDoc(uidDocRef, { fcmToken: token }, { merge: true });
    
    const currentUser = auth?.currentUser;
    if (currentUser && currentUser.email) {
      const emailDocRef = doc(db, 'users', currentUser.email.toLowerCase().trim());
      await setDoc(emailDocRef, { fcmToken: token }, { merge: true });
    }
    console.log('Saved FCM Token to Firestore successfully.');
  } catch (error) {
    console.error('Error saving FCM Token to Firestore:', error);
  }
}

/**
 * Save current user attendance state for the scheduler to check
 */
export async function saveUserAttendanceStatusToFirestore(uid: string, markedDate: string, marked: boolean) {
  if (!db) return;
  try {
    const statusData = {
      lastAttendanceMarkedDate: marked ? markedDate : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      lastSync: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', uid), statusData, { merge: true });
    
    const currentUser = auth?.currentUser;
    if (currentUser && currentUser.email) {
      await setDoc(doc(db, 'users', currentUser.email.toLowerCase().trim()), statusData, { merge: true });
    }
    console.log('Saved user attendance status successfully.');
  } catch (error) {
    console.error('Error saving user attendance status to Firestore:', error);
  }
}


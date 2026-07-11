/**
 * Android WebView Integration Utilities
 */

declare global {
  interface Window {
    Android?: {
      getDeviceToken?: () => string;
      onTokenSaved?: (token: string) => void;
      [key: string]: any;
    };
    setDeviceToken?: (token: string) => void;
  }
}

/**
 * Saves the device token to localStorage and optionally communicates with Android interface.
 * @param token The push notification token from Android app
 */
export const saveDeviceToken = (token: string): void => {
  if (!token) return;
  localStorage.setItem('deviceToken', token);
  
  // Expose to future Android integration if interface exists
  if (window.Android && typeof window.Android.onTokenSaved === 'function') {
    try {
      window.Android.onTokenSaved(token);
    } catch (e) {
      console.error('Error communicating with Android.onTokenSaved:', e);
    }
  }
};

/**
 * Retrieves the current device token from localStorage.
 * If window.Android has a getDeviceToken method, it can also pull from it.
 */
export const getDeviceToken = (): string => {
  // First check if Android WebView has token
  if (window.Android && typeof window.Android.getDeviceToken === 'function') {
    try {
      const androidToken = window.Android.getDeviceToken();
      if (androidToken) {
        localStorage.setItem('deviceToken', androidToken);
        return androidToken;
      }
    } catch (e) {
      console.error('Error communicating with Android.getDeviceToken:', e);
    }
  }
  
  return localStorage.getItem('deviceToken') || '';
};

// Expose a global window method on module load so that Android WebView 
// can execute window.setDeviceToken(token) directly to inject the token.
if (typeof window !== 'undefined') {
  window.setDeviceToken = (token: string) => {
    saveDeviceToken(token);
    // Dispatch a custom event to notify React components if needed
    window.dispatchEvent(new CustomEvent('deviceTokenUpdated', { detail: token }));
  };
}

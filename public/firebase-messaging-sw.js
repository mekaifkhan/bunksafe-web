/**
 * Firebase Cloud Messaging Service Worker
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBghm3BGlW-keoTOePkyOlCZjFoLO_-Pu8",
  authDomain: "bunksafe-by-kaif-khan.firebaseapp.com",
  projectId: "bunksafe-by-kaif-khan",
  storageBucket: "bunksafe-by-kaif-khan.firebasestorage.app",
  messagingSenderId: "411120043089",
  appId: "1:411120043089:web:11de1f9679f76661fea470"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Attendance Reminder';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Check your BunkSafe app!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

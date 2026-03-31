import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOJGuTj0Cef14wJg-cbW0husAbg28POzc",
  authDomain: "bunksafe-504ff.firebaseapp.com",
  projectId: "bunksafe-504ff",
  storageBucket: "bunksafe-504ff.firebasestorage.app",
  messagingSenderId: "1034144060078",
  appId: "1:1034144060078:web:a38d1b3ba74c4a972ad33f",
  measurementId: "G-86Z5RZX52Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, analytics };

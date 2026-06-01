import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD2OF0ahcRoP6OLSg4teF1_2bCS13qrJGI",
  authDomain: "nva-nutrition.firebaseapp.com",
  projectId: "nva-nutrition",
  storageBucket: "nva-nutrition.firebasestorage.app",
  messagingSenderId: "1023398804980",
  appId: "1:1023398804980:web:1d69d3a9832e8bf730cda1",
  measurementId: "G-KJRDXGPWX8"
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, db, storage };
export default app;

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config provided by user
const firebaseConfig = {
  apiKey: "AIzaSyAZUngRAWIL6Cl4hIOXyLAGsk_SpGKVJgI",
  authDomain: "cryptoflow-5b73f.firebaseapp.com",
  projectId: "cryptoflow-5b73f",
  storageBucket: "cryptoflow-5b73f.firebasestorage.app",
  messagingSenderId: "402315436233",
  appId: "1:402315436233:web:0c82d63d42251635f6ad18",
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

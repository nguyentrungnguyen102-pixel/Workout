import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Fallback to hardcoded config if env vars are missing (e.g., CI build without secrets)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAla7oWcRhIuslwOmYFzilM2gUSDe-i-Cs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'workout-tracker-84dde.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'workout-tracker-84dde',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'workout-tracker-84dde.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '764158109651',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:764158109651:web:e484e0cf0c881aad41f126',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

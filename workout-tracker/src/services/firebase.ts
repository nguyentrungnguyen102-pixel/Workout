import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import Constants from 'expo-constants';

// In dev mode, use Firebase Emulator (no real project needed).
// In production, replace with real Firebase config via .env
const USE_EMULATOR = __DEV__ && !process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = USE_EMULATOR
  ? {
      // demo-* prefix tells Firebase SDK this is an emulator project
      apiKey: 'demo-key',
      authDomain: 'demo-workout.firebaseapp.com',
      projectId: 'demo-workout',
      storageBucket: 'demo-workout.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:0000000000000000',
    }
  : {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
    };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to local emulators when in dev mode.
// try/catch guards against "already connected" on hot reload.
if (USE_EMULATOR) {
  const host =
    Constants.expoConfig?.hostUri?.split(':')[0] ||
    'localhost';

  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  } catch { /* already connected */ }
  try {
    connectFirestoreEmulator(db, host, 8080);
  } catch { /* already connected */ }
}

export default app;

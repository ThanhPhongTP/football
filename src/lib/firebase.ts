import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export function getClientFirebaseConfig(): FirebaseConfig | null {
  // Check localStorage first (in case user pasted config in UI)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('footdraw_firebase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch {
        // ignore parse error
      }
    }
  }

  // Check Next.js public environment variables
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }

  return null;
}

export function initFirebase(): { app: FirebaseApp | null; db: Firestore | null } {
  const config = getClientFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const db = getFirestore(app);
    return { app, db };
  } catch (error) {
    console.warn('Firebase initialization error:', error);
    return { app: null, db: null };
  }
}


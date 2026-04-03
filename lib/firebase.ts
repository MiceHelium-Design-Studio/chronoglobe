import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const requiredFirebaseClientKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

interface FirebaseClientState {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  error: Error | null;
}

let cachedState: FirebaseClientState | null = null;

function missingFirebaseKeys(): string[] {
  return requiredFirebaseClientKeys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

function createFirebaseState(): FirebaseClientState {
  if (typeof window === 'undefined') {
    return {
      app: null,
      auth: null,
      db: null,
      error: null,
    };
  }

  const missing = missingFirebaseKeys();
  if (missing.length > 0) {
    return {
      app: null,
      auth: null,
      db: null,
      error: new Error(
        [
          'Firebase client is not configured for this environment.',
          `Missing keys: ${missing.join(', ')}`,
        ].join(' '),
      ),
    };
  }

  try {
    const app =
      getApps().length > 0
        ? getApp()
        : initializeApp({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
          });

    return {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      error: null,
    };
  } catch (error) {
    return {
      app: null,
      auth: null,
      db: null,
      error:
        error instanceof Error
          ? error
          : new Error('Failed to initialize Firebase client SDK.'),
    };
  }
}

function getFirebaseState(): FirebaseClientState {
  if (cachedState) {
    return cachedState;
  }

  cachedState = createFirebaseState();
  return cachedState;
}

export function getFirebaseInitializationError(): Error | null {
  return getFirebaseState().error;
}

export const auth = getFirebaseState().auth;
export const db = getFirebaseState().db;

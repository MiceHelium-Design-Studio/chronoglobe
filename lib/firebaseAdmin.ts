import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminEnv } from './env';

const FIREBASE_ADMIN_APP_NAME = 'atlaswire-admin';

function getPrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function getAdminApp() {
  const existing = getApps().find((app) => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existing) {
    return existing;
  }

  const env = getFirebaseAdminEnv();

  return initializeApp(
    {
      credential: cert({
        projectId: env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: getPrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY),
      }),
    },
    FIREBASE_ADMIN_APP_NAME,
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getAdminApp());
}

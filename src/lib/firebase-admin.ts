import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only when needed (runtime, not build time)
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return { auth: getAuth(), db: getFirestore() };
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables');
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });

  return { auth: getAuth(), db: getFirestore() };
}

// Export functions that initialize when called
export const getAdminAuth = () => initializeFirebaseAdmin().auth;
export const getAdminDb = () => initializeFirebaseAdmin().db;

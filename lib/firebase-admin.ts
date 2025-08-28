import * as admin from "firebase-admin";

const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        // If running on Vercel, prefer cert JSON via env, or use
        // admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!))
      });

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
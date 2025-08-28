import * as admin from "firebase-admin";
import { env } from "./env";

let firebaseAuth: admin.auth.Auth | null = null;
let firebaseDb: admin.firestore.Firestore | null = null;

// Initialize Firebase Admin SDK only if credentials are provided
if (env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL) {
  const serviceAccount = {
    projectId: env.FIREBASE_PROJECT_ID,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
  }
  
  firebaseAuth = admin.auth();
  firebaseDb = admin.firestore();
  // Avoid Firestore errors on undefined values
  firebaseDb.settings({ ignoreUndefinedProperties: true });
}

export { firebaseAuth, firebaseDb };
export default admin;

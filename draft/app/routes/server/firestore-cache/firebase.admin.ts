import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let db: FirebaseFirestore.Firestore;

export function getFirestoreInstance() {
    if (!db) {
        if (getApps().length === 0) {
            if (process.env.VITE_FIREBASE_SERVICE_ACCOUNT_KEY) {
                const serviceAccountJson = atob(process.env.VITE_FIREBASE_SERVICE_ACCOUNT_KEY);
                const serviceAccount = JSON.parse(serviceAccountJson);

                initializeApp({
                    credential: cert(serviceAccount),
                    // databaseURL: process.env.FIREBASE_DATABASE_URL // if using Realtime Database
                });
            } else {
                initializeApp();
            }
        }
//
        db = getFirestore(undefined, 'draft');
    }
    return db;
}

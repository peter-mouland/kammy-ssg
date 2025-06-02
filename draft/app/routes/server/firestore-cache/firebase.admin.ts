import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from 'firebase-admin/database';

let db: FirebaseFirestore.Firestore;

const FIRESTORE_ADMIN_APP_NAME = 'firestore-admin'
const serviceAccountJson = atob(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const serviceAccount = JSON.parse(serviceAccountJson);
const existingApps = getApps();
const existingApp = existingApps.find(app => app.name === FIRESTORE_ADMIN_APP_NAME);

export function getFirestoreInstance() {
    if (!db) {
        let app
        if (existingApp) {
            app = existingApp;
        } else {
            if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                app = initializeApp({
                    credential: cert(serviceAccount),
                    // databaseURL: process.env.FIREBASE_DATABASE_URL // if using Realtime Database
                }, FIRESTORE_ADMIN_APP_NAME);
            }
        }

        db = getFirestore(app, 'draft');
    }
    return db;
}

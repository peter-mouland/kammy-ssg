import { initializeApp, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from 'firebase/app';

let db: FirebaseFirestore.Firestore;

const FIRESTORE_ADMIN_APP_NAME = 'firestore-admin'
const serviceAccountJson = atob(process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY);
const serviceAccount = JSON.parse(serviceAccountJson);

export function getFirestoreInstance() {
    if (!db) {
        const existingApps = getApps();
        let app = existingApps.find(app => app.name === FIRESTORE_ADMIN_APP_NAME);
        if (!app) {
            if (process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY) {
                app = initializeApp({
                    credential: cert(serviceAccount),
                    // databaseURL: process.env.FIREBASE_DATABASE_URL // if using Realtime Database
                }, FIRESTORE_ADMIN_APP_NAME);
                console.log('🔥 Firebase Admin store initialized for project:', serviceAccount.project_id);
            }
        }
        db = getFirestore(app, 'draft');
    }
    return db;
}

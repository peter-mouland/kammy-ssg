// lib/firebase-admin-realtime.ts - Realtime Database Admin SDK with unique app name
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getApps } from 'firebase/app';

// Use a unique app name for Realtime Database admin
const REALTIME_ADMIN_APP_NAME = 'admin-realtime-draft';
const serviceAccountJson = atob(process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY);
const serviceAccount = JSON.parse(serviceAccountJson);

// Get or create the Realtime Database app
let realtimeDB;

export function getRealtimeAdminDbInstance() {
    if (!realtimeDB) {
        const existingApps = getApps();

        let realtimeApp = existingApps.find(app => app.name === REALTIME_ADMIN_APP_NAME);
        if (!realtimeApp) {
            realtimeApp = initializeApp({
                credential: cert(serviceAccount),
                // IMPORTANT: Realtime Database requires the databaseURL
                databaseURL: process.env.MY_FIREBASE_DATABASE_URL
            }, REALTIME_ADMIN_APP_NAME);
            console.log('🔥 Firebase Admin Realtime Database initialized for project:', process.env.FIREBASE_PROJECT_ID);
        }
        realtimeDB = getDatabase(realtimeApp)
    }
    return realtimeDB;
}

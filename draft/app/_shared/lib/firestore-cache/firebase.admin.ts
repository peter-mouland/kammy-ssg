// app/_shared/lib/firestore-cache/firebase.admin.ts

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db: FirebaseFirestore.Firestore;

const FIRESTORE_ADMIN_APP_NAME = 'firestore-admin';
// draft in prod, (default) in dev
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'draft';

// Parse service account once
let serviceAccount: Record<string, string>;
if (process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        const serviceAccountJson = atob(process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY);
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (error) {
        console.error('❌ Failed to parse Firebase service account key:', error);
        throw new Error('Invalid Firebase service account configuration');
    }
}

export function getFirestoreInstance() {
    if (!db) {
        if (!serviceAccount) {
            throw new Error('Firebase service account not configured');
        }

        try {
            // FIXED: Use admin SDK getApps instead of client SDK
            const existingApps = getApps();
            let app = existingApps.find((app) => app.name === FIRESTORE_ADMIN_APP_NAME);

            if (app) {
                console.log('🔥 Using existing Firebase Admin app:', FIRESTORE_ADMIN_APP_NAME);
            } else {
                // Initialize new app
                app = initializeApp(
                    {
                        credential: cert(serviceAccount),
                        // databaseURL: process.env.FIREBASE_DATABASE_URL // if using Realtime Database
                    },
                    FIRESTORE_ADMIN_APP_NAME,
                );

                console.log('🔥 Firebase Admin store initialized for project:', serviceAccount.project_id);
            }

            // Get Firestore with custom database name if needed
            db = getFirestore(app, FIRESTORE_DATABASE_ID);
        } catch (error) {
            console.error('❌ Firebase Admin initialization failed:', error);

            // HOTFIX: If app already exists error, try to get existing app
            if (error instanceof Error && error.message.includes('already exists')) {
                try {
                    const app = getApp(FIRESTORE_ADMIN_APP_NAME);
                    db = getFirestore(app, FIRESTORE_DATABASE_ID);
                    console.log('🔄 Recovered by using existing Firebase app');
                } catch (getAppError) {
                    console.error('❌ Failed to recover Firebase app:', getAppError);
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }

    return db;
}

// OPTIONAL: Add cleanup function for development
export function resetFirebaseInstance() {
    db = undefined as unknown as FirebaseFirestore.Firestore;
    console.log('🔄 Firebase instance reset for hot reload');
}

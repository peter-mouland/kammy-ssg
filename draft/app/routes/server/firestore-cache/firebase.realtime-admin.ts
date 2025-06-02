// lib/firebase-admin-realtime.ts - Realtime Database Admin SDK with unique app name
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Use a unique app name for Realtime Database admin
const REALTIME_ADMIN_APP_NAME = 'admin-realtime-draft';

// Check if we already have this specific app initialized
let app;
const serviceAccountJson = atob(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const serviceAccount = JSON.parse(serviceAccountJson);
const existingApps = getApps();
const existingApp = existingApps.find(app => app.name === REALTIME_ADMIN_APP_NAME);

if (existingApp) {
    console.log('🔥 Using existing Realtime Database admin app');
    app = existingApp;
} else {
    console.log('🔥 Creating new Realtime Database admin app');
    app = initializeApp({
        credential: cert(serviceAccount),
        // IMPORTANT: Realtime Database requires the databaseURL
        databaseURL: process.env.FIREBASE_DATABASE_URL
    }, REALTIME_ADMIN_APP_NAME);
}

// Get Realtime Database instance
export const adminDatabase = getDatabase(app);

// Validate configuration
if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error('FIREBASE_DATABASE_URL environment variable is required for Realtime Database');
}

const adminCredsEnv = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
const adminCred64 = serviceAccount.project_id && serviceAccount.client_email && serviceAccount.private_key

if (!adminCred64 && !adminCredsEnv) {
    throw new Error('Missing Firebase Admin credentials. Please check your environment variables.');
}
console.log('🔥 Firebase Admin Realtime Database initialized for project:', process.env.FIREBASE_PROJECT_ID);

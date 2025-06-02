// lib/firebase-realtime.ts - SEPARATE config just for Realtime Database
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Realtime Database specific config
const realtimeConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config
if (!realtimeConfig.apiKey || !realtimeConfig.databaseURL) {
    throw new Error('Missing Firebase Realtime Database configuration. Please check your environment variables.');
}

// Use a unique app name for Realtime Database
const REALTIME_APP_NAME = 'realtime-draft';

// Get or create the Realtime Database app
let realtimeDB;

export function getRealtimeDbInstance() {
    console.log('getRealtimeDbInstance')
    if (!realtimeDB) {
        const existingApps = getApps();
        let realtimeApp = existingApps.find(app => console.log(app) || app.name === REALTIME_APP_NAME);
        if (!realtimeApp) {
            realtimeApp = initializeApp(realtimeConfig, REALTIME_APP_NAME);
            console.log('🔥 Firebase Realtime Database client initialized for project:', realtimeConfig.projectId);
        }
        realtimeDB = getDatabase(realtimeApp)
    }
    return realtimeDB;
}

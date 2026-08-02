/* Location: app/draft/lib/firebase-client-config.ts */

import type { Database } from '@firebase/database';
// lib/firebase-realtime.ts - SEPARATE config just for Realtime Database
import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Realtime Database specific config
const realtimeConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Use a unique app name for Realtime Database
const REALTIME_APP_NAME = 'realtime-draft';

/**
 * Whether live draft sync can run at all.
 *
 * Exported so a caller can degrade rather than crash — the draft page still renders its
 * state from the sheets without it.
 */
export const hasRealtimeConfig = Boolean(realtimeConfig.apiKey && realtimeConfig.databaseURL);

// Get or create the Realtime Database app
let realtimeDB: Database;

export function getRealtimeDbInstance() {
    // Validated here, not at module scope. Throwing on import took down any process without
    // these variables *before a line of app code ran* -- including `yarn dev:fixtures`,
    // whose entire premise is that it needs no credentials. It only ever worked because
    // machines had a leftover `draft/.env`; on a clean checkout and on CI it could not boot.
    if (!hasRealtimeConfig) {
        throw new Error('Missing Firebase Realtime Database configuration. Please check your environment variables.');
    }

    if (!realtimeDB) {
        const existingApps = getApps();
        let realtimeApp = existingApps.find((app) => app.name === REALTIME_APP_NAME);
        if (!realtimeApp) {
            realtimeApp = initializeApp(realtimeConfig, REALTIME_APP_NAME);
            console.log('🔥 Firebase Realtime Database client initialized for project:', realtimeConfig.projectId);
        }
        realtimeDB = getDatabase(realtimeApp);
    }
    return realtimeDB;
}

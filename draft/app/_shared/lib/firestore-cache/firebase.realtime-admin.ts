/* Location: app/_shared/lib/firestore-cache/firebase.realtime-admin.ts */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { Database } from 'firebase-admin/database';
import { getDatabase } from 'firebase-admin/database';

// Use a unique app name for Realtime Database admin
const REALTIME_ADMIN_APP_NAME = 'admin-realtime-draft';

/**
 * Read the service account **when it is needed**, not when this module is imported.
 *
 * This used to run at module scope, where `JSON.parse(atob(undefined || ''))` throws
 * `Unexpected end of JSON input` on any process without the variable set. Importing this
 * module — or anything that re-exports something reaching it — therefore killed the process
 * before a line of app code ran.
 *
 * It hid because every machine that had ever run `yarn dev` had a leftover `draft/.env`.
 * On a clean checkout, and on CI, `yarn dev:fixtures` could not boot at all — which made
 * the fixture server's whole premise, *no credentials required*, quietly untrue. The route
 * crawl found it on its first CI run.
 */
function readServiceAccount(): Record<string, unknown> {
    const encoded = process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!encoded) {
        throw new Error(
            'MY_FIREBASE_SERVICE_ACCOUNT_KEY is not set, so the Realtime Database cannot be reached. ' +
                'Set it in .env.local, or run against fixtures where draft sync is skipped.',
        );
    }

    try {
        return JSON.parse(atob(encoded));
    } catch (error) {
        throw new Error('MY_FIREBASE_SERVICE_ACCOUNT_KEY is not valid base64-encoded JSON', { cause: error });
    }
}

// Get or create the Realtime Database app
let realtimeDB: Database;

export function getRealtimeAdminDbInstance() {
    if (!realtimeDB) {
        const existingApps = getApps();

        let realtimeApp = existingApps.find((app) => app.name === REALTIME_ADMIN_APP_NAME);
        if (!realtimeApp) {
            realtimeApp = initializeApp(
                {
                    credential: cert(readServiceAccount()),
                    // IMPORTANT: Realtime Database requires the databaseURL
                    databaseURL: process.env.MY_FIREBASE_DATABASE_URL,
                },
                REALTIME_ADMIN_APP_NAME,
            );
            console.log(
                '🔥 Firebase Admin Realtime Database initialized for project:',
                process.env.FIREBASE_PROJECT_ID,
            );
        }
        realtimeDB = getDatabase(realtimeApp);
    }
    return realtimeDB;
}

/* Location: app/draft/index.server.ts */

/**
 * The draft domain's SERVER-ONLY public API.
 *
 * Split from `index.ts` because the modules behind it touch Firebase and `process.env`
 * at import time — `firebase.realtime-admin` parses a service account at module scope.
 * Anything re-exporting that is unsafe to import from a component, so the two surfaces
 * are kept apart rather than relying on tree-shaking to save us.
 *
 * Rule of thumb: if it touches Firebase, Google Sheets or `process.env`, it goes here.
 * If a component could reasonably import it, it goes in `index.ts`.
 */

// Draft orchestration: keeps the Sheets draft and the Firebase Realtime draft in step.
// Lived in `_shared/lib/firestore-cache/` because `admin` and `draft` both need it and
// there was no legal way to share it from the domain until this file existed.
export { FirebaseDraftSync } from './server/firebase-draft-sync';

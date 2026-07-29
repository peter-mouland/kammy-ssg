/* Location: app/admin/index.server.ts */

/**
 * The admin domain's SERVER-ONLY public API.
 *
 * There is no `index.ts`: admin's components are its own dashboard, and nothing outside
 * admin should be rendering them.
 *
 * This one is the odd direction. Admin orchestrates other domains — that is its job, and
 * it is why P2.7 exists. But `draft` also needs to commit a completed draft to Firestore,
 * and that operation lives in admin's server actions, so the dependency runs the *wrong
 * way*: a feature domain reaching into admin.
 *
 * Exposing it here makes the reach legal but does not make it right — the underlying
 * modelling problem is logged in .kiro/backlog.md ("Found along the way", 2026-07-26) and
 * is part of the `admin <-> draft` cycle P2.6 has to settle. Treat this file as recording
 * a known inversion, not as an invitation to add more.
 */

// --- Committing teams to Firestore -------------------------------------------
// Turns a division's completed draft picks into stored team documents. `draft` calls this
// when a draft finishes.
export { handleCommitTeamsToFirestore } from './server/actions/team-commit-actions';

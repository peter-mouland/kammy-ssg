/* Location: app/_shared/lib/fixture-backends.ts */

/**
 * One answer to "is this process running on fixture backends rather than real ones?".
 *
 * It exists so that question is asked **at the seams that construct a backend** — and
 * nowhere else. `getFirestoreInstance()` and `getRealtimeAdminDbInstance()` read it to
 * choose an implementation; everything above them gets a database and knows nothing about
 * which one it got.
 *
 * That boundary is easy to erode. The first pass at supporting the fixture server put a
 * `process.env.KAMMY_FIXTURE_FIRESTORE` check inside `getAllDraftSyncComparisons()` — a
 * domain service branching on test infrastructure. It worked, and it was the wrong shape:
 * the next service to hit the same problem copies it, and soon the condition is everywhere
 * and the abstraction means nothing. If you find yourself importing this outside a backend
 * constructor, the backend is missing a fixture implementation — add that instead.
 *
 * The variable is named for Firestore because that is the backend it was introduced for.
 * It now selects every fixture backend; the name is kept because the harness, the docs and
 * `.kiro/steering/architecture.md` all refer to it.
 */
export const usingFixtureBackends = (): boolean => process.env.KAMMY_FIXTURE_FIRESTORE === '1';

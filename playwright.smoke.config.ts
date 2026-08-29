import { defineConfig, devices } from '@playwright/test';

/**
 * The only suite that touches the real application: `yarn test:smoke`.
 *
 * Everything else in this repo substitutes its externals, which is what makes those suites
 * fast and deterministic — and what makes them structurally blind to the failures this
 * project has actually had. All three of the worst ones this month were invisible to them:
 *
 * - `functions` ran react-router 7.6.1 against a 7.10.1 build, so every admin action
 *   returned "Bad Request". Impossible to see locally: every local mode uses the *build*
 *   workspace's copies.
 * - "Populate Bootstrap Data" failed for weeks. The fixture harness ran the identical action
 *   end to end without complaint.
 * - "Reset Database" failed the same way.
 *
 * Each was found by hand, from a log, after someone noticed. A handful of requests against
 * the deployed site would have caught all three within seconds of the deploy that caused them.
 *
 * **It runs after deploy, against production, and it only reads.** No writes, no state, no
 * fixtures — so it is safe to run on every deploy and safe to run twice.
 */

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://draft-ff.web.app';

export default defineConfig({
    testDir: './e2e/smoke',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    // A real network is allowed one bad moment; two is a signal.
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : [['list']],

    use: {
        baseURL: BASE_URL,
        // Production is a cold Cloud Function on the first hit and reads Sheets and Firestore
        // on every page, so it is legitimately slower than anything running locally.
        actionTimeout: 30_000,
        navigationTimeout: 60_000,
        trace: 'retain-on-failure',
    },

    timeout: 90_000,
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // No webServer: the whole point is that something else deployed this.
});

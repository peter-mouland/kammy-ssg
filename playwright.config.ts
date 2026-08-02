import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright runs against the **fixture server**, not a real environment.
 *
 * `yarn dev:fixtures` serves the whole site from `test-fixtures/` with an in-memory
 * Firestore and MSW over Sheets and FPL, so a run reaches no network and needs no
 * credentials. That is what makes a red run here mean *the code broke* — the one question
 * this project could not answer. It is also the only mode with `?now=` time travel, which
 * is what lets one server answer for three different dates.
 *
 * Deliberately not pointed at the dev Firebase project: real FPL data changes daily, so the
 * crawl would go non-deterministic, and there is no way to ask it for a date other than
 * today. The dev project belongs to the layers the fixtures cannot reach — real Firestore
 * semantics, write actions, and the live contract checks.
 */

const PORT = 3100;

export default defineConfig({
    testDir: './e2e',
    // The fixture server is a single shared process holding one in-memory Firestore, so
    // parallel files would be racing each other's data. Within a file, tests still run in
    // order and share it safely because the crawl only reads.
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
    },

    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

    webServer: {
        command: 'yarn dev:fixtures',
        url: `http://localhost:${PORT}/`,
        // The season is rebuilt at boot -- 117 documents through the app's own pipeline,
        // about 7s locally and slower on a cold CI runner.
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        // stdout is ignored because the season rebuild alone emits thousands of ✅ lines,
        // which bury the test results. stderr is kept: without it, a server that fails to
        // boot looks identical to a slow one, and the first CI run of this crawl spent 180s
        // timing out on a module-scope crash it could not report.
        stdout: 'ignore',
        stderr: 'pipe',
    },
});

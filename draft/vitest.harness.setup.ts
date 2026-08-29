/* Location: draft/vitest.harness.setup.ts */

/**
 * Everything a payload test needs before it can call a real loader.
 *
 * The loaders read Sheets, FPL and Firestore for real, so this stands all three up from
 * `test-fixtures/` and then rebuilds the season through the app's own pipeline — the same
 * boot sequence `harness/server.mjs` runs, so the loader tests and the fixture server see
 * byte-identical data.
 *
 * **The rebuild happens once for the whole run.** It costs ~7s, which is fine once and not
 * fine per file, so `vitest.harness.config.ts` puts every payload test in a single fork with
 * `isolate: false`. That makes this module's state shared, and the promise below the thing
 * that guarantees one rebuild rather than one per file.
 */

import { setupServer } from 'msw/node';
import { afterAll, beforeAll } from 'vitest';
import { FixtureSheetStore, fixtureHandlers } from './app/_shared/test/fixtures/fixture-msw-handlers';
import { useFakeSheetsCredentials } from './app/_shared/test/google-sheets-msw';

// Selects the in-memory Firestore and Realtime Database at their seams. Set before anything
// constructs a backend; both read it lazily, so this is early enough.
process.env.KAMMY_FIXTURE_FIRESTORE = '1';

useFakeSheetsCredentials();

const store = new FixtureSheetStore();
const server = setupServer(...fixtureHandlers(store));

/**
 * Memoised at module scope: the first file to run pays for the rebuild, the rest await the
 * same promise. Not `beforeAll` alone -- that runs per file.
 */
let seasonReady: Promise<void> | undefined;

async function rebuildOnce(): Promise<void> {
    const { rebuildSeason } = await import('./harness/rebuild-season');
    const startedAt = Date.now();
    const summary = await rebuildSeason({});

    console.log(
        `🏗️  season rebuilt for payload tests: ${summary.documentsWritten} documents in ` +
            `${((Date.now() - startedAt) / 1000).toFixed(1)}s` +
            (summary.failures.length ? ` (${summary.failures.length} failed)` : ''),
    );
}

beforeAll(async () => {
    // Errors rather than warns: in a test, a request the fixtures do not know about is a
    // hole in the fixtures, and a silent escape to the real network is the worst outcome.
    server.listen({ onUnhandledRequest: 'error' });

    seasonReady ??= rebuildOnce();
    await seasonReady;
}, 180_000);

afterAll(() => {
    server.close();
});

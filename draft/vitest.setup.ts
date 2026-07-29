import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useFakeSheetsCredentials } from './app/_shared/test/google-sheets-msw';

/**
 * Runs before every test file, in both the `node` and `happy-dom` environments.
 *
 * Testing Library keeps rendered output in the document between tests, so without this
 * a component from one test is still on the page during the next one -- which shows up
 * as "found multiple elements" failures that look like a bug in the component. Calling
 * cleanup() is a no-op in the node environment, so it is safe to do unconditionally.
 */
afterEach(() => {
    cleanup();
});

/**
 * Fake Google Sheets credentials, set before any test file's imports run.
 *
 * `_shared/lib/sheets/utils/common.ts` reads `GOOGLE_SHEETS_ID` at module scope and
 * memoises its client, so tests used to import it dynamically inside `beforeAll` to
 * guarantee the fake credentials existed first. That put the `googleapis` import -- 1.7s,
 * because `import { google } from 'googleapis'` loads Google's entire API surface -- inside
 * a hook governed by vitest's 10s `hookTimeout`. Under parallel workers it tipped over
 * often enough to fail roughly one `yarn test` run in three, gating the pre-commit hook and
 * reddening CI for reasons unrelated to the change under test.
 *
 * Setting them here means the sheets tests can import statically, so that cost lands in
 * module collection where no timeout applies. Cheap for the files that never touch Sheets:
 * two env vars, and the RSA key is generated once per worker.
 */
useFakeSheetsCredentials();

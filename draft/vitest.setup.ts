import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

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

/* Location: app/_shared/lib/clock.server.ts */

import { AsyncLocalStorage } from 'node:async_hooks';
import { registerScopedNow } from './clock';

/**
 * Per-request time travel, server only.
 *
 * Split from `clock.ts` because that module is imported by client components and
 * `node:async_hooks` does not exist in a browser bundle. Importing this file installs the
 * resolver into the shared clock; nothing else needs to know it happened.
 *
 * This is what lets **one** fixture server answer `?now=2024-08-01` and `?now=2025-05-26`
 * concurrently. `AsyncLocalStorage` carries the date across every `await` in the request,
 * so a loader deep in the call stack sees it without anything being threaded through.
 */

const storage = new AsyncLocalStorage<Date>();

registerScopedNow(() => storage.getStore() ?? null);

/** Run `fn` -- and everything it awaits -- with `now()` returning `at`. */
export function runWithNow<T>(at: Date | string, fn: () => T): T {
    const parsed = at instanceof Date ? at : new Date(at);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`[clock] runWithNow received an unparseable date: ${String(at)}`);
    }

    return storage.run(parsed, fn);
}

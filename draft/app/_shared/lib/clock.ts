/* Location: app/_shared/lib/clock.ts */

/**
 * The app's source of "now".
 *
 * The site behaves differently depending on when you look at it -- deadlines, submission
 * windows, cup reveals and gameweek eligibility are all date decisions -- so out of season
 * every page shows one state and none of that logic can be exercised. This makes the date
 * an input.
 *
 * **In production nothing sets any of these, so `now()` is `new Date()`.** The overrides
 * exist for the offline harness, the loader tests and Storybook.
 *
 * Resolution order, first match wins:
 *
 *   1. `runWithNow(...)` scope   per-request, server only -- see `clock.server.ts`
 *   2. `setNow(...)`             a process is a scenario: Node tests, Storybook
 *   3. `KAMMY_FAKE_NOW`          env, for a whole harness process
 *   4. `globalThis.__KAMMY_NOW__` browser, written by root.tsx before hydration
 *   5. `new Date()`              production
 *
 * (1) is what lets a single fixture server answer two requests at two different dates, so
 * Playwright can run scenarios in parallel and you can hand-drive the season in a browser.
 *
 * Deliberately NOT clock-driven: cache TTL arithmetic (`data-cache.service.ts`,
 * `sheets/cache/utils.ts`), `lastUpdated` stamps, job ids and UI transitions. Moving the
 * clock under a TTL would expire or freeze caches as a side effect of time travel, which
 * is a confusing failure a long way from its cause.
 */

/** Set by `clock.server.ts` when it is loaded; absent in the browser. */
let scopedNow: (() => Date | null) | null = null;

let explicitNow: Date | null = null;

/** Where `root.tsx` writes the server's date so the browser hydrates at the same one. */
// biome-ignore lint/style/useNamingConvention: a global this app sets on window, named to stand out
type BrowserClock = { __KAMMY_NOW__?: string };

const browserNow = () => (globalThis as BrowserClock).__KAMMY_NOW__;

/**
 * Install the per-request resolver. Called only by `clock.server.ts`, which owns the
 * `AsyncLocalStorage` -- importing `node:async_hooks` from here would break the browser
 * bundle, and this module is imported by client components.
 */
export function registerScopedNow(resolver: () => Date | null): void {
    scopedNow = resolver;
}

function fromEnvironment(): Date | null {
    // `process` is undefined in the browser, and `globalThis.__KAMMY_NOW__` is undefined
    // on the server, so each branch only fires where it applies.
    const fromEnv = typeof process !== 'undefined' ? process.env.KAMMY_FAKE_NOW : undefined;
    const raw = fromEnv || browserNow();

    return raw ? new Date(raw) : null;
}

/** The current time, honouring any override. Use this instead of `new Date()`. */
export function now(): Date {
    return scopedNow?.() ?? explicitNow ?? fromEnvironment() ?? new Date();
}

/** The current time in milliseconds. Use this instead of `Date.now()`. */
export function nowMs(): number {
    return now().getTime();
}

/**
 * Freeze the clock for this process, or `null` to return to real time.
 *
 * For Node tests and Storybook, where one process is one scenario. A server serving many
 * dates at once wants `runWithNow` instead.
 */
export function setNow(value: Date | string | null): void {
    if (value === null) {
        explicitNow = null;
        return;
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`[clock] setNow received an unparseable date: ${String(value)}`);
    }

    explicitNow = parsed;
}

/**
 * Whether the clock is being overridden.
 *
 * Callers use this to keep production on its existing behaviour while giving the harness
 * date-derived behaviour -- see `getFplEvents()` in `fpl/api-cache.ts`, where recomputing
 * gameweek flags in production would be a real semantic change and recomputing them in the
 * harness is the only way the season moves at all.
 */
export function isFakeNow(): boolean {
    return Boolean(scopedNow?.() ?? explicitNow ?? fromEnvironment());
}

/** The override as an ISO string, or null. Used by the root loader to seed the browser. */
export function fakeNowIso(): string | null {
    const fake = scopedNow?.() ?? explicitNow ?? fromEnvironment();
    return fake ? fake.toISOString() : null;
}

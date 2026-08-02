import { expect, type Page, test } from '@playwright/test';

/**
 * Part E1 — every route, at three dates, asserting the site is not broken.
 *
 * This is the regression net the project has never had. It answers one question that unit
 * and loader tests cannot: *does the site work* — Express, SSR, route config, hydration and
 * client navigation included.
 *
 * **What counts as passing is not simply "200".** The app deliberately answers some requests
 * with an explained state — "the season has ended", "this team has not been set up yet" —
 * and serves those as 503, because the page really is unavailable and saying so is the
 * feature. Asserting 200 everywhere would fail the app for working correctly. So a route
 * passes if it renders *either* real content or an explained state, and fails if it renders
 * an error boundary. `route-error.tsx` carries the two test ids that tell them apart, since
 * both render a heading and prose and CSS module class names are hashed.
 */

/** Real values from `test-fixtures/`, so these are not 404s in disguise. */
const USER_ID = 'Andy';
const DIVISION_ID = 'premierLeague';
const PLAYER_CODE = 438098; // Fábio Vieira

/**
 * Dates on the 2024/25 calendar the FPL fixtures come from.
 *
 * `preseason` yields a current **GW1**, not an empty state: GW1's window opens at a
 * hardcoded floor in `gameweeks.ts`, so every date before its deadline reports GW1. The only
 * genuine no-current-gameweek state is after the final deadline — and even `season-end`
 * falls back to FPL's frozen `is_current`. Neither reproduces production's pre-season, where
 * no event carries `is_current` at all; the captured season is a finished one. That gap is
 * real and named in the handover rather than papered over here.
 */
const SCENARIOS = [
    { name: 'preseason', now: '2024-08-01' },
    { name: 'cup-league-gw21', now: '2025-01-10' },
    { name: 'season-end', now: '2025-05-26' },
] as const;

/** Every entry in `routes.ts` that renders a page. */
const PAGES = [
    '/',
    '/teams',
    `/teams/${USER_ID}`,
    '/leagues',
    `/leagues/${DIVISION_ID}`,
    '/draft',
    '/players',
    `/players/${PLAYER_CODE}`,
    '/transfers',
    `/transfers/${DIVISION_ID}`,
    '/wishlists',
    '/cup',
    '/cup/submit',
    '/cup/admin',
    '/admin',
    '/admin/draft',
    '/admin/points',
    '/admin/settings',
    '/admin/setup-new-season',
    '/admin/transfers',
    '/debug',
];

/** The data endpoints. Asserted for status and parseable body, not for rendering. */
const ENDPOINTS = [
    '/players.json',
    `/players/${PLAYER_CODE}.json`,
    // Needs an action; without one it correctly answers 400 (asserted separately below).
    '/scoring/api/gw-points?action=summary',
    `/api/transfers/${DIVISION_ID}`,
    '/api/cache?action=status',
    '/api/admin/draft-sync-comparisons',
];

const withNow = (path: string, now: string) => `${path}${path.includes('?') ? '&' : '?'}now=${now}`;

/**
 * Browser noise that is not the app failing.
 *
 * Kept deliberately short and specific: a broad filter here would hide the very failures
 * this spec exists to catch. Every entry needs a reason.
 */
const IGNORED_CONSOLE = [
    /Download the React DevTools/,
    // Vite serves the app unbundled in the harness; this is dev-server chatter.
    /\[vite\]/,
    // Vite's dependency optimizer, not the app. The fixture server runs through Vite's SSR
    // pipeline deliberately (Part D: the harness has to share module state with the app, so
    // it cannot load the production bundle), and when the browser asks for a module Vite has
    // not pre-bundled it re-optimizes and 504s whatever was in flight. It hits the first
    // heavy page on a cold optimizer and never again, which is why it presented as one flaky
    // test on CI and never locally. Nothing about it involves app code.
    /Outdated Optimize Dep/,
];

interface PageProblems {
    consoleErrors: string[];
    failedRequests: string[];
}

/** Collect the things a user would never see but that mean the page is broken. */
function watchForProblems(page: Page, baseURL: string): PageProblems {
    const problems: PageProblems = { consoleErrors: [], failedRequests: [] };

    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
        problems.consoleErrors.push(text);
    });

    page.on('pageerror', (error) => problems.consoleErrors.push(`uncaught: ${error.message}`));

    page.on('requestfailed', (request) => {
        // Only our own origin. Player photos are served from the real Premier League CDN
        // (`resources.premierleague.com`), which the fixture harness does not stub, so they
        // fail here and in CI -- that is a gap in the fixtures, not the app breaking, and
        // failing the crawl on it would train people to ignore it.
        if (!request.url().startsWith(baseURL)) return;

        problems.failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText}`);
    });

    return problems;
}

for (const scenario of SCENARIOS) {
    test.describe(`${scenario.name} (${scenario.now})`, () => {
        for (const path of PAGES) {
            test(`${path} renders`, async ({ page, baseURL }) => {
                const problems = watchForProblems(page, baseURL ?? '');

                const response = await page.goto(withNow(path, scenario.now), { waitUntil: 'domcontentloaded' });
                expect(response, `no response for ${path}`).not.toBeNull();

                const status = response?.status() ?? 0;
                const isExplainedState = (await page.locator('[data-testid="friendly-state"]').count()) > 0;

                // An error boundary is always a failure, whatever the status code.
                const errorBoundary = page.locator('[data-testid="route-error"]');
                if ((await errorBoundary.count()) > 0) {
                    const heading = await errorBoundary.locator('h1').first().textContent();
                    const chain = await errorBoundary.locator('li').allTextContents();
                    throw new Error(`${path} rendered an error page: "${heading?.trim()}" — ${chain.join(' → ')}`);
                }

                // 503 is how an explained state is served; anything else must be a 200.
                if (status !== 200) {
                    expect(
                        isExplainedState,
                        `${path} returned ${status} without explaining why`,
                    ).toBe(true);
                    expect(status, `${path} used an unexpected status for an explained state`).toBe(503);
                }

                expect(problems.consoleErrors, `${path} logged console errors`).toEqual([]);
                expect(problems.failedRequests, `${path} had failed requests`).toEqual([]);
            });
        }

        test('/scoring/api/gw-points rejects a request with no action', async ({ request }) => {
            // A documented contract, not a fault: the 400 says which actions exist. Pinned
            // because the crawl above would otherwise only ever call it correctly.
            const response = await request.get(withNow('/scoring/api/gw-points', scenario.now));

            expect(response.status()).toBe(400);
            expect((await response.json()).error).toContain('Invalid action');
        });

        for (const path of ENDPOINTS) {
            test(`${path} responds`, async ({ request }) => {
                const response = await request.get(withNow(path, scenario.now));

                // Same rule as the pages: a 503 is an explained state, not a fault.
                expect([200, 503], `${path} returned ${response.status()}`).toContain(response.status());

                if (response.status() === 200) {
                    // A truncated or non-JSON body is a failure no status code will show.
                    const body = await response.text();
                    let parsed: unknown;
                    expect(() => {
                        parsed = JSON.parse(body);
                    }, `${path} did not return parseable JSON: ${body.slice(0, 120)}`).not.toThrow();
                    expect(parsed, `${path} returned an empty JSON body`).toBeDefined();
                }
            });
        }
    });
}

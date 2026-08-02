import { expect, test } from '@playwright/test';

/**
 * Does the deployed application work? Read-only, and small on purpose.
 *
 * Industry practice for a suite like this is a handful of checks, not a sweep: it runs
 * against real infrastructure, so every test costs a real request and every flake costs
 * trust. The route crawl already covers breadth against fixtures. This covers the thing the
 * crawl structurally cannot — that *this build, on this infrastructure, with these
 * credentials and these dependency versions* actually serves the site.
 *
 * **Every assertion here is one that would have caught a real outage.**
 */

/** The pages a manager or admin would notice within a minute of being broken. */
const CRITICAL_PAGES = ['/', '/leagues', '/players', '/teams', '/cup', '/transfers', '/admin'];

test.describe('the deployed site', () => {
    for (const path of CRITICAL_PAGES) {
        test(`${path} serves a page, not an error`, async ({ page }) => {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

            // 503 is the app explaining an expected state ("the season has ended"), which is
            // it working. Anything else is not.
            expect([200, 503], `${path} returned ${response?.status()}`).toContain(response?.status());

            const errorBoundary = page.locator('[data-testid="route-error"]');
            if ((await errorBoundary.count()) > 0) {
                const heading = await errorBoundary.locator('h1').first().textContent();
                const chain = await errorBoundary.locator('li').allTextContents();
                throw new Error(`${path} is showing an error page: "${heading?.trim()}" — ${chain.join(' → ')}`);
            }
        });
    }

    test('the data endpoints answer with JSON', async ({ request }) => {
        // `players.json` is the cheapest proof that Firestore has data and the app can read
        // it. It returned `{"players":[]}` for weeks while every page looked fine.
        const response = await request.get('/players.json');

        expect(response.status()).toBe(200);

        const body = (await response.json()) as { players?: unknown[] };
        expect(Array.isArray(body.players), 'players.json did not return a players array').toBe(true);
    });

    /**
     * The check that would have caught this month's outage on the deploy that caused it.
     *
     * A version skew between the build and runtime workspaces broke every admin action with
     * "Bad Request" from React Router's single-fetch handler, while every local suite stayed
     * green. Nothing short of submitting a real request to the deployed app can see it — so
     * this posts one, choosing the action with no side effects.
     */
    test('an admin action round-trips, rather than failing the single-fetch handshake', async ({ request }) => {
        const response = await request.post('/admin.data', {
            form: { actionType: 'systemHealthCheck' },
        });

        expect(response.status(), 'the admin action endpoint did not accept a form submission').toBe(200);

        const body = await response.text();

        // Asserted positively. `not.toContain('Bad Request')` alone would pass on an empty
        // body, a redirect, or an HTML error page -- which is exactly the shape the failure
        // took. The action has to come back having actually run.
        expect(body, 'the action did not return a result — check react-router versions match across workspaces')
            .toContain('"success"');
        expect(body, 'the action reported a health check it never ran').toContain('System health check completed');

        expect(body, 'the single-fetch handshake failed — a build/runtime version skew does this').not.toContain(
            'Bad Request',
        );
        expect(body, 'the action returned an unexplained server error').not.toContain('Unexpected Server Error');
    });
});

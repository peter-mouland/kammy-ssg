import { expect, type Page, test } from '@playwright/test';

/**
 * Which gameweek `/admin/transfers` opens on, at the dates where the answer changes.
 *
 * **Selection** is the gameweek managers are making transfers for and **scoring** is the one
 * accumulating points. Admin reviews selection, and falls back to scoring after the final
 * deadline, when there is no selection gameweek but GW38's transfers still need reviewing.
 *
 * `route-crawl.spec.ts` cannot guard this: it accepts a 503 as an explained state, so a
 * page that had wrongly closed for the season passed it.
 *
 * System Health is asserted here too. The transfers page stopped reading `systemStatus`,
 * and this keeps it provable that the overview did not lose anything by it.
 */

/** Just after GW1's deadline: scoring GW1, selection GW2. */
const MID_WINDOW = '2024-08-16T18:00:00Z';
/** After GW38's deadline: scoring GW38, no selection gameweek. */
const SEASON_END = '2025-05-26';

const PAGE = '/admin/transfers';

const openAt = (page: Page, path: string, now: string) =>
    page.goto(`${path}${path.includes('?') ? '&' : '?'}now=${now}`);

/** The selector's button reads as the gameweek number and a dropdown arrow. */
const gameweekShown = (page: Page, gameweek: number) =>
    page.getByRole('button', { name: new RegExp(`^${gameweek}\\s*▼`) });

const transferManagement = (page: Page) => page.getByRole('heading', { name: 'Transfer Management' });

test.describe('mid-window', () => {
    test('opens on the selection gameweek', async ({ page }) => {
        await openAt(page, PAGE, MID_WINDOW);

        await expect(gameweekShown(page, 2)).toBeVisible();
    });

    test('opens the requested gameweek, and the selection gameweek is reachable from it', async ({ page }) => {
        await openAt(page, `${PAGE}?gameweek=1`, MID_WINDOW);
        await expect(gameweekShown(page, 1)).toBeVisible();

        await page.getByTitle('Next gameweek').click();

        await expect(gameweekShown(page, 2)).toBeVisible();
    });
});

test.describe('after the final deadline', () => {
    test('stays open on the scoring gameweek', async ({ page }) => {
        const response = await openAt(page, PAGE, SEASON_END);

        expect(response?.status()).toBe(200);
        await expect(transferManagement(page)).toBeVisible();
        await expect(gameweekShown(page, 38)).toBeVisible();
    });

    test('opens the requested gameweek', async ({ page }) => {
        const response = await openAt(page, `${PAGE}?gameweek=38`, SEASON_END);

        expect(response?.status()).toBe(200);
        await expect(gameweekShown(page, 38)).toBeVisible();
    });
});

for (const now of [MID_WINDOW, SEASON_END]) {
    test(`the overview still shows System Health at ${now}`, async ({ page }) => {
        await openAt(page, '/admin', now);

        await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
    });
}

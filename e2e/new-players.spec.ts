import { expect, type Page, test } from '@playwright/test';

/**
 * The new-player intake, driven as an admin drives it.
 *
 * This is the first spec that **writes**. `playwright.config.ts` says the fixture server
 * is where write actions cannot be reached; that is no longer true, and this is the
 * reason the sheet store had to become something a test could put back.
 *
 * What it is actually guarding is the gap between the two decisions. Approving a position
 * must not put a player in front of managers -- the batch is announced and drawn for
 * first -- and an approve that quietly released them would look identical on this page to
 * one that did not. Only /transfers can tell the difference, so this walks over there and
 * checks.
 */

const PAGE = '/admin/new-players';

/**
 * Web names are not unique -- the fixture pool has a Thomas at Arsenal and another at
 * Leicester -- so a player is identified by name and club, which is also what the page's
 * own aria-labels say for exactly that reason.
 */
const PLAYER = { name: 'Jorginho', club: 'ARS' };
const OTHER = { name: 'Thomas', club: 'ARS' };

type Who = { name: string; club: string };
const label = (who: Who) => `${who.name} (${who.club})`;

const newTable = (page: Page) => page.getByTestId('new-players-table');
const heldTable = (page: Page) => page.getByTestId('held-players-table');

/** Rows are paged at 25, so a filter is how a named player is reached. */
async function findPlayer(page: Page, who: Who) {
    await page.getByPlaceholder(/Filter by player or club/i).fill(who.name);
    await expect(newTable(page).getByLabel(`Select ${label(who)}`)).toBeVisible();
}

async function approve(page: Page, who: Who, position: string) {
    await findPlayer(page, who);
    await newTable(page).getByLabel(`Select ${label(who)}`).check();
    await page.getByLabel(`Position for ${label(who)}`).selectOption(position);
    await page.getByRole('button', { name: /^Approve \d+ selected$/ }).click();
}

test.beforeEach(async ({ request, page }) => {
    // The store lives for the life of the server, so without this a test meets the rows
    // the previous one wrote -- and a reset that silently failed would look like the
    // feature being broken, so its response is asserted rather than assumed.
    const reset = await request.post('/__harness/reset-sheets');
    expect(reset.ok(), 'harness sheet reset failed').toBeTruthy();

    await page.goto(PAGE);
});

test('lists the players FPL has that the sheet does not', async ({ page }) => {
    await expect(page.getByText(/players are in FPL but not in the sheet/)).toBeVisible();

    // The fixture Players tab is a subset of the FPL pool, so there is a real diff to show.
    const count = await newTable(page).locator('tbody tr').count();
    expect(count).toBeGreaterThan(0);
});

test('approving holds the player without putting them in front of managers', async ({ page }) => {
    await approve(page, PLAYER, 'MID');

    await expect(page.getByText(/1 player held/)).toBeVisible();
    await expect(heldTable(page).getByText(PLAYER.name)).toBeVisible();

    // The assertion the whole design turns on. An approve that released them would look
    // exactly the same on the admin page.
    await page.goto('/transfers');
    await expect(page.getByText(PLAYER.name, { exact: true })).toHaveCount(0);
});

test('releasing puts the player into the sheet', async ({ page }) => {
    await approve(page, PLAYER, 'MID');
    await expect(page.getByText(/1 player held/)).toBeVisible();

    await page.reload();
    await heldTable(page).getByLabel(`Select ${label(PLAYER)}`).check();
    await page.getByRole('button', { name: /^Release \d+ into the game$/ }).click();

    // One assertion for both halves of the message. The second half matters as much as the
    // first: the sheet write alone does not make a player visible, because /players reads
    // the Firestore elements populateBootstrap filtered, so the next step is said here
    // rather than left to be discovered.
    await expect(page.getByText(/1 player is now in the sheet\. Run "Populate Bootstrap Data"/)).toBeVisible();

    await page.reload();
    await expect(heldTable(page).getByText(PLAYER.name)).toHaveCount(0);
});

test('a player with no position chosen cannot be approved by accident', async ({ page }) => {
    await findPlayer(page, PLAYER);
    await newTable(page).getByLabel(`Select ${label(PLAYER)}`).check();

    // Selected but positionless, so there is nothing to write and the button says so.
    await expect(page.getByText(/no position set/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve selected' })).toBeDisabled();
});

test('selections survive filtering, so nothing is approved or forgotten off-screen', async ({ page }) => {
    await approve(page, PLAYER, 'MID');
    await expect(page.getByText(/1 player held/)).toBeVisible();

    await page.reload();
    await findPlayer(page, OTHER);
    await newTable(page).getByLabel(`Select ${label(OTHER)}`).check();
    await page.getByLabel(`Position for ${label(OTHER)}`).selectOption('CB');

    // Clear the filter: the selection is keyed by code, not by what is rendered.
    await page.getByPlaceholder(/Filter by player or club/i).fill('');
    await expect(page.getByRole('button', { name: 'Approve 1 selected' })).toBeEnabled();
});

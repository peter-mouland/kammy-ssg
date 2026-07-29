/* Location: app/cup/server/actions/submit-cup-team.action.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import * as action from './submit-cup-team.action';

/**
 * Server-side rules for a cup submission.
 *
 * The UI disables the submit button once the window closes, but the UI is not a rule.
 * A direct POST has to be refused too, or a manager can wait for the deadline to pass,
 * look at everyone else's revealed squads, and then submit a team picked with that
 * knowledge — which defeats the entire visibility mechanic the cup is built on.
 *
 * See https://github.com/peter-mouland/kammy-ssg/issues/60.
 *
 * Note on scope: `getTeamsForGameweek` reads Firestore directly with no cache seam, so
 * these tests cover the checks that run *before* it. That is deliberate — the deadline
 * check belongs before an expensive lookup for a request that is already doomed.
 */

/** `start`/`end` bracket the submission window — see `cup/lib/cup-deadlines.ts`. */
const gameweek = (id: number, { start = '2020-01-01T00:00:00Z', end = '2099-01-01T00:00:00Z' } = {}) => ({
    fplEvent: { id, name: `Gameweek ${id}`, is_current: id === 3, deadline_time: end },
    gameWeekIndex: id - 1,
    start: new Date(start),
    end: new Date(end),
    isCurrent: id === 3,
    isNext: false,
    hasPassed: false,
});

const OPEN = { start: '2020-01-01T00:00:00Z', end: '2099-01-01T00:00:00Z' };
const CLOSED = { start: '2020-01-01T00:00:00Z', end: '2020-01-02T00:00:00Z' };

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2,3'],
    ['r16', '4,5'],
    ['qf', '6,7'],
    ['sf', '8,9'],
    ['final', '10'],
];

const CUP_TAB = [
    [
        'Status',
        'Timestamp',
        'Manager',
        'Division',
        'Gameweek',
        'Stage',
        'Leg',
        'Players',
        'SubmittedByAdmin',
        'AdminReason',
    ],
];

const server = setupServer(googleAuthHandler, sheetValuesHandler({ CupConfig: CUP_CONFIG_TAB, Cup: CUP_TAB }));

const SQUAD = [101, 102, 103, 104];

/** Seed the gameweek calendar, with gameweek 3's window set open or closed. */
const seed = (window: { start: string; end: string }) =>
    dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [
        gameweek(1),
        gameweek(2),
        gameweek(3, window),
        gameweek(4),
        gameweek(5),
    ]);

/** Submitting reaches Firestore if it gets far enough; surface that as an error string. */
const submit = (over: Partial<Parameters<typeof action.handleCupSubmission>[0]> = {}) =>
    action
        .handleCupSubmission({ manager: 'ann', division: 'premierLeague', gameweek: 3, players: SQUAD, ...over })
        .catch((error: Error) => ({ success: false, error: error.message, message: undefined }));

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => dataCache.clear());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('handleCupSubmission — the submission window', () => {
    // THE BUG (#60). The UI hid the button; a direct POST ignored that entirely, so a
    // manager could submit after seeing everyone else's revealed teams.
    it('refuses a submission once the window has closed', async () => {
        await seed(CLOSED);

        const result = await submit();

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/closed/i);
    });

    // The counterpart, and the reason this is not just `return false`: a legitimate
    // submission must still get through. It goes on to the squad lookup (which needs
    // Firestore, so it fails there) -- the point is that it is NOT refused for timing.
    it('lets a submission through the window check while it is open', async () => {
        await seed(OPEN);

        const result = await submit();

        expect(result.error).not.toMatch(/closed/i);
    });

    // A gameweek with no calendar entry must not be treated as open by default.
    it('refuses when the gameweek is not in the calendar at all', async () => {
        await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => []);

        const result = await submit();

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/closed|not part of the cup|could not/i);
    });
});

describe('handleCupSubmission — the checks that already existed', () => {
    it('rejects a gameweek that is not part of the cup', async () => {
        await seed(OPEN);

        const result = await submit({ gameweek: 11 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/not part of the cup/i);
    });

    it('rejects a submission missing its manager', async () => {
        await seed(OPEN);

        const result = await submit({ manager: '' });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/missing/i);
    });
});

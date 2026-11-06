/* Location: app/cup/server/actions/generate-autopicks.action.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import { generateAutopicksAction } from './generate-autopicks.action';

/**
 * Autopick generation (rule 4.6) runs from the admin page for managers missing
 * a submission. The squad lookup reads Firestore directly with no cache seam,
 * so — like the submit action tests — these cover the checks that run before
 * it. The planning itself (`planAutopicks`) is unit-tested with real rosters.
 */

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2'],
    ['r16', '3,4'],
    ['qf', '5,6'],
    ['sf', '7,8'],
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

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => dataCache.clear());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('generateAutopicksAction', () => {
    it('rejects a gameweek that is not part of the cup', async () => {
        const result = await generateAutopicksAction({ gameweek: 11 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/not part of the cup/i);
    });

    it('rejects a missing gameweek', async () => {
        const result = await generateAutopicksAction({ gameweek: Number.NaN });

        expect(result.success).toBe(false);
    });
});

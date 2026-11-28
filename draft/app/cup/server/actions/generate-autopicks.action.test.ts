/* Location: app/cup/server/actions/generate-autopicks.action.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { resetInMemoryFirestore } from '../../../_shared/lib/firestore-cache/firestore-memory';
import { googleAuthHandler, sheetHandlers } from '../../../_shared/test/google-sheets-msw';
import { createDivisionTeamsDocument } from '../../../scoring/index.server';
import type { DivisionTeamsDocument, RosterByManagerId } from '../../../teams';
import { generateAutopicksAction } from './generate-autopicks.action';

process.env.KAMMY_FIXTURE_FIRESTORE = '1';

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

const USER_TEAMS_TAB = [
    ['User ID', 'User Name', 'Team Name', 'Division ID', 'Last Updated'],
    ['ann', 'Ann', 'Ann FC', 'premierLeague', '2026-08-01'],
];

const DIVISIONS_TAB = [
    ['id', 'spreadsheetKey', 'label', 'order', 'url', 'promotion', 'relegation', 'cup'],
    ['premierLeague', 'premierLeague', 'Premier League', 1, 'premier-league', 'FALSE', 'TRUE', 'TRUE'],
];

const { handlers, store } = sheetHandlers({
    CupConfig: CUP_CONFIG_TAB,
    Cup: CUP_TAB,
    UserTeams: USER_TEAMS_TAB,
    Divisions: DIVISIONS_TAB,
});
const server = setupServer(googleAuthHandler, ...handlers);

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => dataCache.clear());
afterEach(() => {
    server.resetHandlers();
    resetInMemoryFirestore();
    store.reset();
});
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

    it('refuses to autopick while the gameweek is still open', async () => {
        await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [
            {
                fplEvent: { id: 1, finished: false },
                start: new Date('2026-08-01T00:00:00Z'),
                end: new Date('2099-01-01T00:00:00Z'),
            },
            {
                fplEvent: { id: 2, finished: false },
                start: new Date('2099-01-01T00:00:00Z'),
                end: new Date('2099-01-08T00:00:00Z'),
            },
        ]);

        const result = await generateAutopicksAction({ gameweek: 1 });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/still open for submissions/i);
    });

    // The round's own gameweek (GW3) has no division document yet; GW2's does.
    // Autopicks must generate from that earlier squad, not skip the manager as
    // "no squad found" — the same squad the picker and submit agree on.
    it('generates a team from the most recent earlier squad when the round has no document yet', async () => {
        await dataCache.get(CACHE_KEYS.FPL.EVENTS, async () => [
            {
                fplEvent: { id: 3, deadline_time: '2020-01-02T00:00:00Z', finished: true },
                start: new Date('2020-01-01T00:00:00Z'),
                end: new Date('2020-01-02T00:00:00Z'),
            },
        ]);
        const slot = (playerCode: number, playerName: string, playerPosition: string) => ({
            player: { playerCode, playerName, playerPosition },
        });
        await createDivisionTeamsDocument({
            divisionId: 'premierLeague',
            gameweek: 2,
            lastUpdated: '2026-01-01T00:00:00.000Z',
            teams: {
                ann: {
                    roster: {
                        gk_0: slot(101, 'Alpha', 'gk'),
                        cb_0: slot(102, 'Bravo', 'cb'),
                        fb_0: slot(103, 'Charlie', 'fb'),
                        mid_0: slot(104, 'Delta', 'mid'),
                    },
                },
            } as unknown as RosterByManagerId,
            metadata: {
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                pointsLastUpdated: null,
                pointsLastGameweek: null,
            },
        } as DivisionTeamsDocument);

        const result = await generateAutopicksAction({ gameweek: 3 });

        expect(result.success).toBe(true);
        expect(result.message).toContain('Autopicked 1: ann');
        expect(store.values('Cup').some((row) => row.includes('ann'))).toBe(true);
    });
});

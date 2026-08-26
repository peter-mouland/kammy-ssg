/* Location: app/admin/server/services/new-players.service.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CACHE_KEYS } from '../../../_shared/lib/cache/cache-config';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { PLAYER_INBOX_HEADERS } from '../../../_shared/lib/sheets/player-inbox';
import { googleAuthHandler, sheetHandlers } from '../../../_shared/test/google-sheets-msw';

/**
 * The flow this covers is the reason the page exists: a player FPL has and the sheet does
 * not is invisible everywhere on the site, and getting them in has two steps that must not
 * collapse into one. Approve records a position and holds them; release is what actually
 * puts them in front of managers.
 *
 * The real sheets client runs behind MSW, so ranges, formulas and parsing are all real.
 * The FPL side reads Firestore over gRPC, which MSW cannot intercept, so bootstrap is
 * seeded through the app's own cache -- the idiom `cup.route.test.ts` established.
 */

const PLAYERS_HEADERS = ['isHidden', 'new', 'code', 'web_name', 'club_shortcode', 'position', 'fpl_value', 'status'];

/** Two players already in the game, exactly as the real tab holds them. */
const PLAYERS_TAB = [
    PLAYERS_HEADERS,
    ['', '', 154561, 'Raya', 'ARS', 'GK', '6.0', 'a'],
    ['hidden', '', 109745, 'Arrizabalaga', 'ARS', 'GK', '5.0', 'u'],
];

const INBOX_TAB = [[...PLAYER_INBOX_HEADERS]];

const element = (code: number, webName: string, elementType: number) => ({
    code,
    id: code,
    web_name: webName,
    first_name: webName,
    second_name: webName,
    element_type: elementType,
    team_code: 3,
    now_cost: 50,
    status: 'a',
});

/** Raya and Arrizabalaga are in the sheet; Dubravka and Kone are not. */
const BOOTSTRAP = {
    elements: [
        element(154561, 'Raya', 1),
        element(109745, 'Arrizabalaga', 1),
        element(118748, 'Dubravka', 1),
        element(542273, 'Kone', 3),
    ],
    teams: [{ code: 3, short_name: 'BUR', name: 'Burnley', id: 1 }],
};

let service: typeof import('./new-players.service');

let handles = sheetHandlers({});
const server = setupServer(googleAuthHandler);

async function seed(tabs: { players?: unknown[][]; inbox?: unknown[][] }) {
    handles = sheetHandlers({
        Players: structuredClone(tabs.players ?? PLAYERS_TAB) as (string | number)[][],
        ...(tabs.inbox ? { PlayerInbox: structuredClone(tabs.inbox) as (string | number)[][] } : {}),
    });
    server.resetHandlers(googleAuthHandler, ...handles.handlers);

    dataCache.clear();
    await dataCache.get(CACHE_KEYS.FPL.BOOTSTRAP, async () => BOOTSTRAP);
}

beforeAll(async () => {
    server.listen({ onUnhandledRequest: 'error' });
    service = await import('./new-players.service');
});

beforeEach(async () => {
    await seed({ inbox: INBOX_TAB });
});

afterEach(() => dataCache.clear());
afterAll(() => server.close());

const playersRows = () => handles.store.values('Players').slice(1);
const inboxRows = () => handles.store.values('PlayerInbox').slice(1);

describe('finding new players', () => {
    it('lists only the FPL players the sheet is missing', async () => {
        const { newPlayers } = await service.getNewPlayersData();

        expect(newPlayers.map((player) => player.webName).sort()).toEqual(['Dubravka', 'Kone']);
    });

    it('carries the club and the FPL element type, which is what a position argues with', async () => {
        const { newPlayers } = await service.getNewPlayersData();
        const kone = newPlayers.find((player) => player.webName === 'Kone');

        expect(kone).toMatchObject({ club: 'BUR', fplType: 'MID', suggestion: null });
    });

    it('still lists new players when there is no PlayerInbox tab, so the page works without one', async () => {
        await seed({});

        const { newPlayers, inboxAvailable } = await service.getNewPlayersData();

        expect(inboxAvailable).toBe(false);
        expect(newPlayers).toHaveLength(2);
    });
});

describe('approving a position', () => {
    it('holds the player without putting them in the game', async () => {
        const before = playersRows().length;

        const result = await service.approveNewPlayers([{ code: 118748, position: 'GK' }], new Date('2026-08-26'));

        expect(result.success).toBe(true);
        // The whole point: Players is untouched, so nobody can take them yet.
        expect(playersRows()).toHaveLength(before);
        expect(inboxRows()).toHaveLength(1);
        expect(inboxRows()[0]).toEqual(expect.arrayContaining([118748, 'Dubravka', 'BUR', 'GKP', 'GK', 'approved']));
    });

    it('moves the player from the new list to the held list', async () => {
        await service.approveNewPlayers([{ code: 118748, position: 'GK' }], new Date('2026-08-26'));

        const { newPlayers, heldPlayers } = await service.getNewPlayersData();

        expect(newPlayers.map((p) => p.webName)).toEqual(['Kone']);
        expect(heldPlayers).toEqual([
            expect.objectContaining({ code: 118748, webName: 'Dubravka', position: 'GK', club: 'BUR' }),
        ]);
    });

    it('refuses a position that is not one of the six buckets', async () => {
        const result = await service.approveNewPlayers(
            [{ code: 118748, position: 'DEF' as never }],
            new Date('2026-08-26'),
        );

        expect(result).toMatchObject({ success: false });
        expect(inboxRows()).toHaveLength(0);
    });

    it('refuses a player already in the game rather than duplicating their row', async () => {
        const result = await service.approveNewPlayers([{ code: 154561, position: 'GK' }], new Date('2026-08-26'));

        expect(result.success).toBe(false);
        expect(result.message).toContain('154561');
        expect(playersRows()).toHaveLength(2);
    });

    it('refuses an empty selection', async () => {
        expect(await service.approveNewPlayers([], new Date('2026-08-26'))).toMatchObject({ success: false });
    });
});

describe('releasing into the game', () => {
    const approveDubravka = () => service.approveNewPlayers([{ code: 118748, position: 'GK' }], new Date('2026-08-26'));

    it('writes the player into Players with the new flag set', async () => {
        await approveDubravka();

        const result = await service.releasePlayers([118748]);

        expect(result.success).toBe(true);

        const added = playersRows().at(-1) as unknown[];
        expect(added[1]).toBe('Y'); // new  -- Boolean('Y') is what makes draft.isNew true
        expect(added[2]).toBe(118748); // code
        expect(added[3]).toBe('Dubravka'); // web_name
        expect(added[5]).toBe('GK'); // position
    });

    it('writes the four derived columns as formulas against its own row', async () => {
        await approveDubravka();
        await service.releasePlayers([118748]);

        // Row 4: two data rows plus the header, so the new row is the fourth.
        const added = playersRows().at(-1) as string[];

        expect(added[0]).toBe('=IF(H4="u","hidden","")'); // isHidden derives from status
        expect(added[4]).toBe('=VLOOKUP(C4,FPL_Player_export!$A$2:$ZZ,11,FALSE)'); // club
        expect(added[6]).toBe('=VLOOKUP(C4,FPL_Player_export!$A$2:$ZZ,6,FALSE)/10'); // value
        expect(added[7]).toBe('=VLOOKUP(C4,FPL_Player_export!$A$2:$ZZ,8,FALSE)'); // status
    });

    it('marks the inbox row released, keeping what was suggested against what was chosen', async () => {
        await approveDubravka();
        await service.releasePlayers([118748]);

        expect(inboxRows()[0].at(-1)).toBe('released');
    });

    it('refuses to release a player who was never held', async () => {
        const result = await service.releasePlayers([542273]);

        expect(result.success).toBe(false);
        expect(playersRows()).toHaveLength(2);
    });

    it('refuses an empty selection', async () => {
        expect(await service.releasePlayers([])).toMatchObject({ success: false });
    });
});

/* Location: app/cup/server/cup-sheets.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../_shared/test/google-sheets-msw';
import * as sheets from './cup-sheets';

// Loaded in beforeAll, not statically. `_shared/lib/sheets/utils/common.ts` reads the
// service account when its client is first built and memoises the result, so the module
// has to be imported AFTER the fake credentials are in place.

/**
 * The cup domain reads its own sheets through `_shared/lib/sheets/cup.ts`, which returns
 * raw rows; everything cup-shaped happens here. These tests run the real sheets client,
 * the real auth handshake and the real parsing — only the network is substituted.
 *
 * They are the regression guard for P2.3: if the interpretation ever drifts back into
 * the reader, or a row shape changes underneath it, these fail.
 */

const CUP_CONFIG_TAB = [
    ['Key', 'Value'],
    ['season', '2526'],
    ['league', '1,2,3'],
    ['r16', '4,5'],
    ['qf', '6,7'],
    ['sf', '8,9'],
    ['final', '10'],
];

const CUP_BRACKET_TAB = [
    ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'],
    ['r16', '1', 'ann', 'bob', '55', '42', 'ann'],
    ['r16', '2', 'cat', 'dee', '', '', ''],
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
    ['Y', '2026-08-15T12:00:00Z', 'ann', 'premierLeague', '4', 'R16', '1', '101,102,103,104', 'FALSE', ''],
];

const server = setupServer(
    googleAuthHandler,
    sheetValuesHandler({ CupConfig: CUP_CONFIG_TAB, CupBracket: CUP_BRACKET_TAB, Cup: CUP_TAB }),
);

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
    server.resetHandlers();
    // The sheets layer caches every read; without this the second test sees the first
    // test's rows.
    dataCache.clear();
});
afterAll(() => server.close());

describe('readCupConfig', () => {
    it('parses the key/value rows into a typed config', async () => {
        const config = await sheets.readCupConfig();

        expect(config.season).toBe('2526');
        expect(config.league).toEqual([1, 2, 3]);
        expect(config.final).toBe(10);
    });

    // The two-legged rounds are stored as "4,5" in a single cell. Getting this wrong
    // would silently put a whole round in the wrong gameweek.
    it('reads a two-legged round as a leg-1/leg-2 pair', async () => {
        const config = await sheets.readCupConfig();

        expect(config.r16).toEqual([4, 5]);
        expect(config.qf).toEqual([6, 7]);
        expect(config.sf).toEqual([8, 9]);
    });
});

describe('readCupBracket', () => {
    it('reads each tie with its aggregates and winner', async () => {
        const [firstTie] = await sheets.readCupBracket();

        expect(firstTie).toEqual({
            stage: 'r16',
            tie: 1,
            home: 'ann',
            away: 'bob',
            homeAggregate: 55,
            awayAggregate: 42,
            winner: 'ann',
        });
    });

    // An unplayed tie has empty cells. They must come back as absent rather than as
    // the string "" or 0, which would read as a goalless draw already played.
    it('leaves an unplayed tie’s aggregates and winner unset', async () => {
        const [, secondTie] = await sheets.readCupBracket();

        expect(secondTie.homeAggregate).toBeUndefined();
        expect(secondTie.awayAggregate).toBeUndefined();
        expect(secondTie.winner).toBeUndefined();
    });
});

describe('readCupSubmissions', () => {
    // The sheet stores the stage however an admin typed it. The reader hands back a
    // plain string and the cup domain narrows it -- that narrowing is what used to make
    // _shared import cup.
    it('normalises a submission row into the cup’s own shape', async () => {
        const [submission] = await sheets.readCupSubmissions();

        expect(submission.manager).toBe('ann');
        expect(submission.division).toBe('premierLeague');
        expect(submission.gameweek).toBe(4);
        expect(submission.leg).toBe(1);
        expect(submission.stage).toBe('r16'); // lower-cased from "R16"
        expect(submission.players).toEqual([101, 102, 103, 104]);
        expect(submission.submittedByAdmin).toBe(false);
        expect(submission.timestamp).toBeInstanceOf(Date);
    });
});

describe('writing the cup config and bracket', () => {
    /** Captures the cell values a write actually sends to the Sheets API. */
    const captureWrite = () => {
        const sent: (string | number)[][][] = [];
        server.use(
            http.put('https://sheets.googleapis.com/v4/spreadsheets/:id/values/:range', async ({ request }) => {
                const body = (await request.json()) as { values: (string | number)[][] };
                sent.push(body.values);
                return HttpResponse.json({ updatedCells: body.values.length });
            }),
        );
        return sent;
    };

    // The round trip is the property that matters: what we write must read back as the
    // same config. Serialising and parsing live in different modules, so they can drift.
    it('writes a config that reads back unchanged', async () => {
        const sent = captureWrite();
        const original = await sheets.readCupConfig();

        await sheets.writeCupConfig(original);

        const [rows] = sent;
        expect(rows[0]).toEqual(['Key', 'Value']);
        expect(rows).toContainEqual(['season', '2526']);
        expect(rows).toContainEqual(['r16', '4,5']);
        expect(rows).toContainEqual(['final', '10']);
    });

    it('writes bracket ties with their aggregates, and blanks for an unplayed tie', async () => {
        const sent = captureWrite();
        const bracket = await sheets.readCupBracket();

        await sheets.writeCupBracket(bracket);

        const [rows] = sent;
        expect(rows[0][0]).toBe('Stage');
        expect(rows[1]).toEqual(['r16', 1, 'ann', 'bob', 55, 42, 'ann']);
        // An unplayed tie must not invent a 0 -- it writes empty cells back.
        expect(rows[2]).toEqual(['r16', 2, 'cat', 'dee', '', '', '']);
    });
});

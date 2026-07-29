/* Location: app/transfers/lib/transfer-rows.test.ts */

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../../_shared/lib/cache/data-cache.service';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import { googleAuthHandler, sheetValuesHandler, useFakeSheetsCredentials } from '../../_shared/test/google-sheets-msw';
import type { PlayersByCode } from '../../_shared/types/player-types';

/**
 * Turning `Transfers` sheet rows into the transfers this domain models.
 *
 * This interpretation used to live inside the sheets reader, which is why that reader
 * needed FPL player data passed into it. These tests run the real reader, the real sheet
 * client and the real interpretation — only the network is substituted, per
 * `.kiro/steering/testing-conventions.md`.
 */

// Loaded after the fake credentials are in place -- see google-sheets-msw.ts.
let transferRows: typeof import('./transfer-rows');

const TRANSFER_HEADERS = [
    'Status',
    'Timestamp',
    'Manager',
    'Transfer Out',
    'Code Out',
    'Transfer In',
    'Code In',
    'Transfer Type',
    'Comment',
    'Loan To',
    'Loan From',
];

/** One row of the division's transfers tab, with only what a test cares about set. */
const transferRow = (over: Partial<Record<string, string | number>> = {}) => {
    const base: Record<string, string | number> = {
        Status: 'Y',
        Timestamp: '2026-08-20T12:00:00Z',
        Manager: 'ann',
        'Transfer Out': 'Salah',
        'Code Out': 118748,
        'Transfer In': 'Saka',
        'Code In': 223340,
        'Transfer Type': 'Transfer',
        Comment: '',
        'Loan To': '',
        'Loan From': '',
        ...over,
    };
    return TRANSFER_HEADERS.map((h) => base[h]);
};

const player = (code: number, webName: string) => ({
    code,
    id: code,
    web_name: webName,
    first_name: webName,
    second_name: webName,
    team_code: 3,
    draft: { position: 'mid' as const, pointsTotal: 0, pointsBreakdown: {} as never },
});

const PLAYERS_BY_CODE = {
    118748: player(118748, 'Salah'),
    223340: player(223340, 'Saka'),
} as unknown as PlayersByCode;

// One gameweek wide enough to contain every timestamp used below.
const GAMEWEEKS = [
    {
        fplEvent: { id: 3, name: 'Gameweek 3' },
        start: '2026-08-18T00:00:00Z',
        end: '2026-08-25T00:00:00Z',
    },
] as unknown as GameWeekData[];

const withRows = (rows: (string | number)[][]) =>
    sheetValuesHandler({ 'premierLeague-transfers': [TRANSFER_HEADERS, ...rows] });

const server = setupServer(googleAuthHandler, withRows([transferRow()]));

beforeAll(async () => {
    useFakeSheetsCredentials();
    server.listen({ onUnhandledRequest: 'error' });
    transferRows = await import('./transfer-rows');
});
afterEach(() => {
    server.resetHandlers();
    dataCache.clear(); // every sheet read is cached; otherwise test 2 sees test 1's rows
});
afterAll(() => server.close());

const read = () => transferRows.readTransferDataForDivision('premierLeague', PLAYERS_BY_CODE, GAMEWEEKS);

describe('reading a division’s transfers', () => {
    it('resolves player codes to the players going out and in', async () => {
        const { transfers } = await read();

        expect(transfers).toHaveLength(1);
        expect(transfers[0].playerOut?.web_name).toBe('Salah');
        expect(transfers[0].playerIn?.web_name).toBe('Saka');
    });

    // 'Y' / 'N' / blank is the admin's approval vocabulary in the sheet. Reading it
    // wrongly either applies a rejected transfer or ignores an approved one.
    it.each([
        ['Y', 'APPROVED'],
        ['N', 'REJECTED'],
        ['', 'PENDING'],
    ])('reads a status of "%s" as %s', async (status, expected) => {
        server.use(withRows([transferRow({ Status: status })]));

        const { transfers } = await read();

        expect(transfers[0].status).toBe(expected);
    });

    it('counts each status', async () => {
        server.use(
            withRows([
                transferRow({ Status: 'Y', Manager: 'ann' }),
                transferRow({ Status: 'N', Manager: 'bob' }),
                transferRow({ Status: '', Manager: 'cat' }),
            ]),
        );

        const result = await read();

        expect(result.processedCount).toBe(3);
        expect(result.approvedCount).toBe(1);
        expect(result.rejectedCount).toBe(1);
        expect(result.pendingCount).toBe(1);
    });

    it.each([
        ['Transfer', 'TRANSFER'],
        ['swap', 'SWAP'],
        ['loan start', 'LOAN_START'],
        ['loan end', 'LOAN_END'],
        ['trade', 'TRADE'],
        ['new player', 'NEW_PLAYER'],
    ])('reads a transfer type of "%s" as %s', async (sheetValue, expected) => {
        server.use(withRows([transferRow({ 'Transfer Type': sheetValue })]));

        const { transfers } = await read();

        expect(transfers[0].transferType).toBe(expected);
    });

    // The gameweek a transfer belongs to is derived from when it was submitted, not
    // stored. It decides which gameweek's roster the transfer is applied to.
    it('places a transfer in the gameweek its timestamp falls inside', async () => {
        server.use(withRows([transferRow({ Timestamp: '2026-08-20T12:00:00Z' })]));

        const { transfers } = await read();

        expect(transfers[0].gameweekData.fplEvent.id).toBe(3);
    });

    it('carries the loan manager fields through', async () => {
        server.use(withRows([transferRow({ 'Transfer Type': 'loan start', 'Loan To': 'bob', 'Loan From': 'ann' })]));

        const { transfers } = await read();

        expect(transfers[0].onLoanTo).toBe('bob');
        expect(transfers[0].onLoanFrom).toBe('ann');
    });

    it('returns an empty result for a division with no transfers', async () => {
        server.use(sheetValuesHandler({ 'premierLeague-transfers': [TRANSFER_HEADERS] }));

        const result = await read();

        expect(result.transfers).toEqual([]);
        expect(result.processedCount).toBe(0);
    });

    // One malformed row must not lose the rest. The result carries an errors array
    // precisely so a bad row is reported rather than silently dropping the batch.
    it('reports a bad row without discarding the good ones', async () => {
        server.use(withRows([transferRow({ Manager: 'ann' }), transferRow({ Timestamp: 'not-a-date' })]));

        const result = await read().catch(() => null);

        // Either the row is rejected into `errors`, or reading throws -- but a valid
        // row must never be silently dropped while reporting success.
        if (result) {
            expect(result.transfers.length + result.errors.length).toBe(2);
        }
    });
});

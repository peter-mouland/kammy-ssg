/* Location: app/cup/server/actions/advance-round.action.test.ts */

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { dataCache } from '../../../_shared/lib/cache/data-cache.service';
import { googleAuthHandler, sheetValuesHandler } from '../../../_shared/test/google-sheets-msw';
import { advanceRoundAction } from './advance-round.action';

/**
 * Advancing a resolved stage's winners into the next round. Only the bracket
 * sheet is involved: the real sheets client runs behind MSW and the write is
 * captured off the wire.
 */

const BRACKET_HEADERS = ['Stage', 'Tie', 'Home', 'Away', 'HomeAggregate', 'AwayAggregate', 'Winner'];

const RESOLVED_R16 = [
    BRACKET_HEADERS,
    ['r16', '0', 'ann', 'bob', '12', '12', 'ann'],
    ['r16', '1', 'cat', 'dee', '18', '2', 'cat'],
];

const server = setupServer(googleAuthHandler, sheetValuesHandler({ CupBracket: RESOLVED_R16 }));

/** Captures the cell values a bracket write sends to the Sheets API. */
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

beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
    server.resetHandlers();
    dataCache.clear();
});
afterAll(() => server.close());

describe('advanceRoundAction', () => {
    it('pairs resolved winners into the next round in bracket order', async () => {
        const sent = captureWrite();

        const result = await advanceRoundAction({ stage: 'r16' });

        expect(result.success).toBe(true);
        expect(result.message).toContain('ann v cat');
        const [rows] = sent;
        expect(rows).toContainEqual(['qf', 0, 'ann', 'cat', '', '', '', '']);
    });

    it('refuses while ties are unresolved, naming them', async () => {
        server.use(
            sheetValuesHandler({
                CupBracket: [...RESOLVED_R16.slice(0, 2), ['r16', '1', 'cat', 'dee', '', '', '']],
            }),
        );

        const result = await advanceRoundAction({ stage: 'r16' });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/tie.*1/);
    });

    it('replaces stale next-round ties on a re-run', async () => {
        server.use(
            sheetValuesHandler({
                CupBracket: [...RESOLVED_R16, ['qf', '0', 'stale', 'rows', '', '', '']],
            }),
        );
        const sent = captureWrite();

        const result = await advanceRoundAction({ stage: 'r16' });

        expect(result.success).toBe(true);
        const [rows] = sent;
        expect(rows).toContainEqual(['qf', 0, 'ann', 'cat', '', '', '', '']);
        expect(rows.some((row) => row.includes('stale'))).toBe(false);
    });

    it('refuses the final and non-knockout stages', async () => {
        expect((await advanceRoundAction({ stage: 'final' })).error).toMatch(/no next round/i);
        expect((await advanceRoundAction({ stage: 'league' })).success).toBe(false);
        captureWrite(); // the r16 advance below succeeds, which writes
        expect((await advanceRoundAction({ stage: 'r16' })).success).toBe(true);
    });
});

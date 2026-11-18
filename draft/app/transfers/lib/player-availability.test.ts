/* Location: app/transfers/lib/player-availability.test.ts */

import { describe, expect, it } from 'vitest';
import type { FplPlayerData } from '../../_shared/lib/fpl/fpl-types';
import { buildAvailabilityByCode, describeAvailabilityAsOf } from './player-availability';

/** FPL's `id` and the `code` players are keyed by differ on purpose here. */
const element = (code: number, status: string, chanceNextRound: number | null = null) =>
    ({
        id: code + 1000,
        code,
        web_name: `P${code}`,
        status,
        chance_of_playing_next_round: chanceNextRound,
    }) as FplPlayerData;

describe("FPL's availability, by player", () => {
    it('leaves out available players: no entry means nothing to flag', () => {
        expect(buildAvailabilityByCode([element(1, 'a', 100), element(2, 'a')])).toEqual({});
    });

    it('keeps each kind of doubt, keyed by code rather than id', () => {
        const byCode = buildAvailabilityByCode([
            element(1, 'i', 0),
            element(2, 's', 0),
            element(3, 'u', 0),
            element(4, 'n', 0),
        ]);

        expect(Object.keys(byCode)).toEqual(['1', '2', '3', '4']);
        expect(byCode[1].status).toBe('i');
        expect(byCode[2].status).toBe('s');
        expect(byCode[1001]).toBeUndefined();
    });

    it("keeps a doubtful player's chance of playing", () => {
        expect(buildAvailabilityByCode([element(1, 'd', 75)])[1]).toEqual({ status: 'd', chanceNextRound: 75 });
    });

    it('drops the chance when FPL has none to give', () => {
        expect(buildAvailabilityByCode([element(1, 'i', null)])[1]).toEqual({ status: 'i' });
    });

    it('ignores a status FPL might add that we do not know', () => {
        expect(buildAvailabilityByCode([element(1, 'x', 0)])).toEqual({});
    });
});

describe('the "as of" line above the squad and player list', () => {
    const snapshot = (fetchedAt: string) => ({ kind: 'ready' as const, snapshot: { byCode: {}, fetchedAt } });
    const NOW = new Date('2026-11-20T15:30:00Z');

    it('gives the time of the copy, in UK time', () => {
        expect(describeAvailabilityAsOf(snapshot('2026-11-20T14:05:00Z'), NOW)).toBe(
            'Injury and suspension news as of 14:05',
        );
    });

    it('adds the day when the copy is from an earlier day', () => {
        expect(describeAvailabilityAsOf(snapshot('2026-11-19T23:40:00Z'), NOW)).toBe(
            'Injury and suspension news as of Thu 23:40',
        );
    });

    // No icons must never read as "everyone is fit".
    it('says so while the news is still coming, and when it cannot be shown', () => {
        expect(describeAvailabilityAsOf({ kind: 'loading' }, NOW)).toBe('Checking injury and suspension news…');
        expect(describeAvailabilityAsOf({ kind: 'unavailable' }, NOW)).toBe(
            'Injury and suspension news is unavailable right now',
        );
    });
});

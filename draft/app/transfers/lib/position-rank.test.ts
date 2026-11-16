/* Location: app/transfers/lib/position-rank.test.ts */

import { describe, expect, it } from 'vitest';
import type { CustomPosition } from '../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { buildPositionRanksByCode } from './position-rank';

const player = (code: number, position: CustomPosition, pointsTotal: number, { isHidden = false } = {}) =>
    ({ id: code, code, web_name: `P${code}`, draft: { position, pointsTotal, isHidden } }) as EnhancedPlayerData;

describe('ranking within a position', () => {
    it('ranks a player only against players at the same position', () => {
        const ranks = buildPositionRanksByCode([
            player(1, 'gk', 40),
            player(2, 'ca', 90),
            player(3, 'ca', 60),
            player(4, 'gk', 70),
        ]);

        expect(ranks[1]).toEqual({ rank: 2, of: 2, position: 'gk', tied: false });
        expect(ranks[3]).toEqual({ rank: 2, of: 2, position: 'ca', tied: false });
        expect(ranks[2].rank).toBe(1);
    });

    it('gives players on equal points the same rank, and the next rank skips', () => {
        const ranks = buildPositionRanksByCode([
            player(1, 'cb', 50),
            player(2, 'cb', 40),
            player(3, 'cb', 40),
            player(4, 'cb', 30),
        ]);

        expect([1, 2, 3, 4].map((code) => ranks[code].rank)).toEqual([1, 2, 2, 4]);
        expect([1, 2, 3, 4].map((code) => ranks[code].tied)).toEqual([false, true, true, false]);
    });

    it('leaves hidden players out of both the rank and the count', () => {
        const ranks = buildPositionRanksByCode([
            player(1, 'mid', 80, { isHidden: true }),
            player(2, 'mid', 50),
            player(3, 'mid', 20),
        ]);

        expect(ranks[1]).toBeUndefined();
        expect(ranks[2]).toEqual({ rank: 1, of: 2, position: 'mid', tied: false });
    });

    it('has no rank for a player who is not in the pool', () => {
        expect(buildPositionRanksByCode([player(1, 'fb', 10)])[99]).toBeUndefined();
    });
});

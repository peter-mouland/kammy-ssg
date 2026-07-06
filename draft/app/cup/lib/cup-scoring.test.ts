/* Location: app/cup/lib/cup-scoring.test.ts */

import { describe, expect, it } from 'vitest';
import { buildGameweekPointsMap, type PlayerPointsRow, scoreSubmission } from './cup-scoring';

const ROWS: PlayerPointsRow[] = [
    { playerCode: 10, 'gw-24': 6, 'gw-25': 2 },
    { playerCode: 11, 'gw-24': '4', 'gw-24-b': '3' }, // double gameweek, string values
    { playerCode: 12, 'gw-25': 9 },
];

describe('buildGameweekPointsMap', () => {
    it('reads a gameweek column into a code->points map', () => {
        const map = buildGameweekPointsMap(ROWS, 24);
        expect(map.get(10)).toBe(6);
        expect(map.get(12)).toBe(0); // no gw-24 value
    });

    it('sums the double-gameweek second value', () => {
        const map = buildGameweekPointsMap(ROWS, 24);
        expect(map.get(11)).toBe(7); // 4 + 3
    });
});

describe('scoreSubmission', () => {
    it('sums the selected players league points', () => {
        const map = buildGameweekPointsMap(ROWS, 24);
        expect(scoreSubmission([10, 11], map)).toBe(13); // 6 + 7
    });

    it('treats missing players as zero', () => {
        const map = buildGameweekPointsMap(ROWS, 24);
        expect(scoreSubmission([10, 999], map)).toBe(6);
    });
});

/* Location: app/cup/lib/cup-leagues.test.ts */

import { describe, expect, it } from 'vitest';
import { buildLeagueTables, generateLeagues, leagueName } from './cup-leagues';
import type { CupStanding } from './cup-standings';

/** Deterministic shuffle for tests: reverses instead of randomising. */
const reverse = () => 0;

describe('generateLeagues', () => {
    it('puts every manager in exactly one league', () => {
        const managers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
        const leagues = generateLeagues(managers, 4, reverse);

        expect(leagues.flat().sort()).toEqual([...managers].sort());
    });

    it('never exceeds the chosen size, and keeps leagues within one of each other', () => {
        // 25 managers at 8 per league must not strand a league of 1: 7, 6, 6, 6 instead of 8, 8, 8, 1.
        const managers = Array.from({ length: 25 }, (_, i) => `m${i}`);
        const leagues = generateLeagues(managers, 8, reverse);

        expect(leagues).toHaveLength(4);
        expect(leagues.map((league) => league.length)).toEqual([7, 6, 6, 6]);
    });

    it('makes one league when the size covers everyone', () => {
        expect(generateLeagues(['a', 'b'], 8, reverse)).toEqual([['b', 'a']]);
    });

    it('rejects a league size under two', () => {
        expect(() => generateLeagues(['a', 'b'], 1, reverse)).toThrow(/at least 2/);
        expect(() => generateLeagues(['a', 'b'], 0, reverse)).toThrow(/at least 2/);
    });

    it('returns no leagues when there are no managers', () => {
        expect(generateLeagues([], 8, reverse)).toEqual([]);
    });
});

describe('leagueName', () => {
    it('names leagues A, B, C in order', () => {
        expect([leagueName(0), leagueName(1), leagueName(2)]).toEqual(['League A', 'League B', 'League C']);
    });
});

describe('buildLeagueTables', () => {
    const standings: CupStanding[] = [
        { manager: 'ann', points: 30, autopickCount: 0, disqualified: false, rank: 1 },
        { manager: 'bob', points: 20, autopickCount: 0, disqualified: false, rank: 2 },
        { manager: 'cat', points: 10, autopickCount: 0, disqualified: false, rank: 3 },
    ];
    const managerInfo = new Map([
        [
            'ann',
            {
                userName: 'Ann',
                teamName: 'Ann FC',
                division: 'premierLeague' as const,
                visibility: 'revealed' as const,
            },
        ],
        [
            'bob',
            {
                userName: 'Bob',
                teamName: 'Bob FC',
                division: 'premierLeague' as const,
                visibility: 'not_submitted' as const,
            },
        ],
        [
            'cat',
            {
                userName: 'Cat',
                teamName: 'Cat FC',
                division: 'championship' as const,
                visibility: 'not_submitted' as const,
            },
        ],
        [
            'dan',
            {
                userName: 'Dan',
                teamName: 'Dan FC',
                division: 'championship' as const,
                visibility: 'not_submitted' as const,
            },
        ],
    ]);

    it('groups managers into their leagues, best first, with global rank kept', () => {
        const tables = buildLeagueTables({
            leagues: [
                ['cat', 'ann'],
                ['dan', 'bob'],
            ],
            standings,
            managerInfo,
        });

        expect(tables.map((table) => table.name)).toEqual(['League A', 'League B']);
        expect(tables[0]?.entries.map((entry) => [entry.manager, entry.points, entry.rank])).toEqual([
            ['ann', 30, 1],
            ['cat', 10, 3],
        ]);
        expect(tables[1]?.entries.map((entry) => entry.manager)).toEqual(['bob', 'dan']);
    });

    it('includes league members who have not scored yet, on zero points', () => {
        const tables = buildLeagueTables({ leagues: [['dan', 'bob']], standings, managerInfo });
        const dan = tables[0]?.entries.find((entry) => entry.manager === 'dan');

        expect(dan).toMatchObject({ points: 0, rank: null });
    });

    it('returns no tables when no leagues have been generated', () => {
        expect(buildLeagueTables({ leagues: [], standings, managerInfo })).toEqual([]);
    });
});

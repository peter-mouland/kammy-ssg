/* Location: app/cup/lib/knockout.test.ts */

import { describe, expect, it } from 'vitest';
import { advanceWinners, fisherYatesShuffle, pairIntoMatchups, resolveTie } from './knockout';

describe('fisherYatesShuffle', () => {
    it('is a permutation and is deterministic for a fixed random source', () => {
        const items = [1, 2, 3, 4, 5];
        const random = () => 0; // always picks index 0 in the swap
        const shuffled = fisherYatesShuffle(items, random);
        expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
        expect(fisherYatesShuffle(items, () => 0)).toEqual(shuffled); // deterministic
        expect(items).toEqual([1, 2, 3, 4, 5]); // input not mutated
    });
});

describe('pairIntoMatchups', () => {
    it('pairs consecutive managers into ties', () => {
        const matchups = pairIntoMatchups(['a', 'b', 'c', 'd'], 'r16');
        expect(matchups).toHaveLength(2);
        expect(matchups[0]).toMatchObject({ tie: 0, home: 'a', away: 'b' });
        expect(matchups[1]).toMatchObject({ tie: 1, home: 'c', away: 'd' });
    });

    it('gives a bye when an opponent is missing', () => {
        const matchups = pairIntoMatchups(['a', null], 'sf');
        expect(matchups[0]).toMatchObject({ home: 'a', away: null });
    });
});

describe('resolveTie', () => {
    const tie = { stage: 'r16' as const, tie: 0, home: 'a', away: 'b' };

    it('adds the two legs and picks the higher aggregate', () => {
        const resolved = resolveTie(tie, { homeLeg1: 5, awayLeg1: 4, homeLeg2: 2, awayLeg2: 1 });
        expect(resolved.homeAggregate).toBe(7);
        expect(resolved.awayAggregate).toBe(5);
        expect(resolved.winner).toBe('a');
    });

    it('leaves the winner undefined on an aggregate draw', () => {
        const resolved = resolveTie(tie, { homeLeg1: 3, awayLeg1: 3, homeLeg2: 2, awayLeg2: 2 });
        expect(resolved.winner).toBeUndefined();
    });

    it('advances the present manager on a bye', () => {
        const bye = { stage: 'r16' as const, tie: 0, home: 'a', away: null };
        expect(resolveTie(bye, { homeLeg1: 0, awayLeg1: 0, homeLeg2: 0, awayLeg2: 0 }).winner).toBe('a');
    });
});

describe('advanceWinners', () => {
    it('pairs winners of consecutive ties into the next round', () => {
        const resolved = [
            { stage: 'r16' as const, tie: 0, home: 'a', away: 'b', winner: 'a' },
            { stage: 'r16' as const, tie: 1, home: 'c', away: 'd', winner: 'd' },
        ];
        const next = advanceWinners(resolved, 'qf');
        expect(next).toHaveLength(1);
        expect(next[0]).toMatchObject({ stage: 'qf', home: 'a', away: 'd' });
    });
});

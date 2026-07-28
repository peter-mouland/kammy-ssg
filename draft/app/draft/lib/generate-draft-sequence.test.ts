/* Location: app/draft/lib/generate-draft-sequence.test.ts */

import { describe, expect, it } from 'vitest';
import type { DraftOrderData } from '../types/draft-types';
import { generateDraftSequence } from './generate-draft-sequence';

// A draft order is one row per manager, and `position` is what the snake reverses.
// Names are deliberately positional so an expected sequence reads as an order.
const orderOf = (...userNames: string[]): DraftOrderData[] =>
    userNames.map((userName, index) => ({
        divisionId: 'premierLeague' as const,
        position: index + 1,
        userId: userName.toLowerCase(),
        userName,
        generatedAt: new Date('2026-08-01T12:00:00Z'),
    }));

/** The thing a manager actually looks at: who picks, in order. */
const pickingOrder = (sequence: ReturnType<typeof generateDraftSequence>) => sequence.map((entry) => entry.userName);

describe('generateDraftSequence', () => {
    // The defining property of a snake draft: round 2 runs backwards, round 3 forwards
    // again. Getting this wrong hands someone two picks in a row that they have not
    // earned, which is the single most consequential bug this domain can have.
    it('reverses the order on even rounds and restores it on odd ones', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob', 'Cat'), 4);

        expect(pickingOrder(sequence)).toEqual([
            'Ann',
            'Bob',
            'Cat', // round 1 — forward
            'Cat',
            'Bob',
            'Ann', // round 2 — reversed
            'Ann',
            'Bob',
            'Cat', // round 3 — forward again
            'Cat',
            'Bob',
            'Ann', // round 4 — reversed
        ]);
    });

    // The turn of the round is where the snake pays out: whoever picks last in round 1
    // picks first in round 2, so they get two picks back to back. That is the
    // compensation for picking last, and it must actually happen.
    it('gives the last picker of an odd round the first pick of the next', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob', 'Cat'), 2);

        expect(sequence[2].userName).toBe('Cat'); // last pick of round 1
        expect(sequence[3].userName).toBe('Cat'); // first pick of round 2
    });

    it('numbers picks continuously across rounds, starting at 1', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob', 'Cat'), 3);

        expect(sequence.map((entry) => entry.pickNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('labels each pick with the round it belongs to', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob'), 3);

        expect(sequence.map((entry) => entry.round)).toEqual([1, 1, 2, 2, 3, 3]);
    });

    it('produces one pick per manager per round', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob', 'Cat', 'Dee'), 12);

        expect(sequence).toHaveLength(48); // 4 managers x 12 rounds
    });

    // Every manager must get the same number of picks. A snake that drops or repeats
    // someone would still produce a plausible-looking sequence of the right length.
    it('gives every manager the same number of picks', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob', 'Cat', 'Dee', 'Eve'), 6);

        const picksEach = sequence.reduce<Record<string, number>>((acc, entry) => {
            acc[entry.userName] = (acc[entry.userName] || 0) + 1;
            return acc;
        }, {});

        expect(picksEach).toEqual({ Ann: 6, Bob: 6, Cat: 6, Dee: 6, Eve: 6 });
    });

    // A two-manager draft is the smallest case where reversal is observable, and the
    // one most likely to be special-cased by accident.
    it('still snakes with only two managers', () => {
        const sequence = generateDraftSequence(orderOf('Ann', 'Bob'), 4);

        expect(pickingOrder(sequence)).toEqual(['Ann', 'Bob', 'Bob', 'Ann', 'Ann', 'Bob', 'Bob', 'Ann']);
    });

    it('returns nothing for an empty draft order', () => {
        expect(generateDraftSequence([], 12)).toEqual([]);
    });

    it('returns nothing when there are no rounds to play', () => {
        expect(generateDraftSequence(orderOf('Ann', 'Bob'), 0)).toEqual([]);
    });
});

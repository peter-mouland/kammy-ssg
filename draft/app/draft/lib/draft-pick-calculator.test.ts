/* Location: app/draft/lib/draft-pick-calculator.test.ts */

import { describe, expect, it } from 'vitest';
import type { DivisionId } from '../../_shared/types/league-types';
import type { DraftOrderData, DraftPickData } from '../types/draft-types';
import { calculateCurrentPick, calculateCurrentUserId } from './draft-pick-calculator';
import { generateDraftSequence } from './generate-draft-sequence';

const orderOf = (...userNames: string[]): DraftOrderData[] =>
    userNames.map((userName, index) => ({
        divisionId: 'premierLeague' as const,
        position: index + 1,
        userId: userName.toLowerCase(),
        userName,
        generatedAt: new Date('2026-08-01T12:00:00Z'),
    }));

/** `n` picks already made in a division. Only the count and division matter here. */
const picksMade = (n: number, divisionId: DivisionId = 'premierLeague'): DraftPickData[] =>
    Array.from({ length: n }, (_, index) => ({
        pickNumber: index + 1,
        round: 1,
        userId: 'someone',
        playerId: 100 + index,
        playerCode: 200 + index,
        playerName: `Player ${index}`,
        teamCode: '1',
        teamName: 'Arsenal',
        position: 'mid',
        pickedAt: new Date('2026-08-01T12:00:00Z'),
        divisionId,
    }));

const ORDER = orderOf('Ann', 'Bob', 'Cat');

describe('calculateCurrentPick', () => {
    it('is pick 1 before anyone has drafted', () => {
        expect(calculateCurrentPick('premierLeague', [])).toBe(1);
    });

    it('is the pick about to be made, not the last one made', () => {
        expect(calculateCurrentPick('premierLeague', picksMade(4))).toBe(5);
    });

    // Each division runs its own independent draft. If picks leaked across divisions,
    // one division finishing its draft would push another division's draft forward.
    it('ignores picks made in other divisions', () => {
        const picks = [...picksMade(2, 'premierLeague'), ...picksMade(7, 'championship')];

        expect(calculateCurrentPick('premierLeague', picks)).toBe(3);
        expect(calculateCurrentPick('championship', picks)).toBe(8);
        expect(calculateCurrentPick('leagueOne', picks)).toBe(1);
    });
});

describe('calculateCurrentUserId', () => {
    it('starts with the manager at position 1', () => {
        expect(calculateCurrentUserId('premierLeague', [], ORDER, 12)).toBe('ann');
    });

    it('follows the order through the first round', () => {
        expect(calculateCurrentUserId('premierLeague', picksMade(1), ORDER, 12)).toBe('bob');
        expect(calculateCurrentUserId('premierLeague', picksMade(2), ORDER, 12)).toBe('cat');
    });

    // The turn: whoever picked last in round 1 picks first in round 2.
    it('reverses at the start of an even round', () => {
        expect(calculateCurrentUserId('premierLeague', picksMade(3), ORDER, 12)).toBe('cat');
        expect(calculateCurrentUserId('premierLeague', picksMade(4), ORDER, 12)).toBe('bob');
        expect(calculateCurrentUserId('premierLeague', picksMade(5), ORDER, 12)).toBe('ann');
    });

    it('reverses back at the start of an odd round', () => {
        expect(calculateCurrentUserId('premierLeague', picksMade(6), ORDER, 12)).toBe('ann');
    });

    it('is scoped to its own division', () => {
        const picks = [...picksMade(1, 'premierLeague'), ...picksMade(5, 'championship')];

        // One pick made in the premier league, so it is the second manager's turn there.
        expect(calculateCurrentUserId('premierLeague', picks, ORDER, 12)).toBe('bob');
    });

    // An empty string is the "nobody" signal the draft room checks for.
    it('names nobody once every pick has been made', () => {
        expect(calculateCurrentUserId('premierLeague', picksMade(6), ORDER, 2)).toBe('');
    });

    it('still names someone on the very last pick', () => {
        expect(calculateCurrentUserId('premierLeague', picksMade(5), ORDER, 2)).toBe('ann');
    });
});

// The snake rule is implemented three times: in generateDraftSequence (what the draft
// room displays), in calculateCurrentUserId (what the server records against a pick),
// and in calculateNextPicker (the "on deck" badge). If they ever disagree, the room
// shows one manager's turn while the server accepts a pick from another.
describe('the displayed order and the recorded order agree', () => {
    it.each([
        ['3 managers', orderOf('Ann', 'Bob', 'Cat'), 4],
        ['5 managers', orderOf('Ann', 'Bob', 'Cat', 'Dee', 'Eve'), 3],
        ['2 managers', orderOf('Ann', 'Bob'), 6],
    ])('for %s', (_label, order, picksPerTeam) => {
        const sequence = generateDraftSequence(order, picksPerTeam);

        const recorded = sequence.map((_entry, index) =>
            calculateCurrentUserId('premierLeague', picksMade(index), order, picksPerTeam),
        );

        expect(recorded).toEqual(sequence.map((entry) => entry.userId));
    });
});

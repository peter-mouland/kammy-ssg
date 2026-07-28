/* Location: app/draft/lib/calculate-next-picker.test.ts */

import { describe, expect, it } from 'vitest';
import type { DraftOrderData, DraftStateData } from '../types/draft-types';
import { calculateNextPicker } from './calculate-next-picker';

const orderOf = (...userNames: string[]): DraftOrderData[] =>
    userNames.map((userName, index) => ({
        divisionId: 'premierLeague' as const,
        position: index + 1,
        userId: userName.toLowerCase(),
        userName,
        generatedAt: new Date('2026-08-01T12:00:00Z'),
    }));

const ORDER = orderOf('Ann', 'Bob', 'Cat');

/** A live draft, with only the fields a test cares about set per case. */
const draftState = (overrides: Partial<DraftStateData> = {}): DraftStateData => ({
    isActive: true,
    currentUserId: 'ann',
    divisionId: 'premierLeague',
    picksPerTeam: 12,
    startedAt: new Date('2026-08-01T12:00:00Z'),
    completedAt: null,
    currentPick: 1,
    ...overrides,
});

// This answers "who is ON DECK", not "whose turn is it". The draft room renders it as
// "Get Ready..." beside the manager after the one currently picking, so it deliberately
// looks one pick beyond `currentPick`.
describe('calculateNextPicker', () => {
    it('names the manager picking after the current one', () => {
        const next = calculateNextPicker(draftState({ currentPick: 1 }), ORDER);

        expect(next).toEqual({ userId: 'bob', userName: 'Bob', pickNumber: 2 });
    });

    // At the end of an odd round the snake turns, so the manager on deck is the one
    // currently picking -- they pick twice in a row. This is the case most likely to be
    // broken by "simplifying" the reversal.
    it('names the current picker again at the turn of the round', () => {
        // Pick 3 is the last of round 1 (Cat). Pick 4 is the first of round 2, also Cat.
        const next = calculateNextPicker(draftState({ currentPick: 3 }), ORDER);

        expect(next).toEqual({ userId: 'cat', userName: 'Cat', pickNumber: 4 });
    });

    it('walks back down the order through an even round', () => {
        // Round 2 runs Cat, Bob, Ann across picks 4, 5, 6.
        expect(calculateNextPicker(draftState({ currentPick: 4 }), ORDER)?.userName).toBe('Bob'); // pick 5
        expect(calculateNextPicker(draftState({ currentPick: 5 }), ORDER)?.userName).toBe('Ann'); // pick 6
    });

    it('turns again at the start of an odd round', () => {
        // Pick 6 ends round 2 with Ann; pick 7 opens round 3 with Ann.
        expect(calculateNextPicker(draftState({ currentPick: 6 }), ORDER)?.userName).toBe('Ann');
    });

    // The draft has to end. Without this the room would keep pointing at someone after
    // the final pick.
    it('returns nobody once the final pick has been reached', () => {
        // 3 managers x 2 picks each = 6 picks; there is no 7th.
        const atLastPick = draftState({ currentPick: 6, picksPerTeam: 2 });

        expect(calculateNextPicker(atLastPick, ORDER)).toBeNull();
    });

    it('still names someone on the second-to-last pick', () => {
        const nearlyDone = draftState({ currentPick: 5, picksPerTeam: 2 });

        expect(calculateNextPicker(nearlyDone, ORDER)?.pickNumber).toBe(6);
    });

    it('returns nobody when the draft is not active', () => {
        expect(calculateNextPicker(draftState({ isActive: false }), ORDER)).toBeNull();
    });

    it('returns nobody when there is no draft state at all', () => {
        expect(calculateNextPicker(null, ORDER)).toBeNull();
    });

    it('returns nobody when no draft order has been generated', () => {
        expect(calculateNextPicker(draftState(), [])).toBeNull();
    });
});

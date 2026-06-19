import { describe, expect, it } from 'vitest';
import type { TeamRoster } from '../../teams/types/team-types';
import { createEmptyPoints, createEmptyStats, getRosterTopScorer } from './roster-conversion-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSlot(seasonTotal: number, gameweekTotal: number) {
    return {
        player: {
            playerId: 1,
            playerCode: 1,
            playerName: 'Test Player',
            playerPosition: 'mid' as const,
            teamPosition: 'mid' as const,
            teamSlotIndex: 0,
            isSub: false,
            onLoanTo: null,
            onLoanFrom: null,
            onLoanStart: null,
            assignedAt: new Date().toISOString(),
        },
        gameweek: {
            stats: createEmptyStats(),
            points: { ...createEmptyPoints(), total: gameweekTotal },
        },
        season: {
            stats: createEmptyStats(),
            points: { ...createEmptyPoints(), total: seasonTotal },
            seasonUpToGameweek: 1,
            seasonGeneratedOn: '',
        },
    };
}

// ---------------------------------------------------------------------------
// getRosterTopScorer
// ---------------------------------------------------------------------------

describe('getRosterTopScorer', () => {
    it('returns the slot with the highest season points', () => {
        const roster = {
            gk_0: makeSlot(50, 6),
            cb_0: makeSlot(80, 8),
            cb_1: makeSlot(30, 4),
        } as unknown as TeamRoster;

        const result = getRosterTopScorer(roster, true);
        expect(result?.slot).toBe('cb_0');
        expect(result?.points).toBe(80);
    });

    it('returns the slot with the highest gameweek points when useSeasonPoints=false', () => {
        const roster = {
            gk_0: makeSlot(50, 12),
            cb_0: makeSlot(80, 4),
        } as unknown as TeamRoster;

        const result = getRosterTopScorer(roster, false);
        expect(result?.slot).toBe('gk_0');
        expect(result?.points).toBe(12);
    });

    it('handles a slot with missing season data without crashing and returns the valid slot', () => {
        const slot = makeSlot(40, 5);
        const brokenSlot = { ...slot, season: undefined } as unknown as typeof slot;

        const roster = {
            gk_0: slot,
            cb_0: brokenSlot,
        } as unknown as TeamRoster;

        expect(() => getRosterTopScorer(roster, true)).not.toThrow();
        const result = getRosterTopScorer(roster, true);
        expect(result?.slot).toBe('gk_0');
    });

    it('returns null for an empty roster', () => {
        const result = getRosterTopScorer({} as TeamRoster, true);
        expect(result).toBeNull();
    });
});

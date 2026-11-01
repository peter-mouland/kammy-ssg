/* Location: app/cup/lib/cup-submission.test.ts */

import { describe, expect, it } from 'vitest';
import type { ProcessedCupSheetData } from '../types/cup-types';
import { findLatestSubmission, validateCupSubmission } from './cup-submission';

const SQUAD = [10, 11, 12, 13, 14, 15];

describe('validateCupSubmission', () => {
    it('accepts a valid selection of the required size', () => {
        const result = validateCupSubmission({ players: [10, 11, 12, 13], playersRequired: 4, squadCodes: SQUAD });
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('rejects the wrong number of players', () => {
        const result = validateCupSubmission({ players: [10, 11, 12], playersRequired: 4, squadCodes: SQUAD });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('exactly 4');
    });

    it('rejects duplicate picks', () => {
        const result = validateCupSubmission({ players: [10, 10, 11, 12], playersRequired: 4, squadCodes: SQUAD });
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('same player'))).toBe(true);
    });

    it('rejects players not in the squad', () => {
        const result = validateCupSubmission({ players: [10, 11, 12, 99], playersRequired: 4, squadCodes: SQUAD });
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('not in your squad'))).toBe(true);
    });

    it('rejects players reused from the other leg of the round', () => {
        const result = validateCupSubmission({
            players: [10, 11, 12, 13],
            playersRequired: 4,
            squadCodes: SQUAD,
            usedPlayers: [13],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('other leg'))).toBe(true);
    });
});

describe('findLatestSubmission', () => {
    const row = (manager: string, gameweek: number, players: number[]): ProcessedCupSheetData => ({
        status: '',
        timestamp: new Date('2026-08-12T10:00:00Z'),
        manager,
        division: 'premierLeague',
        gameweek,
        stage: 'league',
        leg: 1,
        players,
        submittedByAdmin: false,
        adminReason: '',
    });

    it('returns the last matching row, keeping earlier rows as history', () => {
        const submissions = [row('ann', 3, [10]), row('ann', 3, [11]), row('bob', 3, [12])];
        expect(findLatestSubmission(submissions, 'ann', 3)?.players).toEqual([11]);
    });

    it('returns undefined when nothing matches', () => {
        expect(findLatestSubmission([row('ann', 3, [10])], 'ann', 4)).toBeUndefined();
    });
});

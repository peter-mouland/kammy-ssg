/* Location: app/cup/lib/cup-submission.test.ts */

import { describe, expect, it } from 'vitest';
import { validateCupSubmission } from './cup-submission';

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

import { describe, expect, it } from 'vitest';
import { formatPointsDisplay } from './utils';

// formatPointsDisplay renders the figure in the Points column of the player gameweek
// table -- the headline number for a player's gameweek.

describe('formatPointsDisplay', () => {
    it('shows a positive total as-is', () => {
        expect(formatPointsDisplay(9)).toBe('9');
    });

    it('shows zero as zero', () => {
        expect(formatPointsDisplay(0)).toBe('0');
    });

    // The bug this test was written for: the negative branch built the string as
    // `-${points}`, and `points` already carries its own minus sign, so a player who
    // scored -3 in a gameweek had "--3" rendered in the Points column.
    it('shows a negative total with a single minus sign', () => {
        expect(formatPointsDisplay(-3)).toBe('-3');
        expect(formatPointsDisplay(-12)).toBe('-12');
    });

    // NOTE: the function's docstring says "with + prefix for positive points", which has
    // never been implemented. That is a product decision (it changes every points figure
    // in the UI), not a bug fix, so it is deliberately NOT asserted here. See the backlog.
});

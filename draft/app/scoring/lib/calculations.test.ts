import { describe, expect, it } from 'vitest';
import {
    calculateBonus,
    calculateDefensiveContribution,
    calculateGoalsConcededPenalty,
    calculateSavesBonus,
} from './calculations';

// ---------------------------------------------------------------------------
// calculateDefensiveContribution
// ---------------------------------------------------------------------------

// We compute CBIT/CBIRT ourselves from the raw components and key the metric off OUR
// custom position: defenders (cb/fb) use CBIT (10+ = +1, recoveries excluded);
// midfielders (mid) use CBIRT (12+ = +2, recoveries included). This must NOT rely on
// FPL's aggregate, which bakes in FPL's own position.
const raw = (clearancesBlocksInterceptions: number, tackles: number, recoveries: number) => ({
    clearancesBlocksInterceptions,
    tackles,
    recoveries,
});

describe('calculateDefensiveContribution', () => {
    // Same input, only the position changes: isolates that CB/FB use CBIT vs a
    // threshold of 10 while MID uses CBIRT vs 12. raw(6,4,0) is 10 CBIT / 10 CBIRT.
    it('scores the same input differently by position (10 CBIT/CBIRT, no recoveries)', () => {
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'cb')).toBe(1); // 10 >= 10
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'fb')).toBe(1); // 10 >= 10
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'mid')).toBe(0); // 10 < 12
        expect(calculateDefensiveContribution(raw(6, 4, 0), 'gk')).toBe(0); // no rule
    });

    // Defender boundary: only CBIT changes (recoveries fixed at 0).
    it('awards a defender +1 exactly at the CBIT threshold of 10, not below', () => {
        expect(calculateDefensiveContribution(raw(5, 4, 0), 'fb')).toBe(0); // 9
        expect(calculateDefensiveContribution(raw(5, 5, 0), 'fb')).toBe(1); // 10
        expect(calculateDefensiveContribution(raw(5, 5, 0), 'cb')).toBe(1); // 10
    });

    // Counter-case: recoveries must NOT lift a defender over the line.
    it('ignores recoveries for a defender (9 CBIT + 9 recoveries stays 0)', () => {
        expect(calculateDefensiveContribution(raw(5, 4, 9), 'fb')).toBe(0); // CBIT 9, recoveries ignored
    });

    // Midfielder boundary: only CBIRT changes.
    it('awards a midfielder +2 exactly at the CBIRT threshold of 12, not below', () => {
        expect(calculateDefensiveContribution(raw(6, 5, 0), 'mid')).toBe(0); // 11
        expect(calculateDefensiveContribution(raw(6, 5, 1), 'mid')).toBe(2); // 12
    });

    // Counter-case: for a midfielder ONLY recoveries change, proving they count.
    it('counts recoveries for a midfielder (the Matheus Nunes case)', () => {
        expect(calculateDefensiveContribution(raw(6, 4, 1), 'mid')).toBe(0); // 10 CBIT + 1 = 11 < 12
        expect(calculateDefensiveContribution(raw(6, 4, 2), 'mid')).toBe(2); // 10 CBIT + 2 = 12
    });

    it('returns 0 for positions with no defensive-contribution rule (gk, wa, ca)', () => {
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'gk')).toBe(0);
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'wa')).toBe(0);
        expect(calculateDefensiveContribution(raw(20, 20, 20), 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateGoalsConcededPenalty
// ---------------------------------------------------------------------------

describe('calculateGoalsConcededPenalty', () => {
    // Rule: 0 goals conceded = 0pts (handled by clean sheet separately)
    //       1st goal conceded = 0pts (free goal)
    //       2nd goal conceded = -1pt
    //       3rd goal conceded = -2pts (cumulative)
    // Formula: goalsConceded * penalty + 1, where penalty = -1

    it('returns 0 for 0 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(0, 'gk')).toBe(0);
        expect(calculateGoalsConcededPenalty(0, 'cb')).toBe(0);
        expect(calculateGoalsConcededPenalty(0, 'fb')).toBe(0);
    });

    it('returns 0 for the first goal conceded (free goal)', () => {
        expect(calculateGoalsConcededPenalty(1, 'gk')).toBe(0);
        expect(calculateGoalsConcededPenalty(1, 'cb')).toBe(0);
        expect(calculateGoalsConcededPenalty(1, 'fb')).toBe(0);
    });

    it('returns -1 for 2 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(2, 'gk')).toBe(-1);
        expect(calculateGoalsConcededPenalty(2, 'cb')).toBe(-1);
        expect(calculateGoalsConcededPenalty(2, 'fb')).toBe(-1);
    });

    it('returns -2 for 3 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(3, 'gk')).toBe(-2);
    });

    it('returns -4 for 5 goals conceded', () => {
        expect(calculateGoalsConcededPenalty(5, 'gk')).toBe(-4);
    });

    it('returns 0 for positions that do not have a goals conceded rule (mid, wa, ca)', () => {
        expect(calculateGoalsConcededPenalty(3, 'mid')).toBe(0);
        expect(calculateGoalsConcededPenalty(3, 'wa')).toBe(0);
        expect(calculateGoalsConcededPenalty(3, 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateSavesBonus
// ---------------------------------------------------------------------------

describe('calculateSavesBonus', () => {
    // Rule: threshold = 2, ratio = 3 (1pt per 3 saves)
    // Saves ≤ threshold → 0pts
    // Points = floor(saves / ratio) — threshold is NOT subtracted before dividing

    it('returns 0 for saves at or below the threshold (0, 1, 2)', () => {
        expect(calculateSavesBonus(0, 'gk')).toBe(0);
        expect(calculateSavesBonus(1, 'gk')).toBe(0);
        expect(calculateSavesBonus(2, 'gk')).toBe(0);
    });

    it('returns 1pt for 3 saves (floor(3/3) = 1)', () => {
        expect(calculateSavesBonus(3, 'gk')).toBe(1);
    });

    it('returns 1pt for 5 saves (floor(5/3) = 1)', () => {
        expect(calculateSavesBonus(5, 'gk')).toBe(1);
    });

    it('returns 2pts for 6 saves (floor(6/3) = 2)', () => {
        expect(calculateSavesBonus(6, 'gk')).toBe(2);
    });

    it('returns 3pts for 9 saves (floor(9/3) = 3)', () => {
        expect(calculateSavesBonus(9, 'gk')).toBe(3);
    });

    it('returns 0 for non-goalkeeper positions regardless of saves', () => {
        expect(calculateSavesBonus(10, 'cb')).toBe(0);
        expect(calculateSavesBonus(10, 'mid')).toBe(0);
        expect(calculateSavesBonus(10, 'ca')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// calculateBonus
// ---------------------------------------------------------------------------

describe('calculateBonus', () => {
    // Rule: cb and mid only. rule.bonus = 1 (the minimum threshold, not a multiplier).
    // Returns the raw bonus stat value when stat >= threshold, otherwise 0.
    // i.e. bonus stat IS the points value (1 BPS point = 1 app point)

    it('returns 0 for positions with no bonus rule (gk, fb, wa, ca)', () => {
        expect(calculateBonus(10, 'gk')).toBe(0);
        expect(calculateBonus(10, 'fb')).toBe(0);
        expect(calculateBonus(10, 'wa')).toBe(0);
        expect(calculateBonus(10, 'ca')).toBe(0);
    });

    it('returns 0 when bonus stat is below threshold (< 1)', () => {
        expect(calculateBonus(0, 'cb')).toBe(0);
        expect(calculateBonus(0, 'mid')).toBe(0);
    });

    it('returns the raw stat value when bonus stat meets the threshold', () => {
        expect(calculateBonus(1, 'cb')).toBe(1);
        expect(calculateBonus(1, 'mid')).toBe(1);
    });

    it('returns the raw stat value for higher bonus values (stat = points)', () => {
        expect(calculateBonus(3, 'cb')).toBe(3);
        expect(calculateBonus(5, 'mid')).toBe(5);
    });
});

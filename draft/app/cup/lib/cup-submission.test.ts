/* Location: app/cup/lib/cup-submission.test.ts */

import { describe, expect, it } from 'vitest';
import type { CupConfig, CupRound, ProcessedCupSheetData } from '../types/cup-types';
import { findGroupUsedPlayers, findLatestSubmission, findUsedPlayers, validateCupSubmission } from './cup-submission';

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

    it('rejects players already used in the stage', () => {
        const result = validateCupSubmission({
            players: [10, 11, 12, 13],
            playersRequired: 4,
            squadCodes: SQUAD,
            usedPlayers: [13],
        });
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('already used in this stage'))).toBe(true);
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

describe('findGroupUsedPlayers', () => {
    const CONFIG: CupConfig = {
        season: '2526',
        league: [21, 22, 23],
        r16: [24, 25],
        qf: [27, 28],
        sf: [30, 32],
        final: 33,
    };
    const leagueRow = (manager: string, gameweek: number, players: number[]): ProcessedCupSheetData => ({
        status: 'Y',
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

    it('unions the latest picks from every other league gameweek', () => {
        const submissions = [leagueRow('ann', 21, [10, 11]), leagueRow('ann', 23, [12])];
        expect(findGroupUsedPlayers(submissions, 'ann', CONFIG, 22).sort()).toEqual([10, 11, 12]);
    });

    it('ignores the current gameweek, other managers and knockout rounds', () => {
        const submissions = [
            leagueRow('ann', 22, [10]),
            leagueRow('bob', 21, [11]),
            { ...leagueRow('ann', 24, [13]), stage: 'r16' as const },
        ];
        expect(findGroupUsedPlayers(submissions, 'ann', CONFIG, 22)).toEqual([]);
    });

    it('uses the latest row when a gameweek was resubmitted', () => {
        const submissions = [leagueRow('ann', 21, [10]), leagueRow('ann', 21, [11])];
        expect(findGroupUsedPlayers(submissions, 'ann', CONFIG, 22)).toEqual([11]);
    });
});

describe('findUsedPlayers', () => {
    const CONFIG: CupConfig = {
        season: '2526',
        league: [21, 22],
        r16: [24, 25],
        qf: [27, 28],
        sf: [30, 32],
        final: 33,
    };
    const row = (manager: string, gameweek: number, players: number[]): ProcessedCupSheetData => ({
        status: 'Y',
        timestamp: new Date('2026-08-12T10:00:00Z'),
        manager,
        division: 'premierLeague',
        gameweek,
        stage: 'r16',
        leg: gameweek === 24 ? 1 : 2,
        players,
        submittedByAdmin: false,
        adminReason: '',
    });
    const round = (overrides: Partial<CupRound>): CupRound => ({
        stage: 'r16',
        leg: 2,
        gameweek: 25,
        playersRequired: 4,
        twoLegged: true,
        ...overrides,
    });

    it('returns the other leg’s team in a two-legged round', () => {
        expect(findUsedPlayers([row('ann', 24, [10, 11])], 'ann', CONFIG, round({}))).toEqual([10, 11]);
    });

    it('returns every other league gameweek’s team in a league round', () => {
        const submissions = [row('ann', 21, [10]), row('ann', 22, [11])];
        expect(
            findUsedPlayers(submissions, 'ann', CONFIG, round({ stage: 'league', leg: 1, gameweek: 22, twoLegged: false })),
        ).toEqual([10]);
    });

    it('returns nothing for a play-off round', () => {
        const submissions = [row('ann', 24, [10]), row('ann', 21, [11])];
        expect(
            findUsedPlayers(submissions, 'ann', CONFIG, round({ stage: 'playoff', leg: 1, gameweek: 26, twoLegged: false })),
        ).toEqual([]);
    });
});

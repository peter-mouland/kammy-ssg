/* Location: app/cup/lib/cup-matchups.test.ts */

import { describe, expect, it } from 'vitest';
import type { CupConfig, CupMatchup, CupRound, ProcessedCupSheetData } from '../types/cup-types';
import { buildStageMatchups } from './cup-matchups';
import type { PlayerPointsRow } from './cup-scoring';

const CONFIG: CupConfig = {
    season: '2526',
    league: [21, 22, 23],
    r16: [24, 25],
    qf: [27, 28],
    sf: [30, 32],
    final: 33,
};

const POINTS: PlayerPointsRow[] = [
    { playerCode: 1, 'gw-24': 5, 'gw-25': 4 },
    { playerCode: 2, 'gw-24': 3, 'gw-25': 6 },
];

function sub(manager: string, gameweek: number, players: number[], status = 'Y'): ProcessedCupSheetData {
    return {
        status,
        timestamp: new Date('2026-01-01'),
        manager,
        division: 'championship',
        gameweek,
        stage: 'r16',
        leg: gameweek === 24 ? 1 : 2,
        players,
        submittedByAdmin: false,
        adminReason: '',
    };
}

const BRACKET: CupMatchup[] = [{ stage: 'r16', tie: 0, home: 'a', away: 'b' }];
const R16_LEG2: CupRound = { stage: 'r16', leg: 2, gameweek: 25, playersRequired: 4, twoLegged: true };

describe('buildStageMatchups', () => {
    const base = {
        bracket: BRACKET,
        round: R16_LEG2,
        cupConfig: CONFIG,
        pointsRows: POINTS,
        userNameById: new Map([
            ['a', 'Alice'],
            ['b', 'Bob'],
        ]),
    };

    it('pairs the two managers and names them', () => {
        const [tie] = buildStageMatchups({
            ...base,
            submissions: [],
            deadlinePassedFor: () => false,
        });
        expect(tie?.home.name).toBe('Alice');
        expect(tie?.away.name).toBe('Bob');
    });

    it('shows leg points and aggregate only when both legs are revealed', () => {
        const submissions = [sub('a', 24, [1]), sub('a', 25, [1, 2])];
        const [tie] = buildStageMatchups({
            ...base,
            submissions,
            deadlinePassedFor: () => true, // both legs past deadline + confirmed
        });
        expect(tie?.home.points).toBe(10); // gw25 (viewed leg): player1(4) + player2(6)
        expect(tie?.home.aggregate).toBe(15); // gw24 (5) + gw25 (10)
    });

    it('hides points until the leg is revealed', () => {
        const submissions = [sub('a', 25, [1, 2])];
        const [tie] = buildStageMatchups({
            ...base,
            submissions,
            deadlinePassedFor: () => false, // deadline not passed
        });
        expect(tie?.home.points).toBeNull();
        expect(tie?.home.aggregate).toBeNull();
    });

    it('labels a missing opponent as a BYE', () => {
        const [tie] = buildStageMatchups({
            ...base,
            bracket: [{ stage: 'r16', tie: 0, home: 'a', away: null }],
            submissions: [],
            deadlinePassedFor: () => false,
        });
        expect(tie?.away.name).toBe('BYE');
    });
});

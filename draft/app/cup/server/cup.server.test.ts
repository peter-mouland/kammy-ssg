/* Location: app/cup/server/cup.server.test.ts */

import { describe, expect, it } from 'vitest';
import type { UserTeamsSheetData } from '../../_shared/types/league-types';
import type { PlayerPointsRow } from '../lib/cup-scoring';
import type { CupConfig, ProcessedCupSheetData } from '../types/cup-types';
import { getCupStandings } from './cup.server';

/**
 * Standings count each manager+gameweek once. Resubmits append rows, so the
 * latest row is the team — an earlier, superseded row must neither score nor
 * count autopicks, and the rank tiebreak must read the latest ranks.
 */

const CONFIG: CupConfig = {
    season: '2526',
    league: [21, 22],
    r16: [24, 25],
    qf: [27, 28],
    sf: [30, 32],
    final: 33,
};

const USER_TEAMS: UserTeamsSheetData[] = [
    { userId: 'ann', userName: 'Ann', teamName: 'Ann FC', divisionId: 'premierLeague', lastUpdated: new Date() },
    { userId: 'bob', userName: 'Bob', teamName: 'Bob FC', divisionId: 'premierLeague', lastUpdated: new Date() },
];

const POINTS: PlayerPointsRow[] = [
    { playerCode: 1, 'gw-21': 5 },
    { playerCode: 2, 'gw-21': 3 },
    { playerCode: 3, 'gw-21': 2 },
    { playerCode: 4, 'gw-21': 0 },
    { playerCode: 9, 'gw-21': 100 },
];

function submission(
    manager: string,
    players: number[],
    over: Partial<ProcessedCupSheetData> = {},
): ProcessedCupSheetData {
    return {
        status: 'Y',
        timestamp: new Date('2026-08-12T10:00:00Z'),
        manager,
        division: 'premierLeague',
        gameweek: 21,
        stage: 'league',
        leg: 1,
        players,
        submittedByAdmin: false,
        adminReason: '',
        ...over,
    };
}

describe('getCupStandings', () => {
    it('scores and tiebreaks on the latest submission only', () => {
        const { standings } = getCupStandings({
            userTeams: USER_TEAMS,
            cupConfig: CONFIG,
            submissions: [
                submission('ann', [9, 9]), // superseded: 200 pts must not count
                submission('ann', [1, 4]), // latest: 5 pts, first-entered 5
                submission('bob', [2, 3]), // 5 pts, first-entered 3
            ],
            pointsRows: POINTS,
        });

        const ann = standings.find((s) => s.manager === 'ann');
        expect(ann?.points).toBe(5);
        expect(standings.map((s) => s.manager)).toEqual(['ann', 'bob']);
    });

    it('counts autopicks from the latest submissions only', () => {
        const { standings } = getCupStandings({
            userTeams: USER_TEAMS,
            cupConfig: CONFIG,
            submissions: [
                submission('ann', [9], { submittedByAdmin: true, adminReason: 'autopick' }),
                submission('ann', [1]), // corrected manually: no longer an autopick
                submission('bob', [2]),
            ],
            pointsRows: POINTS,
        });

        expect(standings.find((s) => s.manager === 'ann')?.autopickCount).toBe(0);
        expect(standings.find((s) => s.manager === 'ann')?.disqualified).toBe(false);
    });
});

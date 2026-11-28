/* Location: app/cup/server/cup.server.test.ts */

import { afterEach, describe, expect, it } from 'vitest';
import { resetInMemoryFirestore } from '../../_shared/lib/firestore-cache/firestore-memory';
import type { GameWeekData } from '../../_shared/lib/fpl/fpl-types';
import type { UserTeamsSheetData } from '../../_shared/types/league-types';
import { createDivisionTeamsDocument } from '../../scoring/index.server';
import type { DivisionTeamsDocument, RosterByManagerId } from '../../teams';
import type { PlayerPointsRow } from '../lib/cup-scoring';
import type { CupConfig, ProcessedCupSheetData } from '../types/cup-types';
import { getCupStandings, getCupSubmitData } from './cup.server';

process.env.KAMMY_FIXTURE_FIRESTORE = '1';

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

    it('ignores a rejected row, scoring the earlier valid team instead', () => {
        const { standings } = getCupStandings({
            userTeams: USER_TEAMS,
            cupConfig: CONFIG,
            submissions: [
                submission('ann', [1, 4]), // valid: 5 pts
                submission('ann', [9, 9], { status: 'N' }), // rejected: 200 pts must not count
                submission('bob', [2, 3]), // 5 pts, first-entered 3
            ],
            pointsRows: POINTS,
        });

        const ann = standings.find((s) => s.manager === 'ann');
        expect(ann?.points).toBe(5);
        expect(standings.map((s) => s.manager)).toEqual(['ann', 'bob']);
    });
});

describe('getCupSubmitData squad picker', () => {
    afterEach(() => resetInMemoryFirestore());

    // The live GW13 state: the cup round is GW22, picked before its deadline,
    // but only GW21's division document exists. The picker must offer the GW21
    // squad rather than nobody at all.
    it('offers the most recent squad when the round gameweek has no document yet', async () => {
        await createDivisionTeamsDocument({
            divisionId: 'premierLeague',
            gameweek: 21,
            lastUpdated: '2026-01-01T00:00:00.000Z',
            teams: {
                ann: {
                    roster: {
                        gk_0: { player: { playerCode: 1, playerName: 'Keeper', playerPosition: 'gk' } },
                        cb_0: { player: { playerCode: 2, playerName: 'Back', playerPosition: 'cb' } },
                    },
                },
            } as unknown as RosterByManagerId,
            metadata: {
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                pointsLastUpdated: null,
                pointsLastGameweek: null,
            },
        } as DivisionTeamsDocument);

        const gameweekData = {
            fplEvent: { id: 22, deadline_time: '2099-01-01T11:00:00Z', finished: false },
            start: new Date('2020-01-01T00:00:00Z'),
            end: new Date('2099-01-01T11:00:00Z'),
        } as unknown as GameWeekData;

        const pageData = await getCupSubmitData({
            userTeams: USER_TEAMS,
            selectedUser: USER_TEAMS[0],
            gameweekData,
            cupConfig: { ...CONFIG, league: [22] },
            submissions: [],
            fixtures: [],
            now: new Date('2026-06-01T00:00:00Z'),
        });

        expect(pageData.squad.map((player) => player.code)).toEqual([1, 2]);
        expect(pageData.squadGameweek).toBe(21);
    });
});

/* Location: app/cup/lib/autopick.test.ts */

import { describe, expect, it } from 'vitest';
import type { DivisionId } from '../../_shared/types/league-types';
import { makeMgr2Roster, makeStandardRoster } from '../../transfers/lib/validators/fixtures';
import type { CupConfig, CupRound, ProcessedCupSheetData } from '../types/cup-types';
import { type AutopickCandidate, generateAutopick, planAutopicks } from './autopick';
import type { CupSquadPlayer } from './cup-squad';

function player(code: number, name: string): CupSquadPlayer {
    return { code, name, position: 'mid', isSub: false, isPending: false };
}

const SQUAD: CupSquadPlayer[] = [player(1, 'Zidane'), player(2, 'Ada'), player(3, 'Charlie'), player(4, 'Beckham')];

describe('generateAutopick', () => {
    it('picks the required number of players alphabetically', () => {
        expect(generateAutopick(SQUAD, 2)).toEqual([2, 4]); // Ada, Beckham
    });

    it('excludes players already used in the other leg', () => {
        expect(generateAutopick(SQUAD, 2, [2])).toEqual([4, 3]); // skip Ada -> Beckham, Charlie
    });

    it('returns fewer than required when the squad is too small', () => {
        expect(generateAutopick(SQUAD, 10)).toHaveLength(4);
    });
});

const CONFIG: CupConfig = {
    season: '2526',
    league: [1, 2],
    r16: [3, 4],
    qf: [5, 6],
    sf: [7, 8],
    final: 10,
};

const R16_LEG2: CupRound = { stage: 'r16', leg: 2, gameweek: 4, playersRequired: 4, twoLegged: true };

function submission(manager: string, gameweek: number, players: number[]): ProcessedCupSheetData {
    return {
        status: 'Y',
        timestamp: new Date('2026-08-12T10:00:00Z'),
        manager,
        division: 'premierLeague' as DivisionId,
        gameweek,
        stage: 'r16',
        leg: gameweek === 3 ? 1 : 2,
        players,
        submittedByAdmin: false,
        adminReason: '',
    };
}

function candidate(manager: string, roster: AutopickCandidate['roster']): AutopickCandidate {
    return { manager, division: 'premierLeague' as DivisionId, roster };
}

describe('planAutopicks', () => {
    const base = {
        cupConfig: CONFIG,
        round: R16_LEG2,
        gameweek: 4,
        now: new Date('2026-08-13T10:00:00Z'),
    };

    it('autopicks alphabetically for a manager with no submission', () => {
        const outcome = planAutopicks({
            ...base,
            candidates: [candidate('ann', makeStandardRoster())],
            submissions: [],
        });

        expect(outcome.autopicked).toEqual(['ann']);
        expect(outcome.skipped).toEqual([]);
        expect(outcome.rows).toHaveLength(1);
        expect(outcome.rows[0]).toMatchObject({
            manager: 'ann',
            gameweek: 4,
            stage: 'r16',
            leg: 2,
            players: [110, 111, 102, 103], // CentreAtt1/2, CentreBack1/2
            submittedByAdmin: true,
            adminReason: 'autopick',
        });
    });

    it('skips a manager who already submitted', () => {
        const outcome = planAutopicks({
            ...base,
            candidates: [candidate('ann', makeStandardRoster()), candidate('bob', makeMgr2Roster())],
            submissions: [submission('ann', 4, [101])],
        });

        expect(outcome.autopicked).toEqual(['bob']);
        expect(outcome.skipped).toEqual([{ manager: 'ann', reason: 'already submitted' }]);
    });

    it('excludes the other leg’s players from the pick', () => {
        const outcome = planAutopicks({
            ...base,
            candidates: [candidate('ann', makeStandardRoster())],
            submissions: [submission('ann', 3, [110, 111, 102, 103])],
        });

        expect(outcome.rows[0]?.players).toEqual([104, 105, 101, 106]);
    });

    it('skips a manager whose squad could not be loaded', () => {
        const outcome = planAutopicks({
            ...base,
            candidates: [candidate('ann', null)],
            submissions: [],
        });

        expect(outcome.autopicked).toEqual([]);
        expect(outcome.rows).toEqual([]);
        expect(outcome.skipped).toEqual([{ manager: 'ann', reason: 'no squad found' }]);
    });
});

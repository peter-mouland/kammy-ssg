/* Location: app/leagues/lib/category-standings.test.ts */

import { describe, expect, it } from 'vitest';
import type { LeagueStandingsTeamData, PositionPointsBreakdown } from '../types/league-standings-types';
import { getCategoryStandings } from './category-standings';

const ZERO: PositionPointsBreakdown = { gk: 0, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0, total: 0 };

/** A manager whose season so far is only the category points given. */
const team = (userId: string, season: Partial<PositionPointsBreakdown>): LeagueStandingsTeamData => ({
    userId,
    userName: userId,
    teamName: `${userId} FC`,
    gameweekPoints: ZERO,
    seasonPoints: { ...ZERO, ...season },
});

/** Eight managers, CB points spread so "me" is 3rd: 10 behind 2nd, 25 clear of 4th. */
const EIGHT_MANAGERS = [
    team('first', { cb: 200 }),
    team('second', { cb: 152 }),
    team('me', { cb: 142 }),
    team('fourth', { cb: 117 }),
    team('fifth', { cb: 100 }),
    team('sixth', { cb: 90 }),
    team('seventh', { cb: 80 }),
    team('eighth', { cb: 70 }),
];

const cbFor = (standings: LeagueStandingsTeamData[], userId: string) =>
    getCategoryStandings(standings, userId).find((standing) => standing.position === 'cb');

describe('a manager in the middle of a category', () => {
    it('is ranked by points, earns the rank points the league table awards, and sees the gaps either side', () => {
        expect(cbFor(EIGHT_MANAGERS, 'me')).toMatchObject({
            label: 'CB',
            rank: 3,
            isTied: false,
            rankPoints: 5,
            points: 142,
            totalManagers: 8,
            gapAbove: 10,
            gapBelow: 25,
        });
    });
});

describe('the ends of a category', () => {
    it('has no one to chase at the top', () => {
        expect(cbFor(EIGHT_MANAGERS, 'first')).toMatchObject({ rank: 1, rankPoints: 7, gapAbove: null, gapBelow: 48 });
    });

    it('has no one to stay clear of at the bottom', () => {
        expect(cbFor(EIGHT_MANAGERS, 'eighth')).toMatchObject({ rank: 8, rankPoints: 0, gapAbove: 10, gapBelow: null });
    });
});

describe('managers level on points', () => {
    const standings = [team('a', { fb: 50 }), team('me', { fb: 40 }), team('b', { fb: 40 }), team('c', { fb: 10 })];

    it('share the higher rank and split the rank points', () => {
        const fb = getCategoryStandings(standings, 'me').find((standing) => standing.position === 'fb');

        // Places 2 and 3 of 4 are worth 2 and 1 rank points; level managers get 1.5 each.
        expect(fb).toMatchObject({ rank: 2, isTied: true, tiedCount: 2, rankPoints: 1.5 });
    });

    it('measure the gaps past the managers they are level with', () => {
        const fb = getCategoryStandings(standings, 'me').find((standing) => standing.position === 'fb');

        // 10 behind "a" in 1st, 30 clear of "c" in 4th -- not 0 from "b" beside them.
        expect(fb).toMatchObject({ gapAbove: 10, gapBelow: 30 });
    });
});

describe('every category', () => {
    it('comes back once each, in league-table order, with the slots that count towards it', () => {
        const standings = getCategoryStandings(EIGHT_MANAGERS, 'me');

        expect(standings.map((standing) => standing.position)).toEqual(['gk', 'cb', 'fb', 'mid', 'wa', 'ca']);
        expect(standings[0]).toMatchObject({ label: 'GK / Sub', slots: ['gk_0', 'sub_0'] });
    });

    it('is empty for a manager who is not in the standings', () => {
        expect(getCategoryStandings(EIGHT_MANAGERS, 'stranger')).toEqual([]);
    });
});

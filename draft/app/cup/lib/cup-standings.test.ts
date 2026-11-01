/* Location: app/cup/lib/cup-standings.test.ts */

import { describe, expect, it } from 'vitest';
import { computeLeagueStandings, getQualifiers, type ScoredSubmission } from './cup-standings';

const LEAGUE_GWS = [21, 22, 23];

function scored(manager: string, gameweek: number, points: number, isAutopick = false): ScoredSubmission {
    return { manager, gameweek, points, isAutopick };
}

describe('computeLeagueStandings', () => {
    it('sums points per manager across the league gameweeks only', () => {
        const standings = computeLeagueStandings(
            [scored('a', 21, 10), scored('a', 22, 5), scored('a', 99, 100), scored('b', 21, 8)],
            LEAGUE_GWS,
        );
        const a = standings.find((s) => s.manager === 'a');
        expect(a?.points).toBe(15); // gw99 excluded
    });

    it('eliminates on season-wide autopicks, including knockout ones (rule 4.14)', () => {
        const standings = computeLeagueStandings(
            [scored('a', 21, 100, true), scored('b', 21, 90)],
            LEAGUE_GWS,
            new Map([['a', 2]]), // one league autopick plus one knockout autopick
        );
        expect(standings.find((s) => s.manager === 'a')?.disqualified).toBe(true);
        expect(standings.map((s) => s.manager)).toEqual(['b', 'a']);
    });

    it('ranks by points and orders disqualified managers last', () => {
        const standings = computeLeagueStandings(
            [
                scored('winner', 21, 30),
                scored('dq', 21, 100, true),
                scored('dq', 22, 100, true), // 2 autopicks => DQ
                scored('mid', 21, 20),
            ],
            LEAGUE_GWS,
        );
        expect(standings.map((s) => s.manager)).toEqual(['winner', 'mid', 'dq']);
        expect(standings.find((s) => s.manager === 'dq')?.disqualified).toBe(true);
        expect(standings[0]?.rank).toBe(1);
    });
});

describe('computeLeagueStandings tiebreak (rules 4.15/4.8)', () => {
    it('splits level points on combined first-entered players', () => {
        const standings = computeLeagueStandings(
            [scored('a', 21, 10), scored('b', 21, 10)],
            LEAGUE_GWS,
            new Map(),
            new Map([
                ['a', [12, 0, 0]],
                ['b', [8, 0, 0]],
            ]),
        );
        expect(standings.map((s) => s.manager)).toEqual(['a', 'b']);
    });

    it('falls through to second and third when earlier levels are equal', () => {
        const standings = computeLeagueStandings(
            [scored('a', 21, 10), scored('b', 21, 10)],
            LEAGUE_GWS,
            new Map(),
            new Map([
                ['a', [5, 5, 1]],
                ['b', [5, 5, 9]],
            ]),
        );
        expect(standings.map((s) => s.manager)).toEqual(['b', 'a']);
    });

    it('falls back to manager id when all three levels are equal', () => {
        const standings = computeLeagueStandings(
            [scored('zed', 21, 10), scored('ann', 21, 10)],
            LEAGUE_GWS,
            new Map(),
            new Map([
                ['zed', [5, 5, 5]],
                ['ann', [5, 5, 5]],
            ]),
        );
        expect(standings.map((s) => s.manager)).toEqual(['ann', 'zed']);
    });
});

describe('getQualifiers', () => {
    it('takes the top non-disqualified managers', () => {
        const standings = computeLeagueStandings(
            [
                scored('a', 21, 30),
                scored('b', 21, 20),
                scored('c', 21, 40, true),
                scored('c', 22, 1, true), // DQ despite high points
            ],
            LEAGUE_GWS,
        );
        expect(getQualifiers(standings, 2)).toEqual(['a', 'b']);
    });
});

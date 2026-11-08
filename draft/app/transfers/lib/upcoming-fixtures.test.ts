/* Location: app/transfers/lib/upcoming-fixtures.test.ts */

import { describe, expect, it } from 'vitest';
import type { FplFixtureData, FplTeam } from '../../_shared/lib/fpl/fpl-types';
import { buildUpcomingFixturesByTeamCode } from './upcoming-fixtures';

/** FPL identifies clubs in fixtures by `id`; players carry `code`. They differ on purpose here. */
const team = (id: number, code: number, shortName: string) =>
    ({ id, code, short_name: shortName, name: shortName }) as unknown as FplTeam;

const ARS = team(1, 3, 'ARS');
const LIV = team(12, 14, 'LIV');
const MCI = team(13, 43, 'MCI');
const TEAMS = [ARS, LIV, MCI];

let nextId = 1;
const fixture = (
    event: number,
    home: FplTeam,
    away: FplTeam,
    { homeDifficulty = 3, awayDifficulty = 3, kickoff = `2025-01-${String(event).padStart(2, '0')}T15:00:00Z` } = {},
) =>
    ({
        id: nextId++,
        event,
        team_h: home.id,
        team_a: away.id,
        team_h_difficulty: homeDifficulty,
        team_a_difficulty: awayDifficulty,
        kickoff_time: kickoff,
        finished: true,
        started: true,
    }) as unknown as FplFixtureData;

describe("a club's next three gameweeks", () => {
    const fixtures = [
        fixture(20, ARS, LIV), // before the window
        fixture(21, ARS, LIV, { homeDifficulty: 4, awayDifficulty: 2 }),
        fixture(22, MCI, ARS, { homeDifficulty: 3, awayDifficulty: 5 }),
        fixture(23, ARS, MCI, { homeDifficulty: 2, awayDifficulty: 4 }),
        fixture(24, LIV, ARS), // after it
    ];

    it('starts at the gameweek the transfer is for, keyed by the code players carry', () => {
        const byCode = buildUpcomingFixturesByTeamCode(fixtures, TEAMS, 21);

        expect(byCode[3].map((gw) => gw.gameweek)).toEqual([21, 22, 23]);
        expect(byCode[1]).toBeUndefined(); // 1 is Arsenal's id, not its code
    });

    it('gives each side its own difficulty, home and away', () => {
        const byCode = buildUpcomingFixturesByTeamCode(fixtures, TEAMS, 21);

        expect(byCode[3][0].fixtures).toEqual([{ opponent: 'LIV', isHome: true, difficulty: 4 }]);
        expect(byCode[14][0].fixtures).toEqual([{ opponent: 'ARS', isHome: false, difficulty: 2 }]);
        expect(byCode[3][1].fixtures).toEqual([{ opponent: 'MCI', isHome: false, difficulty: 5 }]);
    });
});

describe('doubles and blanks', () => {
    const fixtures = [
        fixture(21, LIV, ARS, { kickoff: '2025-01-21T20:00:00Z' }),
        fixture(21, ARS, MCI, { kickoff: '2025-01-18T15:00:00Z' }),
        fixture(23, ARS, LIV),
    ];

    it('puts both matches of a double in the one gameweek, in kick-off order', () => {
        const [gw21] = buildUpcomingFixturesByTeamCode(fixtures, TEAMS, 21)[3];

        expect(gw21.fixtures.map((f) => f.opponent)).toEqual(['MCI', 'LIV']);
    });

    it('keeps a blank gameweek as an empty slot rather than pulling the next match forward', () => {
        const arsenal = buildUpcomingFixturesByTeamCode(fixtures, TEAMS, 21)[3];

        expect(arsenal.map((gw) => [gw.gameweek, gw.fixtures.length])).toEqual([
            [21, 2],
            [22, 0],
            [23, 1],
        ]);
    });

    it('gives a club with nothing scheduled three empty slots', () => {
        expect(buildUpcomingFixturesByTeamCode([], TEAMS, 21)[43]).toEqual([
            { gameweek: 21, fixtures: [] },
            { gameweek: 22, fixtures: [] },
            { gameweek: 23, fixtures: [] },
        ]);
    });
});

describe('the end of the season', () => {
    it('stops at gameweek 38', () => {
        const arsenal = buildUpcomingFixturesByTeamCode([fixture(37, ARS, LIV)], TEAMS, 37)[3];

        expect(arsenal.map((gw) => gw.gameweek)).toEqual([37, 38]);
    });
});

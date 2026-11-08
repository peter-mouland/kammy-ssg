/* Location: app/transfers/lib/upcoming-fixtures.ts */

import type { FplFixtureData, FplTeam } from '../../_shared/lib/fpl/fpl-types';

export const UPCOMING_GAMEWEEK_COUNT = 3;
const LAST_GAMEWEEK = 38;

/** One match from a club's point of view. */
export interface UpcomingFixture {
    /** The opponent's short name, e.g. "ARS". */
    opponent: string;
    isHome: boolean;
    /** FPL's difficulty rating for this club in this match, 1 (easiest) to 5. */
    difficulty: number;
}

/** A club's matches in one gameweek: none for a blank, two for a double. */
export interface UpcomingGameweek {
    gameweek: number;
    fixtures: UpcomingFixture[];
}

export type UpcomingFixturesByTeamCode = Record<FplTeam['code'], UpcomingGameweek[]>;

/**
 * Each club's next few gameweeks of fixtures, keyed by team `code` (what players carry).
 *
 * The window starts at `fromGameweek` -- the gameweek a transfer is being made for -- rather
 * than at the first unfinished fixture, so it reads the same at any point in the cycle and
 * under a fixed clock. Every club gets one slot per gameweek in the window, so a blank shows
 * up as an empty slot instead of silently pulling the next match forward. Gameweeks past the
 * end of the season are left out.
 */
export function buildUpcomingFixturesByTeamCode(
    fixtures: FplFixtureData[],
    teams: FplTeam[],
    fromGameweek: number,
    gameweekCount = UPCOMING_GAMEWEEK_COUNT,
): UpcomingFixturesByTeamCode {
    const teamsById = new Map(teams.map((team) => [team.id, team]));
    const lastGameweek = Math.min(fromGameweek + gameweekCount - 1, LAST_GAMEWEEK);
    const gameweeks: number[] = [];
    for (let gameweek = fromGameweek; gameweek <= lastGameweek; gameweek++) {
        gameweeks.push(gameweek);
    }

    const byTeamCode: UpcomingFixturesByTeamCode = {};
    for (const team of teams) {
        byTeamCode[team.code] = gameweeks.map((gameweek) => ({ gameweek, fixtures: [] }));
    }

    const inWindow = fixtures
        .filter((fixture) => fixture.event >= fromGameweek && fixture.event <= lastGameweek)
        .sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));

    for (const fixture of inWindow) {
        addFixture(byTeamCode, teamsById, fixture, fromGameweek, true);
        addFixture(byTeamCode, teamsById, fixture, fromGameweek, false);
    }

    return byTeamCode;
}

function addFixture(
    byTeamCode: UpcomingFixturesByTeamCode,
    teamsById: Map<number, FplTeam>,
    fixture: FplFixtureData,
    fromGameweek: number,
    isHome: boolean,
) {
    const team = teamsById.get(isHome ? fixture.team_h : fixture.team_a);
    const opponent = teamsById.get(isHome ? fixture.team_a : fixture.team_h);
    const slot = team ? byTeamCode[team.code]?.[fixture.event - fromGameweek] : undefined;
    if (!slot) {
        return;
    }
    slot.fixtures.push({
        opponent: opponent?.short_name ?? '?',
        isHome,
        difficulty: isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty,
    });
}

/* Location: app/cup/lib/cup-fixtures.ts */

import type { FplFixtureData, FplTeam } from '../../_shared/lib/fpl/fpl-types';

/** A single real-world fixture shown at the top of the cup page for a gameweek. */
export interface CupFixture {
    home: string;
    away: string;
    kickoff: string;
    started: boolean;
    finished: boolean;
    homeScore: number | null;
    awayScore: number | null;
}

/** The fixtures for one gameweek, with team ids resolved to short names. */
export function buildCupFixtures(fixtures: FplFixtureData[], teams: FplTeam[], gameweek: number): CupFixture[] {
    const nameById = new Map(teams.map((team) => [team.id, team.short_name]));
    return fixtures
        .filter((fixture) => fixture.event === gameweek)
        .map((fixture) => ({
            home: nameById.get(fixture.team_h) ?? String(fixture.team_h),
            away: nameById.get(fixture.team_a) ?? String(fixture.team_a),
            kickoff: fixture.kickoff_time,
            started: fixture.started,
            finished: fixture.finished,
            homeScore: fixture.started ? fixture.team_h_score : null,
            awayScore: fixture.started ? fixture.team_a_score : null,
        }));
}

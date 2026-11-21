/* Location: app/transfers/lib/fixture-ease.ts */

import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import type { UpcomingFixture, UpcomingFixturesByTeamCode, UpcomingGameweek } from './upcoming-fixtures';

/** One more than FPL's hardest rating, so flipping its 1-5 scale gives 5 for the easiest game. */
const FLIP_DIFFICULTY = 6;

/**
 * How easy one match is: 5 for the easiest down to 1 for the hardest.
 *
 * FPL rates the other way round (1 is easiest). Flipping it is what lets matches add up: on
 * FPL's own scale a double gameweek would sum to look harder, and a blank would look easiest.
 */
function fixtureEase(fixture: UpcomingFixture): number {
    return FLIP_DIFFICULTY - fixture.difficulty;
}

/** A gameweek's matches added up: 0 for a blank, both matches for a double. */
export function gameweekEase(gameweek: UpcomingGameweek): number {
    return gameweek.fixtures.reduce((total, fixture) => total + fixtureEase(fixture), 0);
}

export interface FixtureRunEase {
    /** The whole run added up. */
    total: number;
    /** Each gameweek's ease, in order, for breaking a tie on the total. */
    byGameweek: number[];
}

/** How easy a club's next few gameweeks are, or null when its fixtures are not known. */
export function fixtureRunEase(gameweeks: UpcomingGameweek[] | undefined): FixtureRunEase | null {
    if (!gameweeks?.length) {
        return null;
    }
    const byGameweek = gameweeks.map(gameweekEase);
    return { total: byGameweek.reduce((total, ease) => total + ease, 0), byGameweek };
}

export type FixtureSortDirection = 'asc' | 'desc';

/** How many gameweeks, after the total, break a tie: the first, then the second. */
const TIE_BREAK_GAMEWEEKS = 2;

/**
 * Compares two runs on the fixtures alone, easiest first: the total, then the first gameweek,
 * then the second. 0 when the fixtures cannot tell them apart.
 */
function compareRuns(a: FixtureRunEase, b: FixtureRunEase): number {
    if (a.total !== b.total) {
        return b.total - a.total;
    }
    for (let index = 0; index < TIE_BREAK_GAMEWEEKS; index++) {
        const difference = (b.byGameweek[index] ?? 0) - (a.byGameweek[index] ?? 0);
        if (difference !== 0) {
            return difference;
        }
    }
    return 0;
}

/**
 * Orders players by how easy their club's next few gameweeks are.
 *
 * `desc` puts the easiest run first and `asc` the hardest. Only the fixtures flip with the
 * direction: a tie they cannot settle always goes to more season points, then name A-Z, so
 * players at the same club read the same way either way round. A club whose fixtures are not
 * known always sorts last.
 */
export function compareByFixtureEase(
    upcomingFixturesByTeamCode: UpcomingFixturesByTeamCode,
    direction: FixtureSortDirection,
): (a: EnhancedPlayerData, b: EnhancedPlayerData) => number {
    return (a, b) => {
        const runA = fixtureRunEase(upcomingFixturesByTeamCode[a.team_code]);
        const runB = fixtureRunEase(upcomingFixturesByTeamCode[b.team_code]);

        if (runA && !runB) return -1;
        if (!runA && runB) return 1;
        if (runA && runB) {
            const byFixtures = compareRuns(runA, runB);
            if (byFixtures !== 0) {
                return direction === 'desc' ? byFixtures : -byFixtures;
            }
        }

        const byPoints = (b.draft?.pointsTotal ?? 0) - (a.draft?.pointsTotal ?? 0);
        if (byPoints !== 0) {
            return byPoints;
        }
        return a.web_name.localeCompare(b.web_name);
    };
}

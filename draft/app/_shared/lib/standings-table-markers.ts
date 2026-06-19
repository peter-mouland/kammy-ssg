import type { DivisionId } from '../../teams/types/team-types';

export type StandingsRowMarker = 'prize' | 'promotion' | 'relegation';

/** Row index for the 2nd-place team when sorted by total points descending. */
export const SECOND_PLACE_ROW_INDEX = 1;

/** Row index for the 3rd-place team (line appears below 3rd). */
export const PROMOTION_ROW_INDEX = 2;

/** Relegation row index is `teamCount - RELEGATION_OFFSET_FROM_BOTTOM`. */
export const RELEGATION_OFFSET_FROM_BOTTOM = 4;

/** Avoids relegation marker colliding with the 2nd-place prize row. */
export const MIN_TEAMS_FOR_RELEGATION_MARKER = 5;

/** Ensures the promotion row is not the last table row (last-row borders are stripped). */
export const MIN_TEAMS_FOR_PROMOTION_MARKER = 4;

export function getStandingsRowMarker(
    divisionId: DivisionId,
    rowIndex: number,
    teamCount: number,
): StandingsRowMarker | undefined {
    if (teamCount < 2) return undefined;

    if (rowIndex === SECOND_PLACE_ROW_INDEX) {
        return 'prize';
    }

    if (
        rowIndex === PROMOTION_ROW_INDEX &&
        divisionId !== 'premierLeague' &&
        teamCount >= MIN_TEAMS_FOR_PROMOTION_MARKER &&
        rowIndex < teamCount - 1
    ) {
        return 'promotion';
    }

    const relegationRowIndex = teamCount - RELEGATION_OFFSET_FROM_BOTTOM;
    if (
        rowIndex === relegationRowIndex &&
        divisionId !== 'leagueOne' &&
        teamCount >= MIN_TEAMS_FOR_RELEGATION_MARKER &&
        rowIndex < teamCount - 1
    ) {
        return 'relegation';
    }

    return undefined;
}

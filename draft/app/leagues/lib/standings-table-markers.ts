export type StandingsRowMarker = 'prize' | 'promotion' | 'relegation';

/**
 * What the division takes part in, from the `Divisions` sheet.
 *
 * This used to take a `DivisionId` and compare it: `!== 'premierLeague'` for promotion,
 * `!== 'leagueOne'` for relegation. That encoded "three divisions, one pyramid" and broke
 * when `greatScott` was added -- a division in neither. Deriving it from `order` would
 * have been worse than the comparison it replaced: greatScott sorts last, so relegation
 * would have moved onto it and off leagueOne.
 */
export interface DivisionMarkerRules {
    promotion: boolean;
    relegation: boolean;
}

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
    rules: DivisionMarkerRules,
    rowIndex: number,
    teamCount: number,
): StandingsRowMarker | undefined {
    if (teamCount < 2) return undefined;

    if (rowIndex === SECOND_PLACE_ROW_INDEX) {
        return 'prize';
    }

    if (
        rowIndex === PROMOTION_ROW_INDEX &&
        rules.promotion &&
        teamCount >= MIN_TEAMS_FOR_PROMOTION_MARKER &&
        rowIndex < teamCount - 1
    ) {
        return 'promotion';
    }

    const relegationRowIndex = teamCount - RELEGATION_OFFSET_FROM_BOTTOM;
    if (
        rowIndex === relegationRowIndex &&
        rules.relegation &&
        teamCount >= MIN_TEAMS_FOR_RELEGATION_MARKER &&
        rowIndex < teamCount - 1
    ) {
        return 'relegation';
    }

    return undefined;
}

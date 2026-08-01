import { describe, expect, it } from 'vitest';
import { getStandingsRowMarker } from './standings-table-markers';

/**
 * The rules each division plays by, as the `Divisions` sheet now states them.
 *
 * These used to be inferred from the id — promotion was `!== 'premierLeague'`, relegation
 * was `!== 'leagueOne'`. That encoded "three divisions, one pyramid", which stopped being
 * true when `greatScott` was added: a fourth division in neither.
 */
const PREMIER_LEAGUE = { promotion: false, relegation: true };
const CHAMPIONSHIP = { promotion: true, relegation: true };
const LEAGUE_ONE = { promotion: true, relegation: false };
const GREAT_SCOTT = { promotion: false, relegation: false };

describe('getStandingsRowMarker', () => {
    it('returns prize below 2nd place for all divisions', () => {
        expect(getStandingsRowMarker(PREMIER_LEAGUE, 1, 10)).toBe('prize');
        expect(getStandingsRowMarker(CHAMPIONSHIP, 1, 10)).toBe('prize');
        expect(getStandingsRowMarker(LEAGUE_ONE, 1, 10)).toBe('prize');
        expect(getStandingsRowMarker(GREAT_SCOTT, 1, 10)).toBe('prize');
    });

    it('prize wins over relegation when indices collide at 5 teams', () => {
        expect(getStandingsRowMarker(PREMIER_LEAGUE, 1, 5)).toBe('prize');
    });

    it('applies division-specific promotion and relegation markers', () => {
        expect(getStandingsRowMarker(PREMIER_LEAGUE, 2, 10)).toBeUndefined();
        expect(getStandingsRowMarker(CHAMPIONSHIP, 2, 10)).toBe('promotion');
        expect(getStandingsRowMarker(LEAGUE_ONE, 2, 10)).toBe('promotion');

        expect(getStandingsRowMarker(PREMIER_LEAGUE, 6, 10)).toBe('relegation');
        expect(getStandingsRowMarker(CHAMPIONSHIP, 6, 10)).toBe('relegation');
        expect(getStandingsRowMarker(LEAGUE_ONE, 6, 10)).toBeUndefined();
    });

    it('promotion wins over relegation when indices collide at 6 teams', () => {
        expect(getStandingsRowMarker(CHAMPIONSHIP, 2, 6)).toBe('promotion');
    });

    it('skips markers on the last row and for very small divisions', () => {
        expect(getStandingsRowMarker(CHAMPIONSHIP, 2, 3)).toBeUndefined();
        expect(getStandingsRowMarker(PREMIER_LEAGUE, 6, 4)).toBeUndefined();
        expect(getStandingsRowMarker(PREMIER_LEAGUE, 1, 1)).toBeUndefined();
    });
});

describe('a division outside the pyramid', () => {
    // greatScott is standalone: it neither promotes nor relegates. Position cannot express
    // that — by `order` it is bottom, which would have handed it leagueOne's relegation.
    it('gets no promotion marker', () => {
        expect(getStandingsRowMarker(GREAT_SCOTT, 2, 10)).toBeUndefined();
    });

    it('gets no relegation marker', () => {
        expect(getStandingsRowMarker(GREAT_SCOTT, 6, 10)).toBeUndefined();
    });

    it('still gets the 2nd-place prize, which every division plays for', () => {
        expect(getStandingsRowMarker(GREAT_SCOTT, 1, 8)).toBe('prize');
    });

    it('does not take relegation away from the division above it', () => {
        // The regression a rank-derived implementation would have caused.
        expect(getStandingsRowMarker(LEAGUE_ONE, 2, 10)).toBe('promotion');
        expect(getStandingsRowMarker(LEAGUE_ONE, 6, 10)).toBeUndefined();
    });
});

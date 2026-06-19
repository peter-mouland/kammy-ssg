import { describe, expect, it } from 'vitest';
import { getStandingsRowMarker } from './standings-table-markers';

describe('getStandingsRowMarker', () => {
    it('returns prize below 2nd place for all divisions', () => {
        expect(getStandingsRowMarker('premierLeague', 1, 10)).toBe('prize');
        expect(getStandingsRowMarker('championship', 1, 10)).toBe('prize');
        expect(getStandingsRowMarker('leagueOne', 1, 10)).toBe('prize');
    });

    it('prize wins over relegation when indices collide at 5 teams', () => {
        expect(getStandingsRowMarker('premierLeague', 1, 5)).toBe('prize');
    });

    it('applies division-specific promotion and relegation markers', () => {
        expect(getStandingsRowMarker('premierLeague', 2, 10)).toBeUndefined();
        expect(getStandingsRowMarker('championship', 2, 10)).toBe('promotion');
        expect(getStandingsRowMarker('leagueOne', 2, 10)).toBe('promotion');

        expect(getStandingsRowMarker('premierLeague', 6, 10)).toBe('relegation');
        expect(getStandingsRowMarker('championship', 6, 10)).toBe('relegation');
        expect(getStandingsRowMarker('leagueOne', 6, 10)).toBeUndefined();
    });

    it('promotion wins over relegation when indices collide at 6 teams', () => {
        expect(getStandingsRowMarker('championship', 2, 6)).toBe('promotion');
    });

    it('skips markers on the last row and for very small divisions', () => {
        expect(getStandingsRowMarker('championship', 2, 3)).toBeUndefined();
        expect(getStandingsRowMarker('premierLeague', 6, 4)).toBeUndefined();
        expect(getStandingsRowMarker('premierLeague', 1, 1)).toBeUndefined();
    });
});

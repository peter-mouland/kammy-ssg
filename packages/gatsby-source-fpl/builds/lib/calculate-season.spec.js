/* eslint-env jest */
const calculateSeasonStats = require('./calculate-season');

describe('calculateSeason.calculateSeasonStats', () => {
    it('for a single gameweek for gk', () => {
        const stats = {
            apps: 1,
            gls: 1,
            sb: 1,
            asts: 1,
            cs: 1,
            con: 1,
            pensv: 1,
            ycard: 1,
            rcard: 1,
        };
        const gameWeeks = [{ gameWeekStats: stats }];
        expect(calculateSeasonStats(gameWeeks, 'GK')).toEqual(stats);
    });

    it('for 2 gameweeks [GK]', () => {
        const stats = {
            apps: 1,
            gls: 1,
            sb: 1,
            asts: 1,
            cs: 1,
            con: 1,
            pensv: 1,
            ycard: 1,
            rcard: 1,
        };
        const gameWeeks = [{ gameWeekStats: stats }, { gameWeekStats: stats }];
        expect(calculateSeasonStats(gameWeeks, 'GK')).toEqual({
            apps: 2,
            gls: 2,
            sb: 2,
            asts: 2,
            cs: 2,
            con: 2,
            pensv: 2,
            ycard: 2,
            rcard: 2,
        });
    });

    it('for multiple gameweeks', () => {
        const stats = {
            apps: 1,
            gls: 1,
            sb: 1,
            asts: 1,
            cs: 1,
            con: 1,
            pensv: 1,
            ycard: 1,
            rcard: 1,
        };
        const stats2 = {
            apps: 2,
            gls: 2,
            sb: 2,
            asts: 2,
            cs: 2,
            con: 2,
            pensv: 2,
            ycard: 2,
            rcard: 2,
        };
        const stats3 = {
            apps: 3,
            gls: 3,
            sb: 3,
            asts: 3,
            cs: 3,
            con: 3,
            pensv: 3,
            ycard: 3,
            rcard: 3,
        };
        const gameWeeks = [{ gameWeekStats: stats }, { gameWeekStats: stats2 }, { gameWeekStats: stats3 }];
        expect(calculateSeasonStats(gameWeeks, 'GK')).toEqual({
            apps: 6,
            gls: 6,
            sb: 6,
            asts: 6,
            cs: 6,
            con: 6,
            pensv: 6,
            ycard: 6,
            rcard: 6,
        });
    });
});

/* eslint-disable object-curly-newline */
/* eslint-env jest */
const calculateRankChange = require('./calculate-rank-change');

describe('calculateRankChange()', () => {
    it('reduces zero for no change (real data)', () => {
        const rank = {
            Chris: { gks: 6, cb: 7, fb: 7, mid: 1, am: 2, str: 3, total: 26 },
            Ed: { gks: 0, cb: 0, fb: 6, mid: 0, am: 7, str: 0, total: 13 },
            Howie: { gks: 2, cb: 5, fb: 4, mid: 4.5, am: 6, str: 7, total: 28.5 },
            Jezz: { gks: 5, cb: 6, fb: 3, mid: 6, am: 3, str: 4, total: 27 },
            'Jim Bob': { gks: 3, cb: 1, fb: 1, mid: 3, am: 0, str: 5, total: 13 },
            Matt: { gks: 1, cb: 3, fb: 5, mid: 7, am: 1, str: 1, total: 18 },
            Paul: { gks: 7, cb: 2, fb: 0, mid: 2, am: 4, str: 2, total: 17 },
            'Tom F': { gks: 4, cb: 4, fb: 2, mid: 4.5, am: 5, str: 6, total: 25.5 },
        };
        const change = calculateRankChange(rank, rank);
        expect(change).toEqual({
            Chris: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Ed: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Howie: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Jezz: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            'Jim Bob': { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Matt: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Paul: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            'Tom F': { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
        });
    });

    it('should return current scores on gameWeek one', () => {
        const gameWeek1 = {
            Olly: { gks: 0.5, cb: 0, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 2.5 },
            Nike: { gks: 0.5, cb: 1.5, fb: 2, mid: 0.5, am: 0.5, str: 0.5, total: 5.5 },
            Pete: { gks: 0.5, cb: 1.5, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 4 },
        };
        const change = calculateRankChange(undefined, gameWeek1);
        expect(change).toEqual(gameWeek1);
    });

    it('should return when gameWeek one ranks match gameWeek twos ranks', () => {
        const gameWeek1 = {
            Olly: { gks: 0.5, cb: 0, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 2.5 },
            Nike: { gks: 0.5, cb: 1.5, fb: 2, mid: 0.5, am: 0.5, str: 0.5, total: 5.5 },
            Pete: { gks: 0.5, cb: 1.5, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 4 },
        };
        const gameWeek2 = {
            Olly: { gks: 0.5, cb: 0, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 2.5 },
            Nike: { gks: 0.5, cb: 1.5, fb: 2, mid: 0.5, am: 0.5, str: 0.5, total: 5.5 },
            Pete: { gks: 0.5, cb: 1.5, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 4 },
        };
        const change = calculateRankChange(gameWeek1, gameWeek2);
        expect(change).toEqual({
            Olly: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Nike: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
            Pete: { gks: 0, cb: 0, fb: 0, mid: 0, am: 0, str: 0, total: 0 },
        });
    });

    it('should return +1 if gameWeek twos rank is 1 higher than gameWeek one', () => {
        const gameWeek1 = {
            Olly: { gks: 0.5, cb: 0, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 2.5 },
            Nike: { gks: 0.5, cb: 1.5, fb: 2, mid: 0.5, am: 0.5, str: 0.5, total: 5.5 },
            Pete: { gks: 0.5, cb: 1.5, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 4 },
        };
        const gameWeek2 = {
            Olly: { gks: 1.5, cb: 1, fb: 1.5, mid: 1.5, am: 1.5, str: 1.5, total: 3.5 },
            Nike: { gks: 1.5, cb: 2.5, fb: 3, mid: 1.5, am: 2.5, str: 1.5, total: 6.5 },
            Pete: { gks: 1.5, cb: 2.5, fb: 1.5, mid: 1.5, am: 1.5, str: 1.5, total: 5 },
        };
        const change = calculateRankChange(gameWeek1, gameWeek2);
        expect(change).toEqual({
            Olly: { gks: 1, cb: 1, fb: 1, mid: 1, am: 1, str: 1, total: 6 },
            Nike: { gks: 1, cb: 1, fb: 1, mid: 1, am: 2, str: 1, total: 7 },
            Pete: { gks: 1, cb: 1, fb: 1, mid: 1, am: 1, str: 1, total: 6 },
        });
    });

    it('should return -1 if gameWeek twos rank is 1 lower than gameWeek one', () => {
        const gameWeek2 = {
            Olly: { gks: 0.5, cb: 0, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 2.5 },
            Nike: { gks: 0.5, cb: 1.5, fb: 2, mid: 0.5, am: 0.5, str: 0.5, total: 5.5 },
            Pete: { gks: 0.5, cb: 1.5, fb: 0.5, mid: 0.5, am: 0.5, str: 0.5, total: 4 },
        };
        const gameWeek1 = {
            Olly: { gks: 1.5, cb: 1, fb: 1.5, mid: 1.5, am: 1.5, str: 1.5, total: 3.5 },
            Nike: { gks: 1.5, cb: 2.5, fb: 3, mid: 1.5, am: 2.5, str: 1.5, total: 6.5 },
            Pete: { gks: 1.5, cb: 2.5, fb: 1.5, mid: 1.5, am: 1.5, str: 1.5, total: 5 },
        };
        const change = calculateRankChange(gameWeek1, gameWeek2);
        expect(change).toEqual({
            Olly: { gks: -1, cb: -1, fb: -1, mid: -1, am: -1, str: -1, total: -6 },
            Nike: { gks: -1, cb: -1, fb: -1, mid: -1, am: -2, str: -1, total: -7 },
            Pete: { gks: -1, cb: -1, fb: -1, mid: -1, am: -1, str: -1, total: -6 },
        });
    });
});

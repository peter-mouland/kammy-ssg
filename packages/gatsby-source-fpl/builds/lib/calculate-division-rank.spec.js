/* eslint-env jest */
// import positions from './positions';
const getDivisionRank = require('./calculate-division-rank');

describe('getDivisionRank()', () => {
    it('should return a equal ranking by position when all points are the same', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 0.5, Nick: 0.5 },
            AM: { Olly: 0.5, Nick: 0.5 }, // one array item for each managerName
            cb: { Olly: 0.5, Nick: 0.5 },
            fb: { Olly: 0.5, Nick: 0.5 },
            mid: { Olly: 0.5, Nick: 0.5 },
            str: { Olly: 0.5, Nick: 0.5 },
            total: { Olly: 3, Nick: 3 },
        });
    });

    it('should return a Oly with higher ranking (1) when Ollys points are higher', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 11, gameWeekPoints: 10 },
                    cb: { seasonPoints: 11, gameWeekPoints: 10 },
                    fb: { seasonPoints: 11, gameWeekPoints: 10 },
                    mid: { seasonPoints: 11, gameWeekPoints: 10 },
                    AM: { seasonPoints: 11, gameWeekPoints: 10 },
                    str: { seasonPoints: 11, gameWeekPoints: 10 },
                    total: { seasonPoints: 66, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 1, Nick: 0 },
            AM: { Olly: 1, Nick: 0 },
            cb: { Olly: 1, Nick: 0 },
            fb: { Olly: 1, Nick: 0 },
            mid: { Olly: 1, Nick: 0 },
            str: { Olly: 1, Nick: 0 },
            total: { Olly: 6, Nick: 0 },
        });
    });

    it('should return a Nick with higher ranking (1) when Nicks points are higher. test to ensure JS hasnt reordered anything', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 11, gameWeekPoints: 10 },
                    cb: { seasonPoints: 11, gameWeekPoints: 10 },
                    fb: { seasonPoints: 11, gameWeekPoints: 10 },
                    mid: { seasonPoints: 11, gameWeekPoints: 10 },
                    AM: { seasonPoints: 11, gameWeekPoints: 10 },
                    str: { seasonPoints: 11, gameWeekPoints: 10 },
                    total: { seasonPoints: 66, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 111, gameWeekPoints: 10 },
                    cb: { seasonPoints: 111, gameWeekPoints: 10 },
                    fb: { seasonPoints: 111, gameWeekPoints: 10 },
                    mid: { seasonPoints: 111, gameWeekPoints: 10 },
                    AM: { seasonPoints: 111, gameWeekPoints: 10 },
                    str: { seasonPoints: 111, gameWeekPoints: 10 },
                    total: { seasonPoints: 666, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 0, Nick: 1 },
            AM: { Olly: 0, Nick: 1 },
            cb: { Olly: 0, Nick: 1 },
            fb: { Olly: 0, Nick: 1 },
            mid: { Olly: 0, Nick: 1 },
            str: { Olly: 0, Nick: 1 },
            total: { Olly: 0, Nick: 6 },
        });
    });

    it('should correctly rank 3 players seasonPoints, with matching points for positions', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 1, Nick: 1, Pete: 1 },
            AM: { Olly: 1, Nick: 1, Pete: 1 },
            cb: { Olly: 1, Nick: 1, Pete: 1 },
            fb: { Olly: 1, Nick: 1, Pete: 1 },
            mid: { Olly: 1, Nick: 1, Pete: 1 },
            str: { Olly: 1, Nick: 1, Pete: 1 },
            total: { Olly: 6, Nick: 6, Pete: 6 },
        });
    });

    it('should correctly rank 3 players seasonPoints, with matching points for positions and one loser', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Pete2',
                points: {
                    gks: { seasonPoints: 0, gameWeekPoints: 1 },
                    cb: { seasonPoints: 1, gameWeekPoints: 1 },
                    fb: { seasonPoints: 1, gameWeekPoints: 1 },
                    mid: { seasonPoints: 1, gameWeekPoints: 1 },
                    AM: { seasonPoints: 1, gameWeekPoints: 1 },
                    str: { seasonPoints: 1, gameWeekPoints: 1 },
                    total: { seasonPoints: 5, gameWeekPoints: 6 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            AM: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            cb: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            fb: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            mid: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            str: {
                Olly: 2,
                Nick: 2,
                Pete: 2,
                Pete2: 0,
            },
            total: {
                Olly: 12,
                Nick: 12,
                Pete: 12,
                Pete2: 0,
            },
        });
    });

    it('should correctly rank 3 players seasonPoints, with differing points for positions', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    AM: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 6, gameWeekPoints: 10 },
                    cb: { seasonPoints: 5, gameWeekPoints: 10 },
                    fb: { seasonPoints: 4, gameWeekPoints: 10 },
                    mid: { seasonPoints: 3, gameWeekPoints: 10 },
                    AM: { seasonPoints: 2, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Pete',
                points: {
                    gks: { seasonPoints: 7, gameWeekPoints: 10 },
                    cb: { seasonPoints: 0, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 3, gameWeekPoints: 10 },
                    AM: { seasonPoints: 0, gameWeekPoints: 10 },
                    str: { seasonPoints: 7, gameWeekPoints: 10 },
                    total: { seasonPoints: 20, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 0, Nick: 1, Pete: 2 },
            AM: { Olly: 2, Nick: 1, Pete: 0 },
            cb: { Olly: 1, Nick: 2, Pete: 0 },
            fb: { Olly: 0.5, Nick: 2, Pete: 0.5 },
            mid: { Olly: 2, Nick: 0.5, Pete: 0.5 },
            str: { Olly: 1, Nick: 0, Pete: 2 },
            total: { Olly: 6.5, Nick: 6.5, Pete: 5 },
        });
    });

    it('should shows ties for the lead', () => {
        const divisionPoints = [
            {
                managerName: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 9, gameWeekPoints: 60 },
                },
            },
            {
                managerName: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    AM: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 7, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            gks: { Olly: 1, Nick: 1, Pete: 1 },
            AM: { Olly: 1, Nick: 1, Pete: 1 },
            cb: { Olly: 0, Nick: 1.5, Pete: 1.5 },
            fb: { Olly: 0.5, Nick: 2, Pete: 0.5 },
            mid: { Olly: 1, Nick: 1, Pete: 1 },
            str: { Olly: 1, Nick: 1, Pete: 1 },
            total: { Olly: 4.5, Nick: 7.5, Pete: 6 },
        });
    });
});

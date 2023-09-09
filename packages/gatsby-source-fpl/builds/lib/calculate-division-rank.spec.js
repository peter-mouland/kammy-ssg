/* eslint-env jest */
// import positions from './positions';
const getDivisionRank = require('./calculate-division-rank');

describe('getDivisionRank()', () => {
    it('should return a equal ranking by position when all points are the same', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                am: 0.5,
                cb: 0.5,
                fb: 0.5,
                gks: 0.5,
                managerId: 'Nick',
                mid: 0.5,
                order: 1,
                seasonPoints: 6,
                str: 0.5,
                total: 3,
            },
            Olly: {
                am: 0.5,
                cb: 0.5,
                fb: 0.5,
                gks: 0.5,
                managerId: 'Olly',
                mid: 0.5,
                order: 0,
                seasonPoints: 6,
                str: 0.5,
                total: 3,
            },
        });
    });

    it('should return a Oly with higher ranking (1) when Ollys points are higher', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 11, gameWeekPoints: 10 },
                    cb: { seasonPoints: 11, gameWeekPoints: 10 },
                    fb: { seasonPoints: 11, gameWeekPoints: 10 },
                    mid: { seasonPoints: 11, gameWeekPoints: 10 },
                    am: { seasonPoints: 11, gameWeekPoints: 10 },
                    str: { seasonPoints: 11, gameWeekPoints: 10 },
                    total: { seasonPoints: 66, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                am: 0,
                cb: 0,
                fb: 0,
                gks: 0,
                managerId: 'Nick',
                mid: 0,
                order: 0,
                seasonPoints: 6,
                str: 0,
                total: 0,
            },
            Olly: {
                am: 1,
                cb: 1,
                fb: 1,
                gks: 1,
                managerId: 'Olly',
                mid: 1,
                order: 1,
                seasonPoints: 66,
                str: 1,
                total: 6,
            },
        });
    });

    it('should return a Nick with higher ranking (1) when Nicks points are higher. test to ensure JS hasnt reordered anything', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 11, gameWeekPoints: 10 },
                    cb: { seasonPoints: 11, gameWeekPoints: 10 },
                    fb: { seasonPoints: 11, gameWeekPoints: 10 },
                    mid: { seasonPoints: 11, gameWeekPoints: 10 },
                    am: { seasonPoints: 11, gameWeekPoints: 10 },
                    str: { seasonPoints: 11, gameWeekPoints: 10 },
                    total: { seasonPoints: 66, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 111, gameWeekPoints: 10 },
                    cb: { seasonPoints: 111, gameWeekPoints: 10 },
                    fb: { seasonPoints: 111, gameWeekPoints: 10 },
                    mid: { seasonPoints: 111, gameWeekPoints: 10 },
                    am: { seasonPoints: 111, gameWeekPoints: 10 },
                    str: { seasonPoints: 111, gameWeekPoints: 10 },
                    total: { seasonPoints: 666, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                managerId: 'Nick',
                am: 1,
                cb: 1,
                fb: 1,
                gks: 1,
                mid: 1,
                str: 1,
                total: 6,
                order: 1,
                seasonPoints: 666,
            },
            Olly: {
                managerId: 'Olly',
                am: 0,
                cb: 0,
                fb: 0,
                gks: 0,
                mid: 0,
                str: 0,
                total: 0,
                order: 0,
                seasonPoints: 66,
            },
        });
    });

    it('should correctly rank 3 players seasonPoints, with matching points for positions', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                managerId: 'Nick',
                am: 1,
                cb: 1,
                fb: 1,
                gks: 1,
                mid: 1,
                str: 1,
                total: 6,
                order: 1,
                seasonPoints: 21,
            },
            Olly: {
                managerId: 'Olly',
                am: 1,
                cb: 1,
                fb: 1,
                gks: 1,
                mid: 1,
                str: 1,
                total: 6,
                order: 0,
                seasonPoints: 21,
            },
            Pete: {
                managerId: 'Pete',
                am: 1,
                cb: 1,
                fb: 1,
                gks: 1,
                mid: 1,
                str: 1,
                total: 6,
                order: 2,
                seasonPoints: 21,
            },
        });
    });

    it('should correctly rank 3 players seasonPoints, with matching points for positions and one loser', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Pete2',
                points: {
                    gks: { seasonPoints: 0, gameWeekPoints: 1 },
                    cb: { seasonPoints: 1, gameWeekPoints: 1 },
                    fb: { seasonPoints: 1, gameWeekPoints: 1 },
                    mid: { seasonPoints: 1, gameWeekPoints: 1 },
                    am: { seasonPoints: 1, gameWeekPoints: 1 },
                    str: { seasonPoints: 1, gameWeekPoints: 1 },
                    total: { seasonPoints: 5, gameWeekPoints: 6 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                managerId: 'Nick',
                am: 2,
                cb: 2,
                fb: 2,
                gks: 2,
                mid: 2,
                str: 2,
                total: 12,
                order: 2,
                seasonPoints: 21,
            },
            Olly: {
                managerId: 'Olly',
                am: 2,
                cb: 2,
                fb: 2,
                gks: 2,
                mid: 2,
                str: 2,
                total: 12,
                order: 1,
                seasonPoints: 21,
            },
            Pete: {
                managerId: 'Pete',
                am: 2,
                cb: 2,
                fb: 2,
                gks: 2,
                mid: 2,
                str: 2,
                total: 12,
                order: 3,
                seasonPoints: 21,
            },
            Pete2: {
                managerId: 'Pete2',
                am: 0,
                cb: 0,
                fb: 0,
                gks: 0,
                mid: 0,
                str: 0,
                total: 0,
                order: 0,
                seasonPoints: 5,
            },
        });
    });

    it('should correctly rank 3 players seasonPoints, with differing points for positions', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 4, gameWeekPoints: 10 },
                    am: { seasonPoints: 5, gameWeekPoints: 10 },
                    str: { seasonPoints: 6, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 6, gameWeekPoints: 10 },
                    cb: { seasonPoints: 5, gameWeekPoints: 10 },
                    fb: { seasonPoints: 4, gameWeekPoints: 10 },
                    mid: { seasonPoints: 3, gameWeekPoints: 10 },
                    am: { seasonPoints: 2, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 21, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Pete',
                points: {
                    gks: { seasonPoints: 7, gameWeekPoints: 10 },
                    cb: { seasonPoints: 0, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 3, gameWeekPoints: 10 },
                    am: { seasonPoints: 0, gameWeekPoints: 10 },
                    str: { seasonPoints: 7, gameWeekPoints: 10 },
                    total: { seasonPoints: 20, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                managerId: 'Nick',
                am: 1,
                cb: 2,
                fb: 2,
                gks: 1,
                mid: 0.5,
                str: 0,
                total: 6.5,
                order: 2,
                seasonPoints: 21,
            },
            Olly: {
                managerId: 'Olly',
                am: 2,
                cb: 1,
                fb: 0.5,
                gks: 0,
                mid: 2,
                str: 1,
                total: 6.5,
                order: 1,
                seasonPoints: 21,
            },
            Pete: {
                managerId: 'Pete',
                am: 0,
                cb: 0,
                fb: 0.5,
                gks: 2,
                mid: 0.5,
                str: 2,
                total: 5,
                order: 0,
                seasonPoints: 20,
            },
        });
    });

    it('should shows ties for the lead', () => {
        const divisionPoints = [
            {
                managerId: 'Olly',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 1, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 6, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Nick',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 3, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 9, gameWeekPoints: 60 },
                },
            },
            {
                managerId: 'Pete',
                points: {
                    gks: { seasonPoints: 1, gameWeekPoints: 10 },
                    am: { seasonPoints: 1, gameWeekPoints: 10 },
                    cb: { seasonPoints: 2, gameWeekPoints: 10 },
                    fb: { seasonPoints: 1, gameWeekPoints: 10 },
                    mid: { seasonPoints: 1, gameWeekPoints: 10 },
                    str: { seasonPoints: 1, gameWeekPoints: 10 },
                    total: { seasonPoints: 7, gameWeekPoints: 60 },
                },
            },
        ];

        expect(getDivisionRank(divisionPoints)).toEqual({
            Nick: {
                managerId: 'Nick',
                am: 1,
                cb: 1.5,
                fb: 2,
                gks: 1,
                mid: 1,
                str: 1,
                total: 7.5,
                order: 2,
                seasonPoints: 9,
            },
            Olly: {
                managerId: 'Olly',
                am: 1,
                cb: 0,
                fb: 0.5,
                gks: 1,
                mid: 1,
                str: 1,
                total: 4.5,
                order: 0,
                seasonPoints: 6,
            },
            Pete: {
                managerId: 'Pete',
                am: 1,
                cb: 1.5,
                fb: 0.5,
                gks: 1,
                mid: 1,
                str: 1,
                total: 6,
                order: 1,
                seasonPoints: 7,
            },
        });
    });
});

/* eslint-env jest */
const {
    forTackleBonus,
    forStarting,
    forSub,
    forAssists,
    forYellowCards,
    forRedCards,
    forGoals,
    forSaveBonus,
    forCleanSheet,
    forConceded,
    calculateTotalPoints,
    forPenaltiesSaved,
} = require('./calculatePoints');

let position;

describe('calculatePoints', () => {
    describe('for any player', () => {
        it('returns 3 points for each start', () => {
            expect(forStarting(1)).toEqual(3);
            expect(forStarting(0)).toEqual(0);
            expect(forStarting(10)).toEqual(30);
        });

        it('returns 1 points for each sub', () => {
            expect(forSub(1)).toEqual(1);
            expect(forSub(0)).toEqual(0);
            expect(forSub(10)).toEqual(10);
        });

        it('returns 3 points for each assist', () => {
            expect(forAssists(1)).toEqual(3);
            expect(forAssists(0)).toEqual(0);
            expect(forAssists(10)).toEqual(30);
        });

        it('returns -2 points for each yellow card', () => {
            expect(forYellowCards(1)).toEqual(-2);
            expect(forYellowCards(0)).toEqual(0);
            expect(forYellowCards(10)).toEqual(-20);
        });

        it('returns -5 points for each red card', () => {
            expect(forRedCards(1)).toEqual(-5);
            expect(forRedCards(0)).toEqual(0);
            expect(forRedCards(10)).toEqual(-50);
        });
    });

    describe('when a GK has points calculated', () => {
        beforeEach(() => {
            position = 'GK';
        });

        it('returns 10 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(10);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(100);
        });

        it('returns 4 points for save bonus', () => {
            expect(forSaveBonus(1, position)).toEqual(4);
            expect(forSaveBonus(0, position)).toEqual(0);
            expect(forSaveBonus(10, position)).toEqual(40);
        });

        it('returns 5 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(5);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(50);
        });

        it('returns -1 points for each conceeded', () => {
            expect(forConceded(1, position)).toEqual(-1);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(-10);
        });

        it('returns +5 points for each pen saved', () => {
            expect(forPenaltiesSaved(1, position)).toEqual(5);
            expect(forPenaltiesSaved(0, position)).toEqual(0);
            expect(forPenaltiesSaved(10, position)).toEqual(50);
        });

        it('return a correct totals', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(23);
        });
    });

    describe('when a FB has points calculated', () => {
        beforeEach(() => {
            position = 'FB';
        });

        it('returns 8 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(8);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(80);
        });

        it('returns 5 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(5);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(50);
        });

        it('returns -1 points for each clean sheet', () => {
            expect(forConceded(1, position)).toEqual(-1);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(-10);
        });

        it('return a correct points', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(20);
        });
    });

    describe('when a CB has points calculated', () => {
        beforeEach(() => {
            position = 'CB';
        });

        it('returns 8 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(8);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(80);
        });

        it('returns 5 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(5);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(50);
        });

        it('returns -1 points for each clean sheet', () => {
            expect(forConceded(1, position)).toEqual(-1);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(-10);
        });

        it('return a correct points', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(20);
        });
    });

    describe('when a MID has points calculated', () => {
        beforeEach(() => {
            position = 'MID';
        });
        it('returns 6 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(6);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(60);
        });

        it('returns 4 points for Tackle Bonus', () => {
            expect(forTackleBonus(1, position)).toEqual(4);
            expect(forTackleBonus(0, position)).toEqual(0);
            expect(forTackleBonus(10, position)).toEqual(40);
        });

        it('returns 0 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(0);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(0);
        });

        it('returns 0 points for each conceded', () => {
            expect(forConceded(1, position)).toEqual(0);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(0);
        });

        it('return a correct points', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(15);
        });
    });

    describe('when a AM has points calculated', () => {
        beforeEach(() => {
            position = 'AM';
        });

        it('returns 5 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(5);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(50);
        });

        it('returns 0 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(0);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(0);
        });

        it('returns 0 points for each clean sheet', () => {
            expect(forConceded(1, position)).toEqual(0);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(0);
        });

        it('return a correct points', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(10);
        });
    });

    describe('when a STR has points calculated', () => {
        beforeEach(() => {
            position = 'STR';
        });

        it('returns 4 points for each goal', () => {
            expect(forGoals(1, position)).toEqual(4);
            expect(forGoals(0, position)).toEqual(0);
            expect(forGoals(10, position)).toEqual(40);
        });

        it('returns 0 points for each clean sheet', () => {
            expect(forCleanSheet(1, position)).toEqual(0);
            expect(forCleanSheet(0, position)).toEqual(0);
            expect(forCleanSheet(10, position)).toEqual(0);
        });

        it('returns 0 points for each clean sheet', () => {
            expect(forConceded(1, position)).toEqual(0);
            expect(forConceded(0, position)).toEqual(0);
            expect(forConceded(10, position)).toEqual(0);
        });

        it('return a correct points', () => {
            const stats = {
                apps: 1,
                subs: 1,
                mom: 1,
                gls: 1,
                tb: 1,
                sb: 1,
                asts: 1,
                cs: 1,
                con: 1,
                pensv: 1,
                ycard: 1,
                rcard: 1,
            };
            const points = calculateTotalPoints({ stats, pos: position });
            expect(points.total).toEqual(9);
        });
    });
});

/* eslint-env jest */
const extractStats = require('./index');

let ffStats;

describe('extract-ff-stats', () => {
    describe('when stats exist', () => {
        beforeEach(() => {
            ffStats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
        });

        it('extracts apps', () => {
            expect(extractStats(ffStats).apps).toEqual(1);
        });
        it('extracts subs', () => {
            expect(extractStats(ffStats).subs).toEqual(3);
        });
        it('extracts subs', () => {
            expect(extractStats(ffStats).gls).toEqual(4);
        });
        it('extracts asts', () => {
            expect(extractStats(ffStats).asts).toEqual(5);
        });
        it('extracts cs', () => {
            expect(extractStats(ffStats).cs).toEqual(8);
        });
        it('extracts con', () => {
            expect(extractStats(ffStats).con).toEqual(9);
        });
        it('extracts pensv', () => {
            expect(extractStats(ffStats).pensv).toEqual(11);
        });
        it('extracts ycard', () => {
            expect(extractStats(ffStats).ycard).toEqual(6);
        });
        it('extracts rcard', () => {
            expect(extractStats(ffStats).rcard).toEqual(7);
        });
        it('extracts tb', () => {
            expect(extractStats(ffStats).tb).toEqual(34);
        });
        it('extracts sb', () => {
            expect(extractStats(ffStats).sb).toEqual(36);
        });
    });
    describe('when stats DONT exist', () => {
        beforeEach(() => {
            ffStats = [];
        });

        it('extracts apps default as zero', () => {
            expect(extractStats(ffStats).apps).toEqual(0);
        });
        it('extracts subs default as zero', () => {
            expect(extractStats(ffStats).subs).toEqual(0);
        });
        it('extracts subs default as zero', () => {
            expect(extractStats(ffStats).gls).toEqual(0);
        });
        it('extracts asts default as zero', () => {
            expect(extractStats(ffStats).asts).toEqual(0);
        });
        it('extracts cs default as zero', () => {
            expect(extractStats(ffStats).cs).toEqual(0);
        });
        it('extracts con default as zero', () => {
            expect(extractStats(ffStats).con).toEqual(0);
        });
        it('extracts pensv default as zero', () => {
            expect(extractStats(ffStats).pensv).toEqual(0);
        });
        it('extracts ycard default as zero', () => {
            expect(extractStats(ffStats).ycard).toEqual(0);
        });
        it('extracts rcard default as zero', () => {
            expect(extractStats(ffStats).rcard).toEqual(0);
        });
        it('extracts tb default as zero', () => {
            expect(extractStats(ffStats).tb).toEqual(0);
        });
        it('extracts sb default as zero', () => {
            expect(extractStats(ffStats).sb).toEqual(0);
        });
    });
});

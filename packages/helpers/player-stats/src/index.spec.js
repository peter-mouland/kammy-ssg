/* eslint-env jest */
/* eslint-disable max-len */
const Chance = require('chance');

const { getGameWeekFixtures, totalUpStats, playerStats } = require('./index');
const extractFFStats = require('./extract-ff-stats');

const chance = new Chance();
const getStats = (count) => new Array(count).fill(chance.integer());

let data;
let randomKey0;
let randomKey1;
let randomKey2;

describe('getGameWeekFixtures', () => {
    describe('returns all fixtures after the start date and before the end date', () => {
        beforeEach(() => {
            randomKey0 = chance.word();
            randomKey1 = chance.word();
            randomKey2 = chance.word();
            data = {
                fixtures: [
                    {
                        date: '2017-08-12 17:30:00',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [randomKey0]: chance.word(),
                    },
                    {
                        date: '2017-08-21 20:00:00',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [randomKey1]: chance.word(),
                    },
                    {
                        date: '2017-08-26 12:30:00',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [randomKey2]: chance.word(),
                    },
                ],
            };
        });

        describe('with a single gameWeek', () => {
            it('returns zero results when dates do not match', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2016-08-11 18:00:00',
                        end: '2016-08-18 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(0);
            });

            it('returns a single fixture when a single data result matches', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-18 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(1);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
            });

            it('returns a single fixture when a multiple data results match, but one is PENDING', () => {
                data.fixtures.push({
                    date: '2017-08-17 12:30:00',
                    status: 'PENDING',
                    stats: getStats(26),
                    [chance.word()]: chance.word(),
                });
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-18 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(1);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
            });

            it('returns multiple fixtures when multiple data results match', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-22 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(2);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
                expect(result[1].date).toEqual(data.fixtures[1].date);
                expect(result[1].stats).toEqual(data.fixtures[1].stats);
                expect(result[1].status).toEqual(data.fixtures[1].status);
                expect(result[1][randomKey1]).toEqual(data.fixtures[1][randomKey1]);
            });

            it('returns multiple fixtures when multiple data results match, but not a PENDING game', () => {
                data.fixtures.push({
                    date: '2017-08-17 12:30:00',
                    status: 'PENDING',
                    stats: getStats(26),
                    [chance.word()]: chance.word(),
                });
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-22 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(2);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
                expect(result[1].date).toEqual(data.fixtures[1].date);
                expect(result[1].stats).toEqual(data.fixtures[1].stats);
                expect(result[1].status).toEqual(data.fixtures[1].status);
                expect(result[1][randomKey1]).toEqual(data.fixtures[1][randomKey1]);
            });
        });

        describe('with multiple gameWeeks', () => {
            it('returns zero results when dates do not match', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2016-08-11 18:00:00',
                        end: '2016-08-18 18:00:00',
                    },
                    {
                        gameWeek: 2,
                        start: '2016-08-19 18:00:00',
                        end: '2016-08-28 18:00:00',
                    },
                ];
                expect(getGameWeekFixtures(data, gameWeeks)).toEqual([]);
            });

            it('returns a single fixture when a single data result matches', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-07-10 18:00:00',
                        end: '2017-08-10 18:00:00',
                    },
                    {
                        gameWeek: 2,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-18 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(1);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
            });

            it('returns multiple fixtures when multiple data results match', () => {
                const gameWeeks = [
                    {
                        gameWeek: 1,
                        start: '2017-08-11 18:00:00',
                        end: '2017-08-13 18:00:00',
                    },
                    {
                        gameWeek: 1,
                        start: '2017-08-13 18:00:00',
                        end: '2017-08-22 18:00:00',
                    },
                ];
                const result = getGameWeekFixtures(data, gameWeeks);
                expect(result).toHaveLength(2);
                expect(result[0].date).toEqual(data.fixtures[0].date);
                expect(result[0].stats).toEqual(data.fixtures[0].stats);
                expect(result[0].status).toEqual(data.fixtures[0].status);
                expect(result[0][randomKey0]).toEqual(data.fixtures[0][randomKey0]);
                expect(result[1].date).toEqual(data.fixtures[1].date);
                expect(result[1].stats).toEqual(data.fixtures[1].stats);
                expect(result[1].status).toEqual(data.fixtures[1].status);
                expect(result[1][randomKey1]).toEqual(data.fixtures[1][randomKey1]);
            });
        });
    });

    describe('data edge cases', () => {
        it('return a game which starts at the same time the gameweek starts', () => {
            const randomKey = chance.word();
            data = {
                fixtures: [
                    {
                        date: '2017-08-12 17:30:00',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [randomKey]: chance.word(),
                    },
                ],
            };
            const gameWeeks = [
                {
                    gameWeek: 1,
                    start: '2017-08-12 17:30:00',
                    end: '2017-08-13 18:00:00',
                },
            ];
            const result = getGameWeekFixtures(data, gameWeeks);
            expect(result).toHaveLength(1);
            expect(result[0].date).toEqual(data.fixtures[0].date);
            expect(result[0].stats).toEqual(data.fixtures[0].stats);
            expect(result[0].status).toEqual(data.fixtures[0].status);
            expect(result[0][randomKey]).toEqual(data.fixtures[0][randomKey]);
        });

        it('wont return a game which starts a second before the same time the gameweek starts', () => {
            data = {
                fixtures: [
                    {
                        date: '2017-08-12 17:29:59',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [chance.word()]: chance.word(),
                    },
                ],
            };
            const gameWeeks = [
                {
                    gameWeek: 1,
                    start: '2017-08-12 17:30:00',
                    end: '2017-08-13 18:00:00',
                },
            ];
            expect(getGameWeekFixtures(data, gameWeeks)).toEqual([]);
        });

        it('return a game which starts at the same time the gameweek ends', () => {
            const randomKey = chance.word();
            data = {
                fixtures: [
                    {
                        date: '2017-08-13 18:00:00',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [randomKey]: chance.word(),
                    },
                ],
            };
            const gameWeeks = [
                {
                    gameWeek: 1,
                    start: '2017-08-12 17:30:00',
                    end: '2017-08-13 18:00:00',
                },
            ];
            const result = getGameWeekFixtures(data, gameWeeks);
            expect(result).toHaveLength(1);
            expect(result[0].date).toEqual(data.fixtures[0].date);
            expect(result[0].stats).toEqual(data.fixtures[0].stats);
            expect(result[0].status).toEqual(data.fixtures[0].status);
            expect(result[0][randomKey]).toEqual(data.fixtures[0][randomKey]);
        });

        it('wont return a game which starts a second after the same time the gameweek ends', () => {
            data = {
                fixtures: [
                    {
                        date: '2017-08-13 18:00:01',
                        status: 'PLAYED',
                        stats: getStats(26),
                        [chance.word()]: chance.word(),
                    },
                ],
            };
            const gameWeeks = [
                {
                    gameWeek: 1,
                    start: '2017-08-12 17:30:00',
                    end: '2017-08-13 18:00:00',
                },
            ];
            expect(getGameWeekFixtures(data, gameWeeks)).toEqual([]);
        });
    });
});

describe('totalUpStats', () => {
    it('should return the default stat object givven no stat object', () => {
        const fixtures = [];
        const result = totalUpStats(fixtures);
        expect(result).toEqual({
            apps: 0, asts: 0, con: 0, cs: 0, gls: 0, pensv: 0, points: 0, rcard: 0, sb: 0, subs: 0, tb: 0, ycard: 0,
        });
    });

    it('should return the stat object when a single stat array item', () => {
        const ffStats = {
            apps: 1, asts: 2, con: 3, cs: 4, gls: 5, pensv: 6, points: 7, rcard: 8, sb: 9, subs: 10, tb: 11, ycard: 12,
        };
        const fixtures = [{ stats: ffStats }];
        const result = totalUpStats(fixtures);
        expect(result).toEqual(ffStats);
    });

    it('should sum correctly when middle stats returns only zero', () => {
        const ffStats = {
            apps: 1, asts: 2, con: 3, cs: 4, gls: 5, pensv: 6, points: 7, rcard: 8, sb: 9, subs: 10, tb: 11, ycard: 12,
        };
        const ffStats2 = {
            apps: 0, asts: 0, con: 0, cs: 0, gls: 0, pensv: 0, points: 0, rcard: 0, sb: 0, subs: 0, tb: 0, ycard: 0,
        };
        const ffStats3 = {
            apps: 5, asts: 5, con: 5, cs: 24, gls: 25, pensv: 26, points: 27, rcard: 28, sb: 29, subs: 30, tb: 31, ycard: 32,
        };
        const fixtures = [{ stats: ffStats }, { stats: ffStats2 }, { stats: ffStats3 }];
        const result = totalUpStats(fixtures);
        expect(result).toEqual({
            apps: 6, asts: 7, con: 8, cs: 28, gls: 30, pensv: 32, points: 34, rcard: 36, sb: 38, subs: 40, tb: 42, ycard: 44,
        });
    });

    it('should never return NaN, even when there are no middle stats', () => {
        const ffStats = {
            apps: 1, asts: 2, con: 3, cs: 4, gls: 5, pensv: 6, points: 7, rcard: 8, sb: 9, subs: 10, tb: 11, ycard: 12,
        };
        const ffStats2 = { };
        const ffStats3 = {
            apps: 2, asts: 2, con: 2, cs: 2, gls: 2, pensv: 8, points: 27, rcard: 28, sb: 29, subs: 30, tb: 31, ycard: 32,
        };
        const fixtures = [{ stats: ffStats }, { stats: ffStats2 }, { stats: ffStats3 }];
        const result = totalUpStats(fixtures);
        expect(result).toEqual({
            apps: 3, asts: 4, con: 5, cs: 6, gls: 7, pensv: 14, points: 34, rcard: 36, sb: 38, subs: 40, tb: 42, ycard: 44,
        });
    });

    it('should never return NaN, even when there are no initial stats', () => {
        const ffStats = { };
        const ffStats2 = {
            apps: 1, asts: 2, con: 3, cs: 4, gls: 5, pensv: 6, points: 7, rcard: 8, sb: 9, subs: 10, tb: 11, ycard: 12,
        };
        const ffStats3 = {
            apps: 3, asts: 3, con: 3, cs: 3, gls: 3, pensv: 3, points: 3, rcard: 28, sb: 29, subs: 30, tb: 31, ycard: 32,
        };
        const fixtures = [{ stats: ffStats }, { stats: ffStats2 }, { stats: ffStats3 }];
        const result = totalUpStats(fixtures);
        expect(result).toEqual({
            apps: 4, asts: 5, con: 6, cs: 7, gls: 8, pensv: 9, points: 10, rcard: 36, sb: 38, subs: 40, tb: 42, ycard: 44,
        });
    });
});

describe('playerStats', () => {
    let fixtures;
    let player;

    beforeEach(() => {
        randomKey0 = chance.word();
        randomKey1 = chance.word();
        randomKey2 = chance.word();
        fixtures = [
            {
                date: '2017-08-12 17:30:00',
                status: 'PLAYED',
                stats: getStats(26),
                [randomKey0]: chance.word(),
            },
            {
                date: '2017-08-21 20:00:00',
                status: 'PLAYED',
                stats: getStats(26),
                [randomKey1]: chance.word(),
            },
            {
                date: '2017-08-26 12:30:00',
                status: 'PLAYED',
                stats: getStats(26),
                [randomKey2]: chance.word(),
            },
        ];
        player = {
            pos: 'GK',
            fixtures,
        };
    });

    it('return defaults when gameWeeks dont match', () => {
        const gameWeeks = [
            {
                gameWeek: 1,
                start: '2016-08-11 18:00:00',
                end: '2016-08-18 18:00:00',
            },
        ];
        const playerWithStats = playerStats({ player, gameWeeks });
        expect(playerWithStats.fixtures).toHaveLength(fixtures.length);
        expect(playerWithStats.pos).toEqual(player.pos);
        expect(playerWithStats.gameWeekFixtures).toEqual([]);
        expect(playerWithStats.gameWeekStats).toEqual({
            apps: 0, asts: 0, con: 0, cs: 0, gls: 0, pensv: 0, points: 0, rcard: 0, sb: 0, subs: 0, tb: 0, ycard: 0,
        });
    });

    it('return a single gameWeeks match', () => {
        player.fixtures[0].stats = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];
        const gameWeeks = [
            {
                gameWeek: 1,
                start: '2017-08-11 18:00:00',
                end: '2017-08-18 18:00:00',
            },
        ];
        const playerWithStats = playerStats({ player, gameWeeks });
        expect(playerWithStats.fixtures).toHaveLength(fixtures.length);
        expect(playerWithStats.fixtures[0]).toEqual({
            ...fixtures[0],
            stats: {
                ...extractFFStats(fixtures[0].stats),
                points: 27,
            },
        });
        expect(playerWithStats.pos).toEqual(player.pos);
        expect(playerWithStats.gameWeekFixtures).toEqual([
            {
                ...fixtures[0],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.gameWeekStats).toEqual({
            apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
        });
    });

    it('returns a gameWeekStats total when Sky gameweeks match a single ff gameweek', () => {
        player.fixtures[0].stats = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];
        player.fixtures[1].stats = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];
        player.fixtures[2].stats = [
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ];
        const gameWeeks = [
            {
                gameWeek: 1,
                start: '2017-08-11 18:00:00',
                end: '2017-08-23 18:00:00',
            },
        ];
        const playerWithStats = playerStats({ player, gameWeeks });
        expect(playerWithStats.fixtures).toHaveLength(3);
        expect(playerWithStats.fixtures).toEqual([
            {
                ...fixtures[0],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
            {
                ...fixtures[1],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
            {
                ...fixtures[2],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.pos).toEqual(player.pos);
        expect(playerWithStats.gameWeekFixtures).toEqual([
            {
                ...fixtures[0],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
            {
                ...fixtures[1],
                stats: {
                    apps: 1, asts: 1, con: 1, cs: 1, gls: 1, pensv: 1, points: 27, rcard: 1, sb: 2, subs: 1, tb: 2, ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.gameWeekStats).toEqual({
            apps: 2, asts: 2, con: 2, cs: 2, gls: 2, pensv: 2, points: 54, rcard: 2, sb: 4, subs: 2, tb: 4, ycard: 2,
        });
    });
});

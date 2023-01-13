/* eslint-env jest */
/* eslint-disable max-len */
const Chance = require('chance');
const extractFFStats = require('@kammy/helpers.extract-fpl-stats');

const { playerStats } = require('./player-stats');

const chance = new Chance();
const getStats = (count) => new Array(count).fill(chance.integer());

let randomKey0;
let randomKey1;
let randomKey2;

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
            stats: {},
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
            apps: 0,
            asts: 0,
            con: 0,
            cs: 0,
            gls: 0,
            pensv: 0,
            points: 0,
            rcard: 0,
            sb: 0,
            bp: 0,
            ycard: 0,
        });
    });

    it('return a single gameWeeks match', () => {
        player.fixtures[0].stats = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
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
                points: 3,
            },
        });
        expect(playerWithStats.pos).toEqual(player.pos);
        expect(playerWithStats.gameWeekFixtures).toEqual([
            {
                ...fixtures[0],
                stats: {
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.gameWeekStats).toEqual({
            apps: 1,
            asts: 1,
            con: 1,
            cs: 1,
            gls: 1,
            pensv: 1,
            points: 27,
            rcard: 1,
            sb: 2,
            subs: 1,
            tb: 2,
            ycard: 1,
        });
    });

    it('returns a gameWeekStats total when Sky gameweeks match a single ff gameweek', () => {
        player.fixtures[0].stats = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        player.fixtures[1].stats = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        player.fixtures[2].stats = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
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
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
            {
                ...fixtures[1],
                stats: {
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
            {
                ...fixtures[2],
                stats: {
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.pos).toEqual(player.pos);
        expect(playerWithStats.gameWeekFixtures).toEqual([
            {
                ...fixtures[0],
                stats: {
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
            {
                ...fixtures[1],
                stats: {
                    apps: 1,
                    asts: 1,
                    con: 1,
                    cs: 1,
                    gls: 1,
                    pensv: 1,
                    points: 27,
                    rcard: 1,
                    sb: 2,
                    subs: 1,
                    tb: 2,
                    ycard: 1,
                },
            },
        ]);
        expect(playerWithStats.gameWeekStats).toEqual({
            apps: 2,
            asts: 2,
            con: 2,
            cs: 2,
            gls: 2,
            pensv: 2,
            points: 54,
            rcard: 2,
            sb: 4,
            subs: 2,
            tb: 4,
            ycard: 2,
        });
    });
});

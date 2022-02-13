const jsonQuery = require('json-query');
const isBefore = require('date-fns/isBefore');
const isAfter = require('date-fns/isAfter');
const isEqual = require('date-fns/isEqual');
const extractFplStats = require('@kammy/helpers.extract-fpl-stats');
const { calculateTotalPoints, calculate } = require('@kammy/helpers.fpl-stats-to-points');

const logger = require('../../lib/log');

const emptyStatsRaw = {
    minutes: 0,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    bonus: 0,
    bps: 0,
};
const emptyStats = extractFplStats(emptyStatsRaw);

const getPosStats = ({ stats, pos }) => {
    // only show stats for those that can score points
    const posStats = Object.keys(stats).reduce(
        (prevPosStat, stat) => ({
            ...prevPosStat,
            [stat]: ['points', 'apps'].includes(stat) || calculate[stat](9, pos) !== 0 ? stats[stat] : 0,
        }),
        {},
    );
    return posStats;
};

// exported for tests
const addPointsToFixtures = (fixture, player) => {
    // console.log('fixture');
    // console.log(Object.keys(fixture));
    const stats = extractFplStats(fixture || emptyStatsRaw);
    const points = calculateTotalPoints({ stats, pos: player.pos, gameWeekFixtures: [fixture] });
    return {
        ...fixture,
        stats: {
            ...getPosStats({ stats, pos: player.pos }),
            points: points.total,
        },
    };
};

const totalUpStats = (fixtures) =>
    fixtures.reduce(
        (totals, gw) =>
            Object.keys(totals).reduce(
                (prev, stat) => ({
                    ...prev,
                    [stat]: (gw.stats[stat] || 0) + totals[stat],
                }),
                emptyStats,
            ),
        emptyStats,
    );

const getGameWeekFixtures = (player, gameWeeks) =>
    jsonQuery('stats[*:date]', {
        data: player,
        locals: {
            date(item) {
                const fixtureDate = item.date;
                return gameWeeks.reduce((prev, gameWeek) => {
                    const gameweekEnd = gameWeek.end;
                    const gameweekStart = gameWeek.start;
                    const beforeEnd = isBefore(fixtureDate, gameweekEnd) || isEqual(fixtureDate, gameweekEnd);
                    const afterStart = isAfter(fixtureDate, gameweekStart) || isEqual(fixtureDate, gameweekStart);
                    return prev || (afterStart && beforeEnd);
                }, false);
            },
        },
    }).value || [];

const counter = 0;
const playerStats = ({ player, gameWeeks }) => {
    if (!player) {
        console.log('no player!');
        return {};
    }
    if (!player.pos) {
        console.log(player);
        console.log('no player pos!');
        process.exit(1);
    }

    if (!player.stats) {
        console.log(player);
        console.log('no player stats!');
        process.exit(1);
    }
    // console.log('player');
    // console.log(Object.keys(player));
    const playerFixtures = getGameWeekFixtures(player, gameWeeks);
    // console.log('playerFixtures');
    // console.log(playerFixtures);
    // console.log(player);
    const gameWeekFixtures = playerFixtures.map((fixture) => addPointsToFixtures(fixture, player));
    // counter++;
    // if (counter > 2) process.exit(1);
    const stats = totalUpStats(gameWeekFixtures);
    const point = calculateTotalPoints({ stats, pos: player.pos, gameWeekFixtures });
    const gameWeekStats = {
        ...getPosStats({ stats, pos: player.pos }),
        points: point.total,
    };

    const fixtures = (player.fixtures || []).map((fixture) => addPointsToFixtures(fixture, player));
    if (!fixtures || !fixtures.length) {
        logger.warn(`PLAYER FIXTURES NOT FOUND: ${player.web_name}`);
    }
    return {
        ...player,
        fixtures,
        gameWeekFixtures,
        gameWeekStats,
    };
};

module.exports = {
    playerStats,
};

const jsonQuery = require('json-query');
const isBefore = require('date-fns/isBefore');
const isAfter = require('date-fns/isAfter');
const isEqual = require('date-fns/isEqual');
const extractFFStats = require('@kammy/helpers.extract-sky-sports-stats');
const { calculateTotalPoints } = require('@kammy/helpers.sky-sports-stats-to-points');

const logger = require('../../lib/log');

const emptyStatsArray = Array.from(Array(26), () => 0);
const emptyStats = extractFFStats(emptyStatsArray);

const getPosStats = ({ stats, pos }) => {
    // only show stats for those that can score points
    const posStats = Object.keys(stats).reduce(
        (prevPosStat, stat) => ({
            ...prevPosStat,
            [stat]: calculateTotalPoints({ stats: { [stat]: 9 }, pos }).total !== 0 ? stats[stat] : null,
        }),
        {},
    );
    return posStats;
};

// exported for tests
const addPointsToFixtures = (fixture, pos) => {
    const stats = extractFFStats(fixture.stats || emptyStatsArray);
    const points = calculateTotalPoints({ stats, pos });
    return {
        ...fixture,
        stats: {
            ...getPosStats({ stats, pos }),
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
    // todo: don't include PENDING in production!
    jsonQuery('fixtures[*:date]', {
        // [*status!=PENDING]
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
    const playerFixtures = getGameWeekFixtures(player, gameWeeks);
    const gameWeekFixtures = playerFixtures.map((fixture) => addPointsToFixtures(fixture, player.pos));
    const stats = totalUpStats(gameWeekFixtures);
    const point = calculateTotalPoints({ stats, pos: player.pos });
    const gameWeekStats = {
        ...getPosStats({ stats, pos: player.pos }),
        points: point.total,
    };
    const fixtures = (player.fixtures || []).map((fixture) => addPointsToFixtures(fixture, player.pos));
    if (!fixtures || !fixtures.length) {
        logger.warn(`PLAYER FIXTURES NOT FOUND: ${player.name}`);
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

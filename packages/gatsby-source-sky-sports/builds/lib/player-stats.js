const jsonQuery = require('json-query');
const isBefore = require('date-fns/isBefore');
const isAfter = require('date-fns/isAfter');
const isEqual = require('date-fns/isEqual');

const extractFFStats = require('./extract-ff-stats');
const { calculateTotalPoints } = require('./calculate-points');
const logger = require('../../lib/log');

const emptyStatsArray = Array.from(Array(26), () => 0);
const emptyStats = extractFFStats(emptyStatsArray);

// exported for tests
const addPointsToFixtures = (fixture, pos) => {
    const stats = extractFFStats(fixture.stats || emptyStatsArray);
    return {
        ...fixture,
        stats: {
            ...stats,
            points: calculateTotalPoints({ stats, pos }).total,
        },
    };
};

// expsorted for tests
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

// exposrted for tests
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
    if (!player) return {};
    const playerFixtures = getGameWeekFixtures(player, gameWeeks);
    const gameWeekFixtures = playerFixtures.map((fixture) => addPointsToFixtures(fixture, player.pos));
    const stats = totalUpStats(gameWeekFixtures);
    const gameWeekStats = {
        ...stats,
        points: calculateTotalPoints({ stats, pos: player.pos }).total,
    };
    const fixtures = player.fixtures.map((fixture) => addPointsToFixtures(fixture, player.pos));
    if (!fixtures || !fixtures.length) {
        logger.warn(`PLAYER NOT FOUND: ${player.name}`);
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
const jsonQuery = require('json-query');
const isBefore = require('date-fns/is_before');
const isAfter = require('date-fns/is_after');
const isEqual = require('date-fns/is_equal');

const extractFFStats = require('./extract-ff-stats');
const { calculateTotalPoints } = require('./calculatePoints');

const emptyStatsArray = Array.from(Array(26), () => 0);
const emptyStats = extractFFStats(emptyStatsArray);

// exported for tests
const addPointsToFixtures = (fixture, pos) => {
    const stats = extractFFStats(fixture.stats || emptyStatsArray);
    return ({
        ...fixture,
        stats: {
            ...stats,
            points: calculateTotalPoints({ stats, pos }).total,
        },
    });
};

// expsorted for tests
const totalUpStats = (fixtures) => (
    fixtures.reduce((totals, gw) => (
        Object.keys(totals).reduce((prev, stat) => ({
            ...prev,
            [stat]: (gw.stats[stat] || 0) + totals[stat],
        }), emptyStats)
    ), emptyStats)
);

// exposrted for tests
const getGameWeekFixtures = (player, gameWeeks) => (
    jsonQuery('fixtures[*status!=PENDING][*:date]', {
        data: player,
        locals: {
            date(item) {
                const fixtureDate = item.date;
                return gameWeeks.reduce((prev, gameWeek) => {
                    const beforeEnd = isBefore(fixtureDate, gameWeek.end) || isEqual(fixtureDate, gameWeek.end);
                    const afterStart = isAfter(fixtureDate, gameWeek.start) || isEqual(fixtureDate, gameWeek.start);
                    return (
                        prev || (afterStart && beforeEnd)
                    );
                }, false);
            },
        },
    }).value || []
);

const calculatePoints = calculateTotalPoints;

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
    return {
        ...player, fixtures, gameWeekFixtures, gameWeekStats,
    };
};

const defaults = ({ children, gameWeeks, player }) => (
    children(playerStats({ player, gameWeeks }))
);

module.exports = {
    defaults,
    addPointsToFixtures,
    totalUpStats,
    getGameWeekFixtures,
    calculatePoints,
    playerStats,
};

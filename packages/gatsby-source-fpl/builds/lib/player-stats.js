/* eslint-disable no-console */
const extractFplStats = require('@kammy/helpers.extract-fpl-stats');
const { calculateTotalPoints, calculate } = require('@kammy/helpers.fpl-stats-to-points');

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

const getPosStats = ({ stats, playerPositionId }) => {
    // only show stats for those that can score points
    const posStats = Object.keys(stats).reduce(
        (prevPosStat, stat) => ({
            ...prevPosStat,
            [stat]: ['points', 'apps'].includes(stat) || calculate[stat](9, playerPositionId) !== 0 ? stats[stat] : 0,
        }),
        {},
    );
    return posStats;
};

// exported for tests
const addPointsToFixtures = (fixture, player) => {
    const stats = extractFplStats(fixture || emptyStatsRaw);
    const points = calculateTotalPoints({ stats, playerPositionId: player.positionId, gameWeekFixtures: [fixture] });
    return {
        ...fixture,
        stats: {
            ...getPosStats({ stats, playerPositionId: player.positionId }),
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

// const counter = 0;
const getPlayerStats = ({ player, gameWeek, fplTeams }) => {
    if (!player) {
        console.log('no player!');
        return {};
    }
    if (!player.positionId) {
        console.log(player);
        console.log('no player pos!');
        process.exit(1);
    }

    if (!player.stats) {
        console.log(player);
        console.log('no player stats!');
        process.exit(1);
    }

    const gameWeekFixtures = gameWeek.fixtures
        .filter(
            (fixture) =>
                player.stats.find((stats) => stats.fixture === fixture.fixture_id) ||
                player.fixtures.find((fix) => fix.id === fixture.fixture_id),
        )
        .map((gwFixture) => {
            try {
                const playerFixture = player.fixtures.find((fix) => fix.id === gwFixture.fixture_id);
                const playerFixtureStats = player.stats.find((stats) => stats.fixture === gwFixture.fixture_id);
                const home = playerFixtureStats?.was_home ?? playerFixture?.is_home;
                return {
                    ...playerFixture,
                    ...gwFixture,
                    oponent: {
                        club: home ? gwFixture.awayTeam.name : gwFixture.homeTeam.name,
                        awayOrHomeLabel: home ? 'h' : 'a',
                    },
                    ...addPointsToFixtures(playerFixtureStats, player),
                };
            } catch (e) {
                const playerFixture = player.fixtures.find((fix) => fix.id === gwFixture.fixture_id);
                const playerFixtureStats = player.stats.find((stats) => stats.fixture === gwFixture.fixture_id);

                console.log(e);
                console.log({ playerFixture });
                console.log({ gwFixture });
                console.log({ playerFixtureStats });
                process.exit(1);
            }
        });
    // counter++;
    // if (counter > 2) process.exit(1);
    const stats = totalUpStats(gameWeekFixtures);
    const point = calculateTotalPoints({ stats, playerPositionId: player.positionId, gameWeekFixtures });
    const gameWeekStats = {
        ...getPosStats({ stats, playerPositionId: player.positionId }),
        points: point.total,
    };

    return {
        ...player,
        gameWeekFixtures,
        gameWeekStats,
    };
};

module.exports = {
    getPlayerStats,
};

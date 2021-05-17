const { calculateTotalPoints } = require('@kammy/helpers.sky-sports-stats-to-points');

const calculateSeasonStats = (playerGameWeeks, pos) =>
    playerGameWeeks.reduce(
        (totals, gw) =>
            Object.keys(gw.gameWeekStats).reduce(
                (prev, stat) => ({
                    ...prev,
                    [stat]:
                        // only add stats of those that can score points
                        stat === 'points' || calculateTotalPoints({ stats: { [stat]: 9 }, pos }).total !== 0
                            ? gw.gameWeekStats[stat] + (totals[stat] || 0)
                            : null,
                }),
                {},
            ),
        {},
    );

module.exports = calculateSeasonStats;

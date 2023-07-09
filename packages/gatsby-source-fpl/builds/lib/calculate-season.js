const { calculate } = require('@kammy/helpers.fpl-stats-to-points');

const calculateSeasonStats = (playerGameWeeks, pos) =>
    playerGameWeeks.reduce(
        (totals, gw) =>
            Object.keys(gw.gameWeekStats || {}).reduce((prev, stat) => {
                if (!calculate[stat] && stat !== 'points') {
                    // eslint-disable-next-line no-console
                    console.log(`unknown stat: ${stat}`);
                }
                return {
                    ...prev,
                    [stat]:
                        // only add stats of those that can score points
                        ['points', 'apps'].includes(stat) || calculate[stat](9, pos) !== 0
                            ? gw.gameWeekStats[stat] + (totals[stat] || 0)
                            : 0,
                };
            }, {}),
        {},
    );

module.exports = calculateSeasonStats;

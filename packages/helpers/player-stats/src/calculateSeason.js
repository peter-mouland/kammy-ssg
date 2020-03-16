const calculateSeasonStats = (playerGameWeeks) => (
    playerGameWeeks.reduce((totals, gw) => (
        Object.keys(gw.gameWeekStats).reduce((prev, stat) => ({
            ...prev,
            [stat]: gw.gameWeekStats[stat] + (totals[stat] || 0),
        }), {})
    ), {})
);

module.exports = calculateSeasonStats;

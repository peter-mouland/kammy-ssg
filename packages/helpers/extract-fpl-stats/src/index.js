module.exports = (stats) => {
    if (typeof stats.goals_scored === 'undefined') {
        // console.log(stats);
        // process.exit(1);
    }
    return {
        apps: stats.minutes || 0,
        gls: stats.goals_scored || 0,
        asts: stats.assists || 0,
        cs: stats.clean_sheets || 0,
        con: stats.goals_conceded || 0,
        pensv: stats.penalties_saved || 0,
        ycard: stats.yellow_cards || 0,
        rcard: stats.red_cards || 0,
        sb: stats.saves || 0,
        bp: stats.bonus || 0,
        points: 0,
    };
};

function forMinutes(gameWeekFixtures = []) {
    // cumulative minutes doesnt work, we need to know the individual minutes for each game fixture in that game week
    return gameWeekFixtures.filter(Boolean).reduce((prev, { minutes }) => {
        if (minutes === 0) return prev;
        if (minutes < 45) return prev + 1;
        return prev + 3;
    }, 0);
}

function forGoals(goals = 0, playerPositionId) {
    if (playerPositionId === 'gk') {
        return goals * 10;
    } else if (playerPositionId === 'fb' || playerPositionId === 'cb') {
        return goals * 8;
    } else if (playerPositionId === 'mid') {
        return goals * 5;
    } else if (playerPositionId === 'am') {
        return goals * 5;
    } else if (playerPositionId === 'str') {
        return goals * 4;
    }
    return 0;
}

function forAssists(assists = 0) {
    return assists * 3;
}

function forYellowCards(yc = 0) {
    return yc * -1;
}

function forRedCards(rc = 0) {
    return rc * -5;
}

function forCleanSheet(cs = 0, playerPositionId) {
    if (playerPositionId === 'fb' || playerPositionId === 'cb' || playerPositionId === 'gk') {
        return cs * 5;
    }
    if (playerPositionId === 'mid') {
        return cs * 3;
    }
    return 0;
}

function forConceded(conceded = 0, playerPositionId) {
    if (playerPositionId === 'fb' || playerPositionId === 'cb' || playerPositionId === 'gk') {
        return conceded * -1;
    }
    return 0;
}

function forPenaltiesSaved(ps = 0) {
    return ps * 5;
}

function forSaveBonus(saves = 0, playerPositionId) {
    if (playerPositionId === 'gk' && saves >= 3) {
        return 2;
    }
    return 0;
}

function forBonus(bonusPoints = 0, playerPositionId) {
    if (playerPositionId === 'cb' || playerPositionId === 'mid') {
        return bonusPoints || 0;
    }
    return 0;
}

function calculateTotalPoints({ stats, playerPositionId, gameWeekFixtures }) {
    // if (stats.apps_array) console.log(Object.keys(stats));
    const apps = forMinutes(gameWeekFixtures);
    const gls = forGoals(stats.gls, playerPositionId);
    const asts = forAssists(stats.asts, playerPositionId);
    const cs = forCleanSheet(stats.cs, playerPositionId);
    const con = forConceded(stats.con, playerPositionId);
    const pensv = forPenaltiesSaved(stats.pensv, playerPositionId);
    const ycard = forYellowCards(stats.ycard, playerPositionId);
    const rcard = forRedCards(stats.rcard, playerPositionId);
    const sb = forSaveBonus(stats.sb, playerPositionId);
    const bp = forBonus(stats.bp, playerPositionId);
    const points = {
        apps,
        gls,
        asts,
        cs,
        con,
        pensv,
        ycard,
        rcard,
        sb,
        bp,
    };
    const total = Object.keys(points).reduce((prev, curr) => prev + points[curr], 0);
    return { ...points, total };
}

module.exports = {
    calculate: {
        apps: forMinutes,
        gls: forGoals,
        asts: forAssists,
        cs: forCleanSheet,
        con: forConceded,
        pensv: forPenaltiesSaved,
        ycard: forYellowCards,
        rcard: forRedCards,
        sb: forSaveBonus,
        bp: forBonus,
    },
    forMinutes,
    forGoals,
    forAssists,
    forYellowCards,
    forRedCards,
    forCleanSheet,
    forConceded,
    forPenaltiesSaved,
    forSaveBonus,
    forBonus,
    calculateTotalPoints,
};

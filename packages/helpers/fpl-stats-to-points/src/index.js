function forMinutes(minutes = 0) {
    if (minutes === 0) return 0;
    if (minutes < 45) return 1;
    return 3;
}

function forGoals(goals = 0, position) {
    if (position === 'GK') {
        return goals * 10;
    } else if (position === 'FB' || position === 'CB') {
        return goals * 8;
    } else if (position === 'MID') {
        return goals * 6;
    } else if (position === 'AM') {
        return goals * 5;
    } else if (position === 'STR') {
        return goals * 4;
    }
    return 0;
}

function forAssists(assists = 0) {
    return assists * 3;
}

function forYellowCards(yc = 0) {
    return parseInt(yc * -1, 10);
}

function forRedCards(rc = 0) {
    return parseInt(rc * -5, 10);
}

function forCleanSheet(cs = 0, position) {
    if (position === 'FB' || position === 'CB' || position === 'GK') {
        return cs * 5;
    }
    if (position === 'MID') {
        return cs * 3;
    }
    return 0;
}

function forConceded(conceded = 0, position) {
    if (position === 'FB' || position === 'CB' || position === 'GK') {
        return conceded * -1;
    }
    return 0;
}

function forTackleBonus(bonusPoints = 0, position) {
    if (position === 'MID') {
        return bonusPoints * 5;
    } else if (position === 'FB' || position === 'CB') {
        return bonusPoints * 3;
    }
    return 0;
}

function forPenaltiesSaved(ps = 0) {
    return ps * 5;
}

function forSaveBonus(bonusPoints = 0, position) {
    if (position === 'GK') {
        return bonusPoints * 2;
    }
    return 0;
}

function forBonus(bonusPoints = 0, position) {
    if (position === 'CB' || position === 'MID') {
        return bonusPoints || 0;
    }
    return 0;
}

function calculateTotalPoints({ stats, pos }) {
    const apps = forMinutes(stats.apps, pos);
    const gls = forGoals(stats.gls, pos);
    const asts = forAssists(stats.asts, pos);
    const cs = forCleanSheet(stats.cs, pos);
    const con = forConceded(stats.con, pos);
    const pensv = forPenaltiesSaved(stats.pensv, pos);
    const ycard = forYellowCards(stats.ycard, pos);
    const rcard = forRedCards(stats.rcard, pos);
    const sb = forSaveBonus(stats.sb, pos);
    const bp = forBonus(stats.bp, pos);
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
    forMinutes,
    forGoals,
    forAssists,
    forYellowCards,
    forRedCards,
    forCleanSheet,
    forConceded,
    forTackleBonus,
    forPenaltiesSaved,
    forSaveBonus,
    forBonus,
    calculateTotalPoints,
};

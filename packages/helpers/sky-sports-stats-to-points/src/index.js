function forStarting(starts = 0) {
    return starts * 3;
}

function forSub(subs = 0) {
    return subs;
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

function forPassBonus(bonusPoints = 0, position) {
    return position === 'MID' && bonusPoints > 0 ? 1 : 0;
}

function calculateTotalPoints({ stats, pos }) {
    const apps = forStarting(stats.apps, pos);
    const subs = forSub(stats.subs, pos);
    const gls = forGoals(stats.gls, pos);
    const asts = forAssists(stats.asts, pos);
    const cs = forCleanSheet(stats.cs, pos);
    const con = forConceded(stats.con, pos);
    const pensv = forPenaltiesSaved(stats.pensv, pos);
    const ycard = forYellowCards(stats.ycard, pos);
    const rcard = forRedCards(stats.rcard, pos);
    const tb = forTackleBonus(stats.tb, pos);
    const sb = forSaveBonus(stats.sb, pos);
    const pb = forPassBonus(stats.pb, pos);
    const points = {
        apps,
        subs,
        gls,
        asts,
        cs,
        con,
        pensv,
        ycard,
        rcard,
        tb,
        sb,
        pb,
    };
    const total = Object.keys(points).reduce((prev, curr) => prev + points[curr], 0);
    return { ...points, total };
}

module.exports = {
    forStarting,
    forSub,
    forGoals,
    forAssists,
    forYellowCards,
    forRedCards,
    forCleanSheet,
    forConceded,
    forTackleBonus,
    forPenaltiesSaved,
    forSaveBonus,
    forPassBonus,
    calculateTotalPoints,
};

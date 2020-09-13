function forStarting(starts = 0) {
    // starting a match 3 point
    return starts * 3;
}

function forSub(subs = 0) {
    // sub = 1 point
    return subs * 1;
}

function forGoals(goals = 0, position) {
    // depends on position
    let multiplier = 0;
    if (position === 'GK') {
        multiplier = 10;
    } else if (position === 'FB' || position === 'CB') {
        multiplier = 8;
    } else if (position === 'MID') {
        multiplier = 6;
    } else if (position === 'AM') {
        multiplier = 5;
    } else if (position === 'STR') {
        multiplier = 4;
    }
    return goals * multiplier;
}

function forAssists(assists = 0) {
    // assist = 3 points
    return assists * 3;
}

function forYellowCards(yc = 0) {
    // -1
    return parseInt(yc * -1, 10);
}

function forRedCards(rc = 0) {
    // -5
    return parseInt(rc * -5, 10);
}

function forCleanSheet(cs = 0, position) {
    // 5
    let multiplier;
    if (position === 'FB' || position === 'CB' || position === 'GK') {
        multiplier = 5;
    } else {
        multiplier = 0;
    }
    return cs * multiplier;
}

function forConceded(conceded = 0, position) {
    // -1
    let multiplier;
    if (position === 'FB' || position === 'CB' || position === 'GK') {
        multiplier = -1;
    } else {
        multiplier = 0;
    }
    return parseInt(conceded * multiplier, 10);
}

function forTackleBonus(bonusPoints = 0, position) {
    // 3
    let multiplier;
    if (position === 'MID') {
        multiplier = 5;
    } else if (position === 'FB' || position === 'CB') {
        multiplier = 3;
    } else {
        multiplier = 0;
    }
    return parseInt(bonusPoints * multiplier, 10);
}

function forPenaltiesSaved(ps = 0) {
    return ps * 5;
}

function forSaveBonus(bonusPoints = 0, position) {
    let multiplier;
    if (position === 'GK') {
        multiplier = 2;
    } else {
        multiplier = 0;
    }
    return parseInt(bonusPoints * multiplier, 10);
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

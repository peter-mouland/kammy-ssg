// eslint-disable-next-line max-classes-per-file
import sortBy from '@kammy/sort-columns';

class Points {
    constructor({ positionId, gameWeekPoints, seasonPoints, rank, rankChange }) {
        this.positionId = positionId;
        this.gameWeekPoints = gameWeekPoints;
        this.seasonPoints = seasonPoints;
        this.rank = rank;
        this.rankChange = rankChange;
    }
}

class Standing {
    constructor({ gameWeek, managerId, am, cb, fb, gks, mid, str, total }) {
        this.gameWeek = gameWeek;
        this.managerId = managerId;
        this.gks = new Points({ positionId: 'gks', ...gks });
        this.cb = new Points({ positionId: 'cb', ...cb });
        this.fb = new Points({ positionId: 'fb', ...fb });
        this.mid = new Points({ positionId: 'mid', ...mid });
        this.am = new Points({ positionId: 'am', ...am });
        this.str = new Points({ positionId: 'str', ...str });
        this.total = new Points({ positionId: 'total', ...total });
    }
}
export class DivisionStandings {
    byManagerId = {};
    all = [];

    constructor({ managersStats }) {
        this.divisionId = managersStats[0].manager.divisionId;
        managersStats.forEach(({ gameWeek, points, manager }) => {
            const { managerId, divisionId } = manager;
            const standing = new Standing({ divisionId, managerId, gameWeek, ...points });
            this.all.push(standing);
            this.byManagerId[standing.managerId] = standing;
        });
    }

    get rankStandings() {
        return [...this.all.sort(sortBy([`-total.rank`, '-total.seasonPoints']))];
    }

    get rankChangeStandings() {
        return [...this.all.sort(sortBy([`-total.rankChange`, '-total.seasonPoints']))];
    }
}

export default class Standings {
    byManagerId = {};
    byDivisionId = {};

    constructor(divisions) {
        divisions.forEach((managersStats) => {
            const divisionStandings = new DivisionStandings(managersStats);
            this.byDivisionId[divisionStandings.divisionId] = divisionStandings;
            this.byManagerId = { ...this.byManagerId, ...divisionStandings.byManagerId };
        });
    }
}

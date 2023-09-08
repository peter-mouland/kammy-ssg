export default class Player {
    constructor({ fplStats, url, webName, Club, currentGwPoints }) {
        this.fplStats = fplStats;
        this.url = `/${url}`;
        this.web_name = webName;
        this.Club = Club;
        this.currentGwPoints = currentGwPoints;
    }

    getDivisionLabel() {
        return this.Division.label;
    }

    getManagers() {
        return this.managers;
    }

    getStanding({ managerId, positionId }) {
        return { rank: 0, seasonPoints: 0 };
    }

    getStandings() {
        return [[{ rank: 0, points: 0, manager: undefined, squadPos: 0 }]];
    }

    getGameWeekScore({ managerId, positionId }) {
        return { rankChange: 0, gWPoints: 0 };
    }

    getGameWeekScores() {
        return [[{ rankChange: 0, gWPoints: 0, manager: undefined, squadPos: 0 }]];
    }
}

import parseISO from 'date-fns/parseISO';

class GameWeekFixture {
    constructor({ id, event, team_a_score, team_h_score, awayTeam, homeTeam, date, finished }) {
        this.id = id;
        this.event = event;
        this.awayTeam = awayTeam;
        this.homeTeam = homeTeam;
        this.team_a_score = team_a_score;
        this.team_h_score = team_h_score;
        this.date = new Date(date);
        this.finished = finished;
    }
}

class GameWeek {
    constructor({ id, label, url, start, end, isCurrent, hasCup, startFromNow, endFromNow, fixtures }) {
        this.id = id;
        this.label = label;
        this.url = url;
        this.start = new Date(start);
        this.end = new Date(end);
        this.isCurrent = isCurrent;
        this.hasCup = hasCup;
        this.startFromNow = startFromNow;
        this.endFromNow = endFromNow;
        this.fixtures = fixtures.map((fixture) => new GameWeekFixture(fixture));
    }
}

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

export default class GameWeeks {
    constructor(gameweeks) {
        this.gameWeeks = gameweeks.map((gm) => new GameWeek(gm));
        this.currentGameWeekIndex = this.gameWeeks.findIndex(({ isCurrent }) => !!isCurrent);
        this.currentGameWeek = this.gameWeeks[this.currentGameWeekIndex];
        this.nextGameWeek = this.gameWeeks[this.currentGameWeekIndex + 1];
        this.previousGameWeek = this.gameWeeks[this.currentGameWeekIndex - 1];
    }

    getGameWeekFromDate(date) {
        const gwIndex = this.gameWeeks.findIndex(({ start, end }) => inDateRange({ start, end }, date));
        return gwIndex < 0 ? 1 : gwIndex;
    }

    isCurrentGameWeek(gameWeekIndex) {
        return gameWeekIndex === this.currentGameWeekIndex;
    }
}

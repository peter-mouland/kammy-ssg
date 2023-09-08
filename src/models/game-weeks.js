import parseISO from 'date-fns/parseISO';

class GameWeekFixture {
    constructor({ id, event, aScore, aTcode, aTname, aTshortName, date, hScore, hTcode, hTname, hTshortName, status }) {
        this.id = id;
        this.event = event;
        this.aScore = aScore;
        this.aTcode = aTcode;
        this.aTname = aTname;
        this.aTshortName = aTshortName;
        this.date = new Date(date);
        this.hScore = hScore;
        this.hTcode = hTcode;
        this.hTname = hTname;
        this.hTshortName = hTshortName;
        this.status = status;
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
}

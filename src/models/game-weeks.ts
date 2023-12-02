import fromNow from 'fromnow';

export class GameWeekFixture {
    id: number;
    event: number;
    awayTeam: unknown;
    homeTeam: unknown;
    team_a_score: number;
    team_h_score: number;
    date: Date;
    finished: boolean;
    constructor({ id, event, team_a_score, team_h_score, awayTeam, homeTeam, date, finished }: GameWeekFixture) {
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

type GameWeekAPI = GameWeek & { sinceStartMs: number; fixtures: GameWeekFixture[] };

export class GameWeek {
    id: number;
    label: string;
    url: string;
    hasPassed: boolean;
    start: Date;
    end: Date;
    endsIn: string;
    isCurrent: boolean;
    hasCup: boolean;
    startFromNow: string;
    endFromNow: string;
    fixtures: GameWeekFixture[];
    constructor(gameWeek: GameWeekAPI) {
        this.start = new Date(gameWeek.start);
        this.end = new Date(gameWeek.end);
        const lt48Hrs = (this.end - Date.now()) / 1000 / 60 / 60 < 48;
        this.id = gameWeek.id;
        this.label = gameWeek.label;
        this.url = gameWeek.url;
        this.hasPassed = gameWeek.sinceStartMs > 0;
        this.endsIn = fromNow(gameWeek.end, { max: lt48Hrs ? 2 : 1, zero: false });
        this.isCurrent = gameWeek.isCurrent;
        this.hasCup = gameWeek.hasCup;
        this.startFromNow = gameWeek.startFromNow;
        this.endFromNow = gameWeek.endFromNow;
        this.fixtures = gameWeek.fixtures.map((fixture) => new GameWeekFixture(fixture));
    }
}

const inDateRange = ({ start, end }: { start: Date; end: Date }, comparison: Date) =>
    comparison < end && comparison > start;

export default class GameWeeks {
    gameWeeks: GameWeek[];
    currentGameWeekIndex: number;
    currentGameWeek: GameWeek;
    nextGameWeek: GameWeek;
    previousGameWeek: GameWeek;
    constructor(gameweeks: GameWeekAPI[]) {
        this.gameWeeks = gameweeks.map((gw) => new GameWeek(gw));
        this.currentGameWeekIndex = this.gameWeeks.find(({ isCurrent }) => !!isCurrent)?.id || 0;
        this.currentGameWeek = this.gameWeeks[this.currentGameWeekIndex];
        this.nextGameWeek = this.gameWeeks[this.currentGameWeekIndex + 1];
        this.previousGameWeek = this.gameWeeks[this.currentGameWeekIndex - 1];
    }

    getSelectedGameWeek(selectedGameWeek) {
        return this.gameWeeks[selectedGameWeek];
    }

    getGameWeekFromDate(date: Date) {
        return this.gameWeeks.find(({ start, end }) => inDateRange({ start, end }, date));
    }

    isCurrentGameWeek(gameWeekIndex: number) {
        return gameWeekIndex === this.currentGameWeekIndex;
    }
}

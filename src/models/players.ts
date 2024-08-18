// eslint-disable-next-line max-classes-per-file
import { Stats } from './stats';

import type { Position } from './position';
import type { Manager } from './managers';

type Options = { gameWeekIndex?: PlayerGameWeek['gameWeekIndex'] };

// from gatsby division-players/players pages
type TeamAPI = { name: string; code: number };
type FixtureAPI = {
    is_home: boolean;
    was_home: boolean;
    team_a_score: number;
    team_h_score: number;
    started: boolean;
    finished: boolean;
    awayTeam: TeamAPI;
    homeTeam: TeamAPI;
    stats: Stats;
};
type GameWeekAPI = { gameWeekIndex: number; stats: Stats; fixtures: FixtureAPI[] };
type PositionAPI = { label: string };
type PlayerAPI = {
    url: string;
    name: string;
    club: string;
    positionId: string;
    position: PositionAPI;
    new: boolean;
    code: number;
    photo: string;
    form: number;
    value_season: number;
    seasonStats: Stats;
    gameWeeks: GameWeekAPI[];
};

class PlayerFixture {
    homeTeam: unknown;
    awayTeam: unknown;
    started: boolean;
    finished: boolean;
    homeGame: boolean;
    team_h_score: number;
    team_a_score: number;
    stats: Stats;
    constructor(playerFixture: FixtureAPI) {
        this.homeTeam = playerFixture.homeTeam;
        this.awayTeam = playerFixture.awayTeam;
        this.finished = playerFixture.finished;
        this.started = playerFixture.started;
        this.homeGame = playerFixture.was_home || playerFixture.is_home;
        this.team_h_score = playerFixture.team_h_score;
        this.team_a_score = playerFixture.team_a_score;
        this.stats = new Stats(playerFixture.stats);
    }
}

class PlayerFixtures {
    all: PlayerFixture[] = [];
    constructor(playerFixtures: FixtureAPI[] = []) {
        playerFixtures.forEach((playerFixture) => {
            this.all.push(new PlayerFixture(playerFixture));
        });
    }
}

class PlayerGameWeek {
    gameWeekIndex: number;
    fixtures: PlayerFixtures;
    stats: Stats;
    constructor(playerGameWeek: GameWeekAPI) {
        this.gameWeekIndex = playerGameWeek.gameWeekIndex;
        this.fixtures = new PlayerFixtures(playerGameWeek.fixtures);
        this.stats = new Stats(playerGameWeek.stats);
    }
}

class PlayerGameWeeks {
    all: PlayerGameWeek[] = [];
    constructor(playerGameWeeks: GameWeekAPI[] = []) {
        playerGameWeeks.forEach((playerGameWeek) => {
            const gw = new PlayerGameWeek(playerGameWeek);
            this.all.push(gw);
        });
    }
}

export class Player {
    // live: async (_, args) => {
    //     data = await request(`${baseURI}/event/${args.event}/live/`);
    //     elements = data.elements;
    //     return elements.find((el) => el.id == args.id);
    // },

    gameWeeks: PlayerGameWeeks = { all: [] };
    seasonStats: Stats;
    fixtures: PlayerFixture[] = [];
    manager = {};
    form: number;
    code: number;
    photo: string;
    name: string;
    club: string;
    position: PositionAPI;
    positionId: Position['id'];
    new: boolean;
    url: string;
    rawData: unknown;

    constructor(player: PlayerAPI, options: Options = {}) {
        this.form = player.form;
        this.value_season = player.value_season;
        this.code = player.code;
        this.photo = player.photo;
        this.name = player.name;
        this.club = player.club;
        this.position = player.position;
        this.positionId = player.positionId;
        this.new = player.new;
        this.url = player.url;
        this.rawData = player;
        this.gameWeeks = new PlayerGameWeeks(player.gameWeeks);
        this.seasonStats =
            typeof options.gameWeekIndex === 'number'
                ? this.gameWeeks.all[options.gameWeekIndex].stats
                : new Stats(player.seasonStats);
        this.fixtures = this.gameWeeks.all.reduce((prev, curr) => {
            curr.fixtures.all.forEach((fixture) => {
                prev.push(fixture);
            });
            return prev;
        }, [] as PlayerFixture[]);
    }

    getGameWeekFixtures(gameWeekIndex: number) {
        return this.gameWeeks.all[gameWeekIndex].fixtures;
    }

    getSeasonPoints() {
        return this.seasonStats;
    }

    addManager(manager: Partial<Manager>) {
        this.manager = manager;
    }
}

type ManagedPlayers = {
    manager: { managerId: Manager['managerId']; label: Manager['label'] };
    player: { code: Player['code'] };
}[];

export class Players {
    all: Player[] = [];
    byCode: Record<string, Player> = {};

    constructor(players: PlayerAPI[], options: Options) {
        players.forEach((player) => {
            const player1 = new Player(player, options);
            this.all.push(player1);
            this.byCode[player1.code] = player1;
        });
    }

    /* [
        manager: { managerId, label }
        player: { code }
     ] */
    addManagers(managedPlayers: ManagedPlayers) {
        managedPlayers.forEach(({ manager, player }) => {
            this.byCode[player.code]?.addManager(manager);
        });
    }
}

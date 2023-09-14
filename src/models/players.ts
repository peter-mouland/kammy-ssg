// eslint-disable-next-line max-classes-per-file
import { Stats } from './stats';

import type { Position } from './position';
import type { Manager } from './managers';

type Options = { gameWeekIndex?: PlayerGameWeek['gameWeekIndex'] };
type PlayerGameWeekAPI = { fixtures: PlayerFixture[]; stats: Stats; id: number };
type PlayerAPI = Partial<Player> & { gameWeeks: PlayerGameWeekAPI[] };

class PlayerFixture {
    homeTeam: unknown;
    awayTeam: unknown;
    started: boolean;
    finished: boolean;
    homeGame: boolean;
    team_h_score: number;
    team_a_score: number;
    stats: Stats;
    constructor(playerFixture: PlayerFixture) {
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
    constructor(playerFixtures: PlayerFixture[] = []) {
        playerFixtures.forEach((playerFixture) => {
            this.all.push(new PlayerFixture(playerFixture));
        });
    }
}

class PlayerGameWeek {
    gameWeekIndex: number;
    fixtures: PlayerFixtures;
    stats: Stats;
    constructor(playerGameWeek: PlayerGameWeekAPI) {
        this.gameWeekIndex = playerGameWeek.id;
        this.fixtures = new PlayerFixtures(playerGameWeek.fixtures);
        this.stats = new Stats(playerGameWeek.stats);
    }
}

class PlayerGameWeeks {
    all: PlayerGameWeek[] = [];
    constructor(playerGameWeeks: PlayerGameWeekAPI[] = []) {
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

    gameWeeks: PlayerGameWeeks = [];
    seasonStats: Stats['all'] = [];
    fixtures: PlayerGameWeek['fixtures']['all'] = [];
    manager = {};
    form: number;
    formRank: number;
    code: number;
    photo: string;
    name: string;
    club: string;
    position: Position;
    positionId: Position['id'];
    new: boolean;
    url: string;
    rawData: unknown;

    constructor(player: PlayerAPI, options: Options = {}) {
        this.form = player.form;
        this.formRank = player.form_rank;
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
        }, []);
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

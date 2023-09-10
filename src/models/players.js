// eslint-disable-next-line max-classes-per-file
import { Stats } from './stats';

class PlayerFixture {
    constructor(playerFixture) {
        this.homeTeam = playerFixture.homeTeam;
        this.awayTeam = playerFixture.awayTeam;
        this.is_home = playerFixture.is_home;
        this.was_home = playerFixture.was_home;
        this.homeGame = playerFixture.was_home || playerFixture.is_home;
        this.team_h_score = playerFixture.team_h_score;
        this.team_a_score = playerFixture.team_a_score;
        this.stats = new Stats(playerFixture.stats);
    }
}

class PlayerFixtures {
    all = [];
    constructor(playerFixtures) {
        playerFixtures.forEach((playerFixture) => {
            this.all.push(new PlayerFixture(playerFixture));
        });
    }
}

class PlayerGameWeek {
    constructor(playerGameWeek) {
        this.fixtures = new PlayerFixtures(playerGameWeek.fixtures);
    }
}

class PlayerGameWeeks {
    all = [];
    constructor(playerGameWeeks = []) {
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

    gameWeeks = [];
    fixtures = [];

    constructor(player) {
        this.form = player.form;
        this.formRank = player.form_rank;
        this.code = player.code;
        this.name = player.name;
        this.club = player.club;
        this.positionId = player.positionId;
        this.new = player.new;
        this.url = player.url;
        this.rawData = player;
        this.seasonStats = new Stats(player.seasonStats);
        this.gameWeeks = new PlayerGameWeeks(player.gameWeeks);
        this.fixtures = this.gameWeeks.all.reduce((prev, curr) => {
            curr.fixtures.all.forEach((fixture) => {
                prev.push(fixture);
            });
            return prev;
        }, []);
    }

    getGameWeekFixtures(gameWeekIndex) {
        return this.gameWeeks[gameWeekIndex].fixtures;
    }

    getSeasonPoints() {
        return this.seasonStats;
    }
}

export class Players {
    all = [];
    byCode = {};
    constructor(players) {
        players.forEach((player) => {
            const player1 = new Player(player);
            this.all.push(player1);
            this.byCode[player1.code] = player1;
        });
    }
}

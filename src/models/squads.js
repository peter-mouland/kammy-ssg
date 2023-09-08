import warnings from './squad-helpers/index';

// eslint-disable-next-line max-classes-per-file
export class Stats {
    all = [];
    constructor(stats = {}) {
        this.points = { id: 'points', label: 'Points', displayOrder: 0, value: stats.points };
        this.apps = { id: 'apps', label: 'Mins', displayOrder: 1, value: stats.apps };
        this.gls = { id: 'gls', label: 'Gls', displayOrder: 2, value: stats.gls };
        this.asts = { id: 'asts', label: 'Asts', displayOrder: 3, value: stats.asts };
        this.cs = { id: 'cs', label: 'Cs', displayOrder: 4, value: stats.cs };
        this.con = { id: 'con', label: 'Con', displayOrder: 5, value: stats.con };
        this.pensv = { id: 'pensv', label: 'Pensv', displayOrder: 6, value: stats.pensv };
        this.ycard = { id: 'ycard', label: 'YCard', displayOrder: 7, value: stats.ycard };
        this.rcard = { id: 'rcard', label: 'RCard', displayOrder: 8, value: stats.rcard };
        this.bp = { id: 'bp', label: 'Bp', displayOrder: 8, value: stats.bp };
        this.sb = { id: 'sb', label: 'Cv', displayOrder: 9, value: stats.sb };

        this.all = [
            this.points,
            this.apps,
            this.gls,
            this.asts,
            this.cs,
            this.con,
            this.pensv,
            this.ycard,
            this.rcard,
            this.bp,
            this.sb,
        ];
    }
}

export class SquadPlayer {
    warnings = [];
    constructor(squadPlayer) {
        this.managerId = squadPlayer.manager.id;
        this.hasChanged = squadPlayer.hasChanged;
        this.name = squadPlayer.player.name;
        this.code = squadPlayer.player.code;
        this.url = squadPlayer.player.url;
        this.club = squadPlayer.player.club;
        this.squadPositionId = squadPlayer.squadPositionId.toLowerCase(); // todo: use id in scoring
        this.positionId = squadPlayer.positionId.toLowerCase(); // todo: use id in scoring
        this.squadPositionIndex = squadPlayer.squadPositionIndex;
        this.nextGameWeekFixtures = squadPlayer.player.nextGameWeekFixture.fixtures || [];
        this.seasonToGameWeek = new Stats(squadPlayer.seasonToGameWeek);
        this.gameWeekStats = new Stats(squadPlayer.gameWeekStats);
    }

    addWarning({ attr, value }) {
        this.warnings.push({ attr, value });
    }

    hasWarnings(SquadWarnings, DivisionWarnings) {
        const squadWarning =
            SquadWarnings.filter(
                (warning) =>
                    (warning.attr === 'club' && warning.value === this.club) ||
                    (warning.attr === 'position' && warning.value === this.code) ||
                    (warning.attr === 'new' && warning.value === this.code),
            ).length > 0;
        const duplicatePlayer = DivisionWarnings.duplicatePlayers.includes(this.code);
        return squadWarning || duplicatePlayer;
    }
}

export class Squad {
    warnings = [];
    players = [];
    constructor(squadPlayers) {
        this.managerId = squadPlayers[0].manager.id;
        squadPlayers.forEach((squadPlayer) => {
            this.players.push(new SquadPlayer(squadPlayer));
        });
        this.players = this.players.sort((a, z) => a.squadPositionIndex - z.squadPositionIndex);
        // this.url = `/${url}`;
    }

    addWarning({ attr, value }) {
        this.warnings.push({ attr, value });
    }
}

// allSquads within a division
export default class Squads {
    all = [];
    allPlayers = [];
    byManagerId = {};
    warnings = {};
    constructor(squads) {
        squads.forEach(({ squadPlayers }) => {
            const squad = new Squad(squadPlayers);
            this.byManagerId[squad.managerId] = squad;
            this.allPlayers.push(...squad.players);
            this.all.push(squad);
        });

        this.warnings = warnings(this);
    }
}

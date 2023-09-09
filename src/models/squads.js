// eslint-disable-next-line max-classes-per-file
import warnings from './squad-helpers/index';
import { Stats } from './stats';

export class SquadPlayer {
    warnings = [];
    constructor(squadPlayer) {
        this.managerId = squadPlayer.manager.managerId;
        this.hasChanged = squadPlayer.hasChanged;
        this.name = squadPlayer.player.name;
        this.code = squadPlayer.player.code;
        this.url = squadPlayer.player.url;
        this.club = squadPlayer.player.club;
        this.squadPositionId = squadPlayer.squadPositionId.toLowerCase(); // todo: use id in scoring
        this.playerPositionId = squadPlayer.playerPositionId.toLowerCase(); // todo: use id in scoring
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
    byCode = {};
    constructor(squadPlayers) {
        this.managerId = squadPlayers[0].manager.managerId;
        this.manager = squadPlayers[0].manager;
        squadPlayers.forEach((squadPlayer) => {
            const member = new SquadPlayer(squadPlayer);
            this.players.push(member);
            this.byCode[member.code] = member;
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

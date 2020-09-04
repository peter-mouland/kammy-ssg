const calculateSeasonStats = require('./calculate-season');
const { playerStats: getPlayerStats } = require('./player-stats');

const UNKNOWN_PLAYER = (player) => ({
    ...player,
    name: player.name || player.player,
    fixtures: [],
    club: '',
    code: 0,
});

class TeamSeason {
    constructor({ manager, division, gameWeeks, players }) {
        this.players = players;
        this.manager = manager;
        this.gameWeeks = gameWeeks;
        this.division = division;
    }

    getPlayer(player) {
        return this.players[player.name || player.player] || UNKNOWN_PLAYER(player);
    }

    getSeason() {
        const { gameWeeks, manager, division } = this;
        const players = Array(12).fill({});
        const results = [];

        gameWeeks.forEach(({ players: gwPlayers, ...gameWeekObj }) => {
            const { gameWeek } = gameWeekObj;
            const managerPlayers = gwPlayers.filter(({ manager: playerManager }) => manager === playerManager);
            managerPlayers.forEach((player, i) => {
                const playerGws = players[i].player || [];
                const seasonToGameWeek = players[i].seasonToGameWeek || [];
                playerGws[gameWeek] = getPlayerStats({ player: this.getPlayer(player), gameWeeks: [gameWeekObj] });
                seasonToGameWeek[gameWeek] = calculateSeasonStats(playerGws.slice(0, gameWeek + 1));

                players[i] = {
                    player: playerGws,
                    seasonToGameWeek,
                };
                results.push({
                    teamPos: player.teamPos,
                    posIndex: i,
                    pos: player.pos,
                    manager,
                    division,
                    gameWeek,
                    playerName: players[i].player[gameWeek].name,
                    gameWeekStats: players[i].player[gameWeek].gameWeekStats,
                    seasonToGameWeek: players[i].seasonToGameWeek[gameWeek],
                });
            });
        });
        return results;
    }
}

module.exports = {
    TeamSeason,
    UNKNOWN_PLAYER,
};

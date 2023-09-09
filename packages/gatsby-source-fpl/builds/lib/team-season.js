const calculateSeasonStats = require('./calculate-season');
const { getPlayerStats } = require('./player-stats');

const UNKNOWN_PLAYER = (player) => ({
    ...player,
    name: player.name || player.player,
    fixtures: [],
    club: '',
    code: 0,
});

class TeamSeason {
    constructor({ managerId, divisionId, gameWeeks, playersByCode, fplTeams }) {
        this.players = playersByCode;
        this.managerId = managerId;
        this.gameWeeks = gameWeeks;
        this.divisionId = divisionId;
        this.fplTeams = fplTeams;
    }

    getPlayer(player) {
        // if (!this.players[player.code]) {
        //     console.log(player.code);
        //     console.log(`unknown player code ${player.code}`);
        // }
        return this.players[player.code] || UNKNOWN_PLAYER(player);
    }

    getSeason() {
        const { gameWeeks, managerId, divisionId, fplTeams } = this;
        const players = Array(12).fill({});
        const results = [];

        gameWeeks.forEach(({ players: gwPlayers, ...gameWeekObj }) => {
            const { gameWeekIndex } = gameWeekObj;
            const previousWeek = gameWeeks[gameWeekIndex - 1];
            const managerPlayers = gwPlayers.filter(({ managerId: playerManager }) => managerId === playerManager);
            const previousSquad = previousWeek?.players.filter(
                ({ managerId: playerManager }) => managerId === playerManager,
            );

            managerPlayers.forEach((player, i) => {
                const playerChanged = !previousWeek ? false : previousSquad[i]?.code !== player.code;
                const playerGws = players[i].player || [];
                const seasonToGameWeek = players[i].seasonToGameWeek || [];
                const player1 = this.getPlayer(player);

                playerGws[gameWeekIndex] = getPlayerStats({
                    player: player1,
                    gameWeek: gameWeekObj,
                    fplTeams,
                });
                seasonToGameWeek[gameWeekIndex] = calculateSeasonStats(
                    playerGws.slice(0, gameWeekIndex + 1),
                    player.positionId,
                );

                players[i] = {
                    player: playerGws,
                    seasonToGameWeek,
                };
                results.push({
                    squadPositionId: player.squadPositionId,
                    squadPositionIndex: i,
                    playerPositionId: player.positionId,
                    hasChanged: playerChanged,
                    managerId,
                    divisionId,
                    gameWeekIndex,
                    playerCode: players[i].player[gameWeekIndex].code,
                    gameWeekStats: players[i].player[gameWeekIndex].gameWeekStats,
                    seasonToGameWeek: players[i].seasonToGameWeek[gameWeekIndex],
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

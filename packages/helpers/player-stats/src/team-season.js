const calculateSeasonStats = require('./calculateSeason');
const { playerStats: getPlayerStats } = require('./index');

const UNKNOWN_PLAYER = (player) => ({
  ...player,
  name: player.name || player.player,
  fixtures: [],
  club: '',
  code: 0,
});

class TeamSeason {
  constructor({
    manager, gameWeeks, players,
  }) {
    this.players = players;
    this.manager = manager;
    this.gameWeeks = gameWeeks;
  }

  getPlayer(player) {
    return this.players[player.name || player.player] || UNKNOWN_PLAYER(player)
  }

  // out:
  //  [{
  //     teamPos, // GK, CB, CB, ..., SUB
  //     pos, // GK, CB, CB, ..., STR
  //     gameWeeks: [  // * 40
  //       {
  //         player,
  //         gameWeekStats: [ stats ],
  //         gameWeekPoints: [ stats ],
  //       }
  //     ],
  //     seasonStats: [ stats ],
  //     seasonPoints: [ stats ],
  //   }]
  getSeason() {
    const { gameWeeks, manager } = this;
    const players = Array(12).fill({});

    gameWeeks.forEach(({ players: gwPlayers, ...gameWeek }) => {
      const managerPlayers = gwPlayers.filter(({ manager: playerManager }) => manager === playerManager);
      managerPlayers.forEach((player, i) => {
        const playerGws = (players[i].gameWeeks || []);
        const seasonToGameWeek = (players[i].seasonToGameWeek || []);
        playerGws[gameWeek.gameWeek] = getPlayerStats({ player: this.getPlayer(player), gameWeeks: [gameWeek] });
        seasonToGameWeek[gameWeek.gameWeek] = calculateSeasonStats(playerGws.slice(0, gameWeek.gameWeek + 1));

        players[i] = {
          ...players[i],
          teamPos: player.teamPos,
          posIndex: i,
          pos: player.pos,
          gameWeeks: playerGws,
          seasonToGameWeek,
        };
      });
    });

    return players;
    // return players.map((player) => ({
    //   ...player,
    //   seasonStats: calculateSeasonStats(player.gameWeeks),
    // }));
  }
}


module.exports = {
  TeamSeason,
  UNKNOWN_PLAYER,
};

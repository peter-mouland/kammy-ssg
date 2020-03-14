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
  constructor({ manager, division, gameWeeks, players }) {
    this.players = players;
    this.manager = manager;
    this.gameWeeks = gameWeeks;
    this.division = division;
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
    const { gameWeeks, manager, division } = this;
    const players = Array(12).fill({});
    const results = [];

    gameWeeks.forEach(({ players: gwPlayers, ...gameWeek }) => {
      const managerPlayers = gwPlayers.filter(({ manager: playerManager }) => manager === playerManager);
      managerPlayers.forEach((player, i) => {
        const playerGws = (players[i].player || []);
        const seasonToGameWeek = (players[i].seasonToGameWeek || []);
        playerGws[gameWeek.gameWeek] = getPlayerStats({ player: this.getPlayer(player), gameWeeks: [gameWeek] });
        seasonToGameWeek[gameWeek.gameWeek] = calculateSeasonStats(playerGws.slice(0, gameWeek.gameWeek + 1));

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
          gameWeek: gameWeek.gameWeek,
          playerName: players[i].player[gameWeek.gameWeek].name,
          gameWeekStats: players[i].player[gameWeek.gameWeek].gameWeekStats,
          seasonToGameWeek: players[i].seasonToGameWeek[gameWeek.gameWeek],
        })
      });
    });
    return results;
    // return players;
    // return players.reduce((prev, { seasonToGameWeek, ...player}) => ([
    //   ...prev,
    //   ...seasonToGameWeek.map((season) => ({ ...player, gameWeek: season.gameWeek, seasonToGameWeek: season }))
    // ]), []);
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

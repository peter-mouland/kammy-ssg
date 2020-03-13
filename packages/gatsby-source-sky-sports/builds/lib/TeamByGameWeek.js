const UNKNOWN_PLAYER = (name) => ({
  name: `UNKNOWN: ${name}`,
  club: '',
  code: 0,
  gameWeeks: [],
});

class TeamByGameWeek {
  constructor({ gameWeeks, players, transfers, draft }) {
    this.transfers = transfers || []; // not all managers would have made transfers
    this.gameWeeks = gameWeeks;
    this.players = players;
    this.draft = draft;
    this.endOfSeason = new Date(gameWeeks[gameWeeks.length - 1].end).setHours(23, 59, 59, 999);
    this.startOfSeason = new Date(gameWeeks[0].start).setHours(0, 0, 0, 0);
  }

  getPlayer = (Player) => {
    const player = { ...(this.players[Player.player || Player.name] || UNKNOWN_PLAYER(Player.player || Player.name)) };
    return {
      name: Player.player || player.name,
      club: player.club,
      code: player.code,
      pos: player.pos,
      seasonStats: player.season, // Stats: { points, sb, tb, rcard, ycard, pensv, con, cs, asts, gls, subs, apps
      gameWeekStats: player.gameWeek, // Stats: { points, sb, tb, rcard, ycard, pensv, con, cs, asts, gls, subs, apps }
      gameWeeks: player.gameWeeks, // [ { stats: {}, fixtures: [] } ]
      // fixtures: player.fixtures, // [Fixture: { hScore... } ]
    };
  };

  /*
   PURPOSE: to find a transfer list of players
   OUTPUT:
    [ player ]
  */
  findPlayerThisGw = ({ draftPlayer, gameWeek }) => {
    const transferList = this.getTransferList(draftPlayer);
    const gwPlayers = transferList.filter((transfer) => transfer.start < new Date(gameWeek.start));
    const player = gwPlayers.length ? gwPlayers[gwPlayers.length - 1].player || UNKNOWN_PLAYER() : UNKNOWN_PLAYER();
    return this.getPlayer(player);
  };

  /*
   PURPOSE: to find a transfer list of players
   OUTPUT:
    [
      { player, start, end }
    ]
  */
  getTransferList = (player) => {
    const {
      players, startOfSeason, endOfSeason, transfers,
    } = this;
    let playerInPosition = this.getPlayer(player);
    const playerTransfers = [{
      player: playerInPosition,
      playerOut: null,
      start: startOfSeason,
      type: 'draft',
    }];

    transfers
      .filter((transfer) => (
        transfer.type !== 'Waiver Request'
        && (transfer.type !== 'Waiver')
        && (transfer.type !== 'New Player')
        && players[transfer.transferIn]
        && players[transfer.transferOut]
      ))
      .forEach((transfer) => {
        if (transfer.type === 'Swap' && transfer.transferIn === playerInPosition.name) {
          playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
          playerTransfers.push({
            player: players[transfer.transferOut],
            playerOut: players[transfer.transferIn],
            start: new Date(transfer.timestamp),
            type: transfer.type,
          });
          playerInPosition = players[transfer.transferOut];
        } else if (transfer.transferOut === playerInPosition.name) {
          playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
          playerTransfers.push({
            player: players[transfer.transferIn],
            playerOut: players[transfer.transferOut],
            start: new Date(transfer.timestamp),
            type: transfer.type,
          });
          playerInPosition = players[transfer.transferIn];
        }
      });

    playerTransfers[playerTransfers.length - 1].end = endOfSeason;
    return playerTransfers;
  };

  getSeason = () => {
    const { draft, gameWeeks } = this;

    return gameWeeks.map((gameWeek) => {
      const players = draft.map((draftPlayer) => {
        const player = this.findPlayerThisGw({ draftPlayer, gameWeek });
        return {
          ...player,
          gameWeek,
          manager: draftPlayer.manager,
          teamPos: draftPlayer.position,
        };
      });
      return {
        ...gameWeek,
        players,
      };
    });
  }
}

module.exports = TeamByGameWeek;

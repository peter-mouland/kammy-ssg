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
        const playerName = Player.playerName || Player.player || Player.name;
        const player = {
            ...(this.players[playerName] || UNKNOWN_PLAYER(playerName)),
        };
        return {
            name: playerName,
            club: player.club,
            code: player.code,
            pos: player.pos,
            seasonStats: player.season, // Stats: points, sb, tb, rcard, ycard, pensv, con, cs, asts, gls, subs, apps
            gameWeekStats: player.gameWeek, // Stats:points, sb, tb, rcard, ycard, pensv, con, cs, asts, gls, subs, apps
            gameWeeks: player.gameWeeks, // [ { stats: {}, fixtures: [] } ]
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
        const { players, startOfSeason, endOfSeason, transfers } = this;
        let playerInPosition = this.getPlayer(player);
        const playerTransfers = [
            {
                player: playerInPosition,
                playerOut: null,
                start: startOfSeason,
                type: 'draft',
            },
        ];

        transfers
            .filter(
                (transfer) =>
                    transfer.type !== 'Waiver Request' &&
                    transfer.type !== 'Waiver' &&
                    transfer.type !== 'New Player' &&
                    players[transfer.transferInName] &&
                    players[transfer.transferOutName],
            )
            .forEach((transfer) => {
                if (transfer.type === 'Swap' && transfer.transferInName === playerInPosition.name) {
                    playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
                    playerTransfers.push({
                        player: players[transfer.transferOutName],
                        playerOut: players[transfer.transferInName],
                        start: new Date(transfer.timestamp),
                        type: transfer.type,
                    });
                    playerInPosition = players[transfer.transferOutName];
                } else if (transfer.transferOutName === playerInPosition.name) {
                    playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
                    playerTransfers.push({
                        player: players[transfer.transferInName],
                        playerOut: players[transfer.transferOutName],
                        start: new Date(transfer.timestamp),
                        type: transfer.type,
                    });
                    playerInPosition = players[transfer.transferInName];
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
    };
}

module.exports.TeamByGameWeek = TeamByGameWeek;
module.exports.UNKNOWN_PLAYER = UNKNOWN_PLAYER;

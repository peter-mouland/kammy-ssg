const UNKNOWN_PLAYER = (name) => ({
    name: `UNKNOWN: ${name}`,
    club: '',
    code: 0,
    gameWeeks: [],
});

class TeamByGameWeek {
    constructor({ gameWeeks, playersByCode, transfers, draft, debug = false }) {
        this.transfers = transfers || []; // not all managers would have made transfers
        this.gameWeeks = gameWeeks;
        this.players = playersByCode;
        this.draft = draft;
        this.endOfSeason = new Date(gameWeeks[gameWeeks.length - 1].end).setHours(23, 59, 59, 999);
        this.startOfSeason = new Date(gameWeeks[0].start).setHours(0, 0, 0, 0);
        if (debug) console.log(this.transfers);
    }

    getPlayer = (draftPlayer) => {
        if (!this.players[draftPlayer.playerCode]) {
            console.log(`TeamByGameWeek: unknown player`);
            console.log(draftPlayer);
            process.exit(1);
        }
        return this.players[draftPlayer.playerCode]; // || UNKNOWN_PLAYER(playerCode)),
    };

    /*
   PURPOSE: to find a transfer list of players
   OUTPUT:
    [ player ]
  */
    findPlayerThisGw = ({ draftPlayer, gameWeek }) => {
        const transferList = this.getTransferList(draftPlayer);
        const gwChanges = transferList.filter((transfer) => transfer.start < new Date(gameWeek.start));
        const player = gwChanges.length ? gwChanges[gwChanges.length - 1].player || UNKNOWN_PLAYER() : UNKNOWN_PLAYER();
        if (!player.code) {
            console.log('findPlayerThisGw: unknown player');
            console.log(player);
            process.exit(1);
        }
        return player;
    };

    /*
   PURPOSE: to find a transfer list of players
   OUTPUT:
    [
      { player, start, end }
    ]
  */
    getTransferList = (draftPlayer) => {
        let playerInPosition = this.getPlayer(draftPlayer);
        if (this.debug) console.log(playerInPosition);

        const playerTransfers = [
            {
                player: playerInPosition,
                playerOut: null,
                start: this.startOfSeason,
                type: 'draft',
            },
        ];

        this.transfers
            .filter(
                (transfer) =>
                    transfer.type !== 'Waiver Request' &&
                    transfer.type !== 'Waiver' &&
                    transfer.type !== 'New Player' &&
                    this.players[transfer.codeIn] &&
                    this.players[transfer.codeOut],
            )
            .forEach((transfer) => {
                if (transfer.type === 'Swap' && String(transfer.codeIn) === String(playerInPosition.code)) {
                    playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
                    playerTransfers.push({
                        player: this.players[transfer.codeOut],
                        playerOut: this.players[transfer.codeIn],
                        start: new Date(transfer.timestamp),
                        type: transfer.type,
                    });
                    playerInPosition = this.players[transfer.codeOut];
                } else if (String(transfer.codeOut) === String(playerInPosition.code)) {
                    playerTransfers[playerTransfers.length - 1].end = new Date(transfer.timestamp);
                    playerTransfers.push({
                        player: this.players[transfer.codeIn],
                        playerOut: this.players[transfer.codeOut],
                        start: new Date(transfer.timestamp),
                        type: transfer.type,
                    });
                    playerInPosition = this.players[transfer.codeIn];
                }
            });

        playerTransfers[playerTransfers.length - 1].end = this.endOfSeason;
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
                    managerId: draftPlayer.managerId,
                    squadPositionId: draftPlayer.squadPositionId,
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

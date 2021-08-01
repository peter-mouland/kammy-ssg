const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ fplPlayers, players }) => {
    const logEnd = logger.timed('Build: Admin Players List');

    const allPlayers = fplPlayers.map(({ data: player }) => {
        const gsheetsPlayer = players.find(({ data: { code } }) => code === player.code) || {};

        const data = {
            ...player,
            ...gsheetsPlayer.data,
            isInGSheets: !!gsheetsPlayer,
        };

        return {
            resourceId: `admin-players-list-${data.code}`,
            data,
            internal: {
                description: 'FPL data With GSheets Data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.adminPlayersList,
            },
        };
    });
    logEnd();
    return allPlayers;
};

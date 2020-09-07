const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ skyPlayers, players }) => {
    const logEnd = logger.timed('Build: Admin Players List');

    const allPlayers = skyPlayers.map(({ data: player }) => {
        const gsheetsPlayer = players.find(({ data: { name } }) => name === player.name) || {};

        const data = {
            ...player,
            ...gsheetsPlayer.data,
            isInGSheets: !!gsheetsPlayer,
        };

        return {
            resourceId: `admin-players-list-${data.name}`,
            data,
            internal: {
                description: 'Sky Sports data With GSheets Data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.adminPlayersList,
            },
        };
    });
    logEnd();
    return allPlayers;
};

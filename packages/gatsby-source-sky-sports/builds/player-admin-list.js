const { nodeTypes, mediaTypes } = require('../lib/constants');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

module.exports = ({ skyPlayers, players }) => {
    console.log('Build: Admin Players List start');
    const start = new Date();

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
    console.log('Build: Admin Players List end: ', new Date() - start);
    return allPlayers;
};

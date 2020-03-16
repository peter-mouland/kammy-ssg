const { nodeTypes, mediaTypes } = require('../lib/constants');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

module.exports = ({ skySportsPlayerData }) => skySportsPlayerData
    .map((player) => {
        const data = {
            ...player,
            name: `${player.sName}, ${player.fName}`.trim(),
            code: parseInt(player.id, 10),
            pos: player.group.toUpperCase(),
            club: toTitleCase(player.tName),
            value: parseFloat(player.value),
            stats: player.stats,
            fixtures: player.fixtures,
            tCode: player.tCode,
        };
        return {
            resourceId: `skysports-players-${data.name}`,
            data,
            internal: {
                description: 'Sky Sports data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsPlayers,
            },
        };
    });

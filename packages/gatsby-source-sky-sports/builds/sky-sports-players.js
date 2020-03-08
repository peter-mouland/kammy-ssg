const { nodeTypes, mediaTypes } = require('../lib/constants');

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

module.exports = ({ playerData }) => {
  return playerData
    .map((player) => {
        const data = {
          name: `${player.sName}, ${player.fName}`.trim(),
          code: parseInt(player.id, 10),
          skySportsPosition: player.group.toUpperCase(),
          skySportsClub: toTitleCase(player.tName),
          value: parseFloat(player.value),
          stats: player.stats,
          new: false,
          isHidden: false,
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
};


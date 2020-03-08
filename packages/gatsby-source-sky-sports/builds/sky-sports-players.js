const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ playerData }) => {
  return playerData.map((data) => {
        return {
            resourceId: `skysports-player-${data.id}-${data.locale}`,
            data: {
                ...data,
            },
            internal: {
                description: 'Sky Sports player data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsPlayers,
            },
        };
    });
};


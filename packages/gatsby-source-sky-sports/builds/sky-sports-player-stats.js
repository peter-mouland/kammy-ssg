const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ skyPlayerStatsData, createNodeId }) => {
  return skyPlayerStatsData
    .map((player) => {
        const data = {
          ...player,
          name: `${player.sName}, ${player.fName}`.trim(),
          code: parseInt(player.id, 10),
        };
        return {
            resourceId: `skysports-player-stats-${player.code}`,
            data: {
              ...data,
              player___NODE: createNodeId(`skysports-players-${data.name}`),
            },
            internal: {
                description: 'Sky Sports data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsPlayerStats,
            },
        };
    });
};


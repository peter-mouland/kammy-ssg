const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleDraftData, createNodeId }) => {
  return googleDraftData.map((item) => {
      const data = {
        manager: item.manager,
        division: item.division,
        player: item.player,
        position: item.position,
      };
      return {
          resourceId: `draft-${data.manager}-${data.player}`,
          data: {
            ...data,
            division___NODE: createNodeId(`divisions-${data.division}`),
            player___NODE: createNodeId(`players-${data.player}`),
          },
          internal: {
              description: 'Draft',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.draft,
          },
      };
  });
};


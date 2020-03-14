const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleManagerData, createNodeId }) => {
  return googleManagerData.map(({ manager, division }) => {
      const data = {
        manager,
        division,
      };
      return {
          resourceId: `managers-${manager}`,
          data: {
            ...data,
            division___NODE: createNodeId(`divisions-${division}`),
          },
          internal: {
              description: 'Managers',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.managers,
          },
      };
  });
};


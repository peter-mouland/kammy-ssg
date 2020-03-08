const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleManagerData }) => {
  return googleManagerData.map(({ manager, division }) => {
      const data = {  manager, division };
      return {
          resourceId: `managers-${data.manager}-${data.division}`,
          data,
          internal: {
              description: 'Managers',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.managers,
          },
      };
  });
};


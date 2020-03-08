const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleDivisionData }) => {
  return googleDivisionData.map(({ label, order }) => {
      const data = {
        label,
        order
      };
      return {
          resourceId: `divisions-${data.label}`,
          data,
          internal: {
              description: 'Divisions',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.divisions,
          },
      };
  });
};


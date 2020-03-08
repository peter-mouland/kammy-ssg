const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ fixtureData }) => {
  return fixtureData.map((data) => {
        return {
            resourceId: `skysports-fixtures-${data.id}-${data.locale}`,
            data: {
                ...data,
            },
            internal: {
                description: 'Sky Sports Fixtures',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsFixtures,
            },
        };
    });
};


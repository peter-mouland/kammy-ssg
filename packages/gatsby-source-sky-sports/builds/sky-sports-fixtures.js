const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ skySportsFixtureData }) =>
    skySportsFixtureData.map((data) => ({
        resourceId: `skysports-fixtures-${data.id}-${data.locale}`,
        data: {
            ...data,
        },
        internal: {
            description: 'Sky Sports Fixtures',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.skySportsFixtures,
        },
    }));

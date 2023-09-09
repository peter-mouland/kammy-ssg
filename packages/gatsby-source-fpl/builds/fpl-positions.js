const { nodeTypes, mediaTypes } = require('../lib/constants');

// eslint-disable-next-line camelcase
module.exports = ({ element_types }) =>
    element_types.map((data) => ({
        resourceId: `fpl-positions-${data.id}-${data.locale}`,
        data: {
            ...data,
            position: data.singular_name_short,
        },
        internal: {
            description: 'Fantasy Premier League positions',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplPositions,
        },
    }));

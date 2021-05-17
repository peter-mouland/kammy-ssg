const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

// eslint-disable-next-line camelcase
module.exports = ({ element_types }) =>
    element_types.map((data) => ({
        resourceId: `fpl-positions-${data.id}-${data.locale}`,
        data: {
            ...data,
            date: getGmtDate(data.date),
        },
        internal: {
            description: 'Fantasy Premier League positions',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplPositions,
        },
    }));

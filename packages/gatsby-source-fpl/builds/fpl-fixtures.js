const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ fixtures }) =>
    fixtures.map((data) => ({
        resourceId: `fpl-fixtures-${data.id}-${data.locale}`,
        data: {
            ...data,
            date: getGmtDate(data.date),
        },
        internal: {
            description: 'Fantasy Premier League Fixtures',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplFixtures,
        },
    }));

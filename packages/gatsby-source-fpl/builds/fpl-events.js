const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ events }) =>
    events.map((data) => ({
        resourceId: `fpl-events-${data.id}-${data.locale}`,
        data: {
            ...data,
            date: getGmtDate(data.date),
        },
        internal: {
            description: 'Fantasy Premier League Events',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplEvents,
        },
    }));

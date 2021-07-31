const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ events }) =>
    events.map((data) => ({
        resourceId: `fpl-events-${data.id}`,
        data: {
            ...data,
            date: getGmtDate(data.deadline_time),
        },
        internal: {
            description: 'Fantasy Premier League Events',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplEvents,
        },
    }));

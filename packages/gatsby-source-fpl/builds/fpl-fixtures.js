const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ fixtures }) =>
    fixtures.map((data) => ({
        resourceId: `fpl-fixtures-${data.id}`,
        data: {
            ...data,
            date: new Date(getGmtDate(data.kickoff_time)),
        },
        internal: {
            description: 'Fantasy Premier League Fixtures',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplFixtures,
        },
    }));

const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ teams }) =>
    teams.map((data) => ({
        resourceId: `fpl-teams-${data.id}-${data.locale}`,
        data: {
            ...data,
            date: getGmtDate(data.date),
        },
        internal: {
            description: 'Fantasy Premier League Teams',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplTeams,
        },
    }));

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ teams }) =>
    teams.map((data) => ({
        resourceId: `fpl-teams-${data.id}`,
        data: {
            ...data,
            team_id: data.id,
        },
        internal: {
            description: 'Fantasy Premier League Teams',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplTeams,
        },
    }));

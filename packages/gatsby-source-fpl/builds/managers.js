const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleManagerData, createNodeId }) =>
    googleManagerData.map((manager) => {
        const managerId = manager.manager.replace(/ /g, '-').toLowerCase();
        const data = {
            managerId,
            label: manager.manager,
            url: `/manager/${managerId}`,
            divisionId: manager.division,
        };
        return {
            resourceId: `managers-${managerId}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.divisionId}`),
            },
            internal: {
                description: 'Managers',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.managers,
            },
        };
    });

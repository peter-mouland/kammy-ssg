const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleManagerData, createNodeId }) =>
    googleManagerData.map(({ manager, division }) => {
        const managerKey = manager.toLowerCase().replace(/ /g, '-');
        const data = {
            manager,
            managerKey,
            url: `/manager/${managerKey}`,
            divisionKey: division,
        };
        return {
            resourceId: `managers-${manager}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${division}`),
            },
            internal: {
                description: 'Managers',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.managers,
            },
        };
    });

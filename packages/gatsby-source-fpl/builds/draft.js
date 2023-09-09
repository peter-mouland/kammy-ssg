const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleDraftData, createNodeId }) => {
    const logEnd = logger.timed('Build: Draft');

    const draft = googleDraftData.map((item) => {
        const data = {
            managerId: item.manager.toLowerCase().replace(/ /g, '-'),
            squadPositionId: item.position.toLowerCase(),
            divisionId: item.divisionId,
            playerCode: parseInt(item.code, 10),
        };

        return {
            resourceId: `draft-${data.managerId}-${data.playerCode}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.divisionId}`),
                player___NODE: createNodeId(`players-${data.playerCode}`),
            },
            internal: {
                description: 'Draft',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.draft,
            },
        };
    });

    logEnd();
    return draft;
};

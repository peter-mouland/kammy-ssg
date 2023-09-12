const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleDraftData, createNodeId }) => {
    const logEnd = logger.timed('Build: Draft');
    const draft = googleDraftData.map((item) => {
        const managerId = item.manager.toLowerCase().replace(/ /g, '-');
        return {
            resourceId: `draft-${managerId}-${item.code}`,
            data: {
                managerId,
                squadPositionId: item.position.toLowerCase(),
                divisionId: item.divisionId,
                playerCode: parseInt(item.code, 10),
                division___NODE: createNodeId(`divisions-${item.divisionId}`),
                player___NODE: createNodeId(`players-${item.code}`),
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

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleDraftData, createNodeId }) => {
    const logEnd = logger.timed('Build: Draft');

    const draft = googleDraftData.map((item) => {
        const data = {
            manager: item.manager,
            position: item.position,
            divisionName: item.division,
            playerCode: item.code,
        };

        return {
            resourceId: `draft-${data.manager}-${data.playerCode}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.divisionName}`),
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

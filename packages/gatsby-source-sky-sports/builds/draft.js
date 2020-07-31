const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleDraftData, createNodeId }) => {
    console.log('Build: Draft start');
    const start = new Date();

    const draft = googleDraftData.map((item) => {
        const data = {
            manager: item.manager,
            position: item.position,
            divisionName: item.division,
            playerName: item.player,
        };

        return {
            resourceId: `draft-${data.manager}-${data.playerName}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.divisionName}`),
                player___NODE: createNodeId(`players-${data.playerName}`),
            },
            internal: {
                description: 'Draft',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.draft,
            },
        };
    });

    console.log('Build: Draft end: ', new Date() - start);
    return draft;
};

const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ skySportsScoreData }) =>
    skySportsScoreData.map((data) => ({
        resourceId: `fpl-scores-${data.id}-${data.locale}`,
        data: {
            ...data,
        },
        internal: {
            description: 'FPL Live Score data',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.fplScores,
        },
    }));

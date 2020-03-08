const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ scoreData }) => {
  return scoreData.map((data) => {
        return {
            resourceId: `skysports-scores-${data.id}-${data.locale}`,
            data: {
                ...data,
            },
            internal: {
                description: 'Sky Sports Live Score data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsScores,
            },
        };
    });
};


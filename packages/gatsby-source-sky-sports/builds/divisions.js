const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleDivisionData }) => googleDivisionData.map(({ id, label, order }) => {
    const data = {
        key: id,
        label,
        order,
    };
    return {
        resourceId: `divisions-${data.key}`,
        data,
        internal: {
            description: 'Divisions',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.divisions,
        },
    };
});

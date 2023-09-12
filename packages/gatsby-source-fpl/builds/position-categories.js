const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');
const { positionCategories } = require('./lib/positions');

module.exports = () => {
    const logEnd = logger.timed('Build: Positions Categories');

    const nodes = positionCategories.map((position) => ({
        resourceId: `position-category-${position.categoryId}`,
        data: position,
        internal: {
            description: 'Position Categories',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.positionCategories,
        },
    }));
    logEnd();
    return nodes;
};

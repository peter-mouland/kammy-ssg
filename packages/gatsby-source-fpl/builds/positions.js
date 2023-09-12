const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');
const { positions } = require('./lib/positions');

module.exports = ({ createNodeId }) => {
    const logEnd = logger.timed('Build: Posiitons');

    const nodes = positions.map((position) => {
        // eslint-disable-next-line no-param-reassign
        position.category___NODE = createNodeId(`position-category-${position.category}`);
        return {
            resourceId: `positions-${position.positionId}`,
            data: position,
            internal: {
                description: 'Positions',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.positions,
            },
        };
    });
    logEnd();
    return nodes;
};

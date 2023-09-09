const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleTransferData, createNodeId }) => {
    const logEnd = logger.timed('Build: Transfers');

    const transfers = googleTransferData
        .sort((t1, t2) => new Date(t1.timestamp) - new Date(t2.timestamp))
        .map((data) => ({
            resourceId: `transfers-${String(data.timestamp)}-${data.managerId}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.divisionId}`),
                manager___NODE: createNodeId(`managers-${data.managerId}`),
                playerIn___NODE: createNodeId(`players-${data.codeIn}`),
                playerOut___NODE: createNodeId(`players-${data.codeOut}`),
            },
            internal: {
                description: 'Transfers',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.transfers,
            },
        }));
    logEnd();
    return transfers;
};

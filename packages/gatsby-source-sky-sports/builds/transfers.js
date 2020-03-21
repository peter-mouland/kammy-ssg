const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleTransferData, createNodeId }) => googleTransferData
    .sort((t1, t2) => (new Date(t1.timestamp) - new Date(t2.timestamp)))
    .map((transfer) => {
        const data = transfer;
        return {
            resourceId: `transfers-${String(data.timestamp)}-${data.manager}`,
            data: {
                ...data,
                division___NODE: createNodeId(`divisions-${data.division}`),
                manager___NODE: createNodeId(`managers-${data.manager}`),
                transferIn___NODE: createNodeId(`players-${data.transferIn}`),
                transferOut___NODE: createNodeId(`players-${data.transferOut}`),
            },
            internal: {
                description: 'Transfers',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.transfers,
            },
        };
    });

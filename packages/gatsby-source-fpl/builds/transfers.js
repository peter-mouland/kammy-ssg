/* eslint-disable no-param-reassign */
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleTransferData, createNodeId }) => {
    const logEnd = logger.timed('Build: Transfers');

    const transfers = googleTransferData
        .sort((t1, t2) => new Date(t1.timestamp) - new Date(t2.timestamp))
        .map((data) => {
            data.division___NODE = createNodeId(`divisions-${data.divisionId}`);
            data.manager___NODE = createNodeId(`managers-${data.managerId}`);
            data.playerIn___NODE = createNodeId(`players-${data.codeIn}`);
            data.playerOut___NODE = createNodeId(`players-${data.codeOut}`);
            return {
                resourceId: `transfers-${String(data.timestamp)}-${data.managerId}`,
                data,
                internal: {
                    description: 'Transfers',
                    mediaType: mediaTypes.JSON,
                    type: nodeTypes.transfers,
                },
            };
        });
    logEnd();
    return transfers;
};

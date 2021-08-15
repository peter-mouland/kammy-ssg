const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googleTransferData, createNodeId }) => {
    const logEnd = logger.timed('Build: Transfers');

    const transfers = googleTransferData
        .sort((t1, t2) => new Date(t1.timestamp) - new Date(t2.timestamp))
        .map((transfer) => {
            const data = transfer;
            // save keys as ___string for node ids
            data.divisionName = transfer.division;
            data.managerName = transfer.manager;
            data.transferInCode = transfer.codeIn;
            data.transferOutCode = transfer.codeOut;
            // delete dupes to ensure other errors get through
            delete data.division;
            delete data.manager;
            delete data.transferIn;
            delete data.transferOut;

            return {
                resourceId: `transfers-${String(data.timestamp)}-${data.managerName}`,
                data: {
                    ...data,
                    division___NODE: createNodeId(`divisions-${data.divisionName}`),
                    manager___NODE: createNodeId(`managers-${data.managerName}`),
                    transferIn___NODE: createNodeId(`players-${data.transferInCode}`),
                    transferOut___NODE: createNodeId(`players-${data.transferOutCode}`),
                },
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

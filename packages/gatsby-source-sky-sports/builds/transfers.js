const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleTransferData, createNodeId }) => {
    console.log('Build: Transfers start');
    const start = new Date();

    const transfers = googleTransferData
        .sort((t1, t2) => (new Date(t1.timestamp) - new Date(t2.timestamp)))
        .map((transfer) => {
            const data = transfer;

            // save keys as ___string for node ids
            data.divisionName = transfer.division;
            data.managerName = transfer.manager;
            data.transferInName = transfer.transferIn;
            data.transferOutName = transfer.transferOut;
            // delete dupes to ensure other errors get through
            delete data.division;
            delete data.manager;
            delete data.transferIn;
            delete data.transferOut;

            return {
                resourceId: `transfers-${String(data.timestamp)}-${data.manager}`,
                data: {
                    ...data,
                    division___NODE: createNodeId(`divisions-${data.divisionName}`),
                    manager___NODE: createNodeId(`managers-${data.managerName}`),
                    transferIn___NODE: createNodeId(`players-${data.transferInName}`),
                    transferOut___NODE: createNodeId(`players-${data.transferOutName}`),
                },
                internal: {
                    description: 'Transfers',
                    mediaType: mediaTypes.JSON,
                    type: nodeTypes.transfers,
                },
            };
        });
    console.log('Build: Transfers end: ', new Date() - start);
    return transfers;
}

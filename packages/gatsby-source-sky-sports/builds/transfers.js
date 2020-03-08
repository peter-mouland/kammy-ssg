const { nodeTypes, mediaTypes } = require('../lib/constants');


/* TRANSFERS */
const formatTimeStamp = (timestamp = '') => {
  const dateTimeArray = timestamp.split(' ');
  const dateArray = dateTimeArray[0].split('/');
  const year = dateArray[2];
  const month = dateArray[1];
  const day = dateArray[0];
  const time = dateTimeArray[1];
  return `${year}/${month}/${day} ${time}`;
};

module.exports = ({ googleTransferData }) => {
    return googleTransferData.map((transfer) => {
        const data = {
          division: transfer.division,
          status: (transfer.Status || '').trim(),
          timestamp: formatTimeStamp(transfer.Timestamp),
          date: transfer.Timestamp,
          comment: (transfer.Comment || '').trim(),
          manager: (transfer.Manager || '').trim(),
          transferIn: transfer['Transfer In'],
          codeIn: transfer['Code In'],
          transferOut: transfer['Transfer Out'],
          codeOut: transfer['Code Out'],
          type: transfer['Transfer Type'],
        };
        return {
            resourceId: `transfers-${String(transfer.timestamp)}-${transfer.Manager }`,
            data,
            internal: {
                description: 'Transfers',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.transfers,
            },
        };
  });
};


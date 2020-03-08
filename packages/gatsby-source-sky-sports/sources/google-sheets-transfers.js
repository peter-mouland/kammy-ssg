const toDate = require('../lib/to-date');
const fetch = require('../lib/fetch-google-spreadsheet');
const { spreadsheets } = require('../lib/constants');

/* TRANSFERS */
const formatTimeStamp = (timestamp = '') => {
  const dateTimeArray = timestamp.split(' ');
  const dateArray = dateTimeArray[0].split('/');
  const year = dateArray[2];
  const month = dateArray[1];
  const day = dateArray[0];
  const time = dateTimeArray[1];
  return toDate(`${year}/${month}/${day} ${time}`);
};

const formatTransfer = ({
  Comment = '', Status, Timestamp, Manager, ...item
}) => ({
  comment: Comment.trim(),
  status: Status.trim(),
  timestamp: formatTimeStamp(Timestamp),
  manager: Manager.trim(),
  transferIn: item['Transfer In'],
  codeIn: item['Code In'],
  transferOut: item['Transfer Out'],
  codeOut: item['Code Out'],
  type: item['Transfer Type'],
});

const formatTransfers = (data = []) => {
  try {
    return data.map(formatTransfer);
  } catch (e) {
    console.error('formatTransfers error');
    console.error(e);
    return [];
  }
};

module.exports = (division) => fetch(spreadsheets.TRANSFERS_ID, `/values/${division}`).then(formatTransfers);

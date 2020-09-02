const parseISO = require('date-fns/parseISO');

const formatTimeStamp = (timestamp = '') => {
    const dateTimeArray = timestamp.split(' ');
    const dateArray = dateTimeArray[0].split('/');
    const year = dateArray[2];
    const month = dateArray[1];
    const day = dateArray[0];
    const time = dateTimeArray[1];
    return parseISO(`${year}/${month}/${day} ${time}`);
};

const formatTransfers = (data = [], division) => {
    try {
        return data.map(({ Comment = '', Status, Timestamp, Manager, ...item }) => ({
            division,
            comment: Comment.trim(),
            status: Status.trim(),
            isValid: Status === 'Y',
            isPending: Status === 'TBC',
            isFailed: Status === 'E',
            timestamp: formatTimeStamp(Timestamp),
            date: Timestamp,
            manager: Manager.trim(),
            transferIn: item['Transfer In'],
            codeIn: item['Code In'],
            transferOut: item['Transfer Out'],
            codeOut: item['Code Out'],
            type: item['Transfer Type'],
        }));
    } catch (e) {
        console.error('formatTransfers error');
        console.error(e);
        return [];
    }
};

module.exports = formatTransfers;

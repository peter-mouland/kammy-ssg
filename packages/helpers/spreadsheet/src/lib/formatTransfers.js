const { getUtcDate, getGmtDate } = require('@kammy/helpers.get-gmt-date');

// timestamp is GMT, set to iso to prevent new date from changing it by an hour
const formatTimeStamp = (timestamp = '') => getUtcDate(timestamp);

const formatTransfers = (data = [], division) => {
    try {
        return data.map(({ Comment = '', Status, Timestamp, Manager, ...item }) => {
            /*
            // Within BST, these are my results:
            // let's see what happens
            Timestamp: "Sat, 12 Sep 2020 09:13:54 GMT"
            getGmtDate: Sat Sep 12 2020 11:13:54 GMT+0100 (British Summer Time) {}
            getUtcDate: Sat Sep 12 2020 09:13:54 GMT+0100 (British Summer Time) {}
            d: Sat Sep 12 2020 09:13:54 GMT+0100 (British Summer Time) {}
            console.log({
                Timestamp,
                getGmtDate: getGmtDate(Timestamp),
                getUtcDate: getUtcDate(Timestamp),
                d: new Date(getUtcDate(Timestamp)),
            })
             */
            return {
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
            }
        });
    } catch (e) {
        console.error('formatTransfers error');
        console.error(e);
        return [];
    }
};

module.exports = formatTransfers;

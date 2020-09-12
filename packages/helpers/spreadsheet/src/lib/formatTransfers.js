const formatTransfers = (data = [], division) => {
    try {
        return data.map(({ Comment = '', Status, Timestamp, Manager, ...item }) => {
            return {
                division,
                comment: Comment.trim(),
                status: Status.trim(),
                isValid: Status === 'Y',
                isPending: Status === 'TBC',
                isFailed: Status === 'E',
                timestamp: new Date(Timestamp),
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
